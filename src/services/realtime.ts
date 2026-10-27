import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { Peer, DataConnection } from 'peerjs';
import { SyncMessage } from '../types';

export type ConnectionState = 'connecting' | 'waiting' | 'connected' | 'demo_local';

export interface RealtimeListener {
  onMessage: (msg: SyncMessage) => void;
  onConnectionChange: (status: ConnectionState) => void;
}

// Registry of all active clients within the current window/process
const activeClients: Set<RealtimeClient> = new Set();

export class RealtimeClient {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private localBroadcast: BroadcastChannel | null = null;

  // Vite Dev Server WebSocket Relay
  private relayWs: WebSocket | null = null;
  private wsReconnectTimer: number | null = null;

  // PeerJS WebRTC Direct DataChannel
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private peerReconnectTimer: number | null = null;

  public roomCode: string = '';
  public role: 'simulator' | 'phone' = 'simulator';
  private listener: RealtimeListener | null = null;
  private status: ConnectionState = 'connecting';
  private isPeerJoined: boolean = false;
  private heartbeatTimer: number | null = null;

  // Message deduplication cache
  private processedMsgIds: Set<string> = new Set();

  constructor() {
    this.initSupabase();
  }

  private initSupabase() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && key && url !== 'https://your-project.supabase.co') {
      try {
        this.supabase = createClient(url, key, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
      } catch (err) {
        console.warn('[Coresense Realtime] Could not initialize Supabase client:', err);
      }
    }
  }

  public joinRoom(roomCode: string, role: 'simulator' | 'phone', listener: RealtimeListener) {
    this.leaveRoom();
    this.roomCode = roomCode;
    this.role = role;
    this.listener = listener;
    this.isPeerJoined = false;

    activeClients.add(this);
    this.setStatus('connecting');

    // 0. Check in-memory counterparts (Split screen mode)
    let counterpartFound = false;
    for (const other of activeClients) {
      if (other !== this && other.roomCode === roomCode) {
        counterpartFound = true;
        this.isPeerJoined = true;
        other.isPeerJoined = true;
        other.setStatus('connected');
        break;
      }
    }

    // 1. Setup Local Cross-Tab / Cross-Window BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(`coresense-bc-${roomCode}`);
        this.localBroadcast.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }

    // 2. Setup localStorage cross-window fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }

    // 3. Setup Vite Dev Server WebSocket Relay (for laptop <-> mobile cross-device communication)
    this.initWebSocketRelay();

    // 4. Setup PeerJS WebRTC Direct Connection (for browser-to-browser P2P across internet)
    this.initPeerJs();

    // 5. Setup Supabase Realtime Channel if credentials exist
    if (this.supabase) {
      const channelName = `coresense-room-${roomCode}`;
      this.channel = this.supabase.channel(channelName, {
        config: {
          broadcast: { ack: false, self: false },
          presence: { key: role },
        },
      });

      this.channel
        .on('broadcast', { event: 'coresense-event' }, ({ payload }) => {
          this.handleIncomingMessage(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel?.presenceState() || {};
          const presences = Object.keys(state);
          if (presences.length > 1) {
            this.isPeerJoined = true;
            this.setStatus('connected');
          }
        })
        .subscribe((subscribeStatus) => {
          if (subscribeStatus === 'SUBSCRIBED') {
            this.channel?.track({ role, joinedAt: Date.now() });

            if (this.role === 'phone') {
              this.sendMessage({
                type: 'PHONE_JOINED',
                payload: { roomCode, joinedAt: Date.now() },
              });
              this.sendMessage({
                type: 'REQUEST_STATE',
                payload: { roomCode },
              });
              this.setStatus('connected');
            } else {
              if (counterpartFound || this.isPeerJoined) {
                this.setStatus('connected');
              } else {
                this.setStatus('waiting');
              }
            }
          }
        });
    } else {
      // Default initial state
      if (counterpartFound) {
        this.setStatus('connected');
      } else if (this.role === 'simulator') {
        this.setStatus('waiting');
      } else {
        // Phone joined
        this.setStatus('connected');
        this.sendMessage({
          type: 'PHONE_JOINED',
          payload: { roomCode, joinedAt: Date.now() },
        });
        this.sendMessage({
          type: 'REQUEST_STATE',
          payload: { roomCode },
        });
      }
    }

    this.startHeartbeat();
  }

  // --- WebSocket Relay Implementation ---
  private initWebSocketRelay() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/coresense-ws?room=${this.roomCode}&role=${this.role}`;
      const ws = new WebSocket(wsUrl);
      this.relayWs = ws;

      ws.onopen = () => {
        // Send room join command
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: this.roomCode,
            role: this.role,
          })
        );

        if (this.role === 'phone') {
          this.sendMessage({
            type: 'PHONE_JOINED',
            payload: { roomCode: this.roomCode, joinedAt: Date.now() },
          });
          this.sendMessage({
            type: 'REQUEST_STATE',
            payload: { roomCode: this.roomCode },
          });
          this.isPeerJoined = true;
          this.setStatus('connected');
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.handleIncomingMessage(parsed);
          }
        } catch {}
      };

      ws.onclose = () => {
        this.relayWs = null;
        // Auto-reconnect after 3s if still in room
        if (this.roomCode) {
          this.wsReconnectTimer = window.setTimeout(() => {
            if (this.roomCode) {
              this.initWebSocketRelay();
            }
          }, 3000);
        }
      };

      ws.onerror = () => {
        // Dev server WS may not exist in pure production preview; PeerJS/Supabase take over
      };
    } catch {}
  }

  // --- PeerJS WebRTC P2P Implementation ---
  private initPeerJs() {
    if (typeof window === 'undefined') return;

    try {
      const isSimulator = this.role === 'simulator';
      // Deterministic ID for simulator so phone can directly connect
      const simPeerId = `coresense-twin-${this.roomCode}`;
      const myPeerId = isSimulator
        ? simPeerId
        : `coresense-caregiver-${this.roomCode}-${Math.floor(Math.random() * 100000)}`;

      const peer = new Peer(myPeerId, {
        debug: 0,
      });
      this.peer = peer;

      peer.on('open', () => {
        if (!isSimulator) {
          // Phone connects to simulator's peer ID
          this.connectToPeer(simPeerId);
        }
      });

      peer.on('connection', (conn) => {
        this.setupPeerDataConnection(conn);
      });

      peer.on('error', (err: { type?: string }) => {
        // If simulator ID is temporarily occupied, fallback with random suffix
        if (isSimulator && err?.type === 'unavailable-id') {
          try {
            peer.destroy();
            const fallbackId = `${simPeerId}-${Math.floor(Math.random() * 10000)}`;
            this.peer = new Peer(fallbackId);
            this.peer.on('connection', (c) => this.setupPeerDataConnection(c));
          } catch {}
        }
      });
    } catch (e) {
      console.warn('[Coresense Realtime] PeerJS init note:', e);
    }
  }

  private connectToPeer(targetPeerId: string) {
    if (!this.peer || this.peer.destroyed) return;
    try {
      const conn = this.peer.connect(targetPeerId, {
        reliable: true,
      });
      this.setupPeerDataConnection(conn);
    } catch {}
  }

  private setupPeerDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.peerConnections.set(conn.peer, conn);
      this.isPeerJoined = true;
      this.setStatus('connected');

      if (this.role === 'phone') {
        this.sendMessage({
          type: 'PHONE_JOINED',
          payload: { roomCode: this.roomCode, joinedAt: Date.now() },
        });
        this.sendMessage({
          type: 'REQUEST_STATE',
          payload: { roomCode: this.roomCode },
        });
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingMessage(data as SyncMessage);
    });

    conn.on('close', () => {
      this.peerConnections.delete(conn.peer);
    });

    conn.on('error', () => {
      this.peerConnections.delete(conn.peer);
    });
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === `coresense-storage-${this.roomCode}` && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && parsed._senderRole !== this.role) {
          this.handleIncomingMessage(parsed);
        }
      } catch {}
    }
  };

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.sendMessage({
        type: 'HEARTBEAT',
        payload: { sender: this.role, timestamp: Date.now() },
      });
    }, 4000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public setStatus(newStatus: ConnectionState) {
    this.status = newStatus;
    if (this.listener) {
      this.listener.onConnectionChange(newStatus);
    }
  }

  public sendMessage(msg: SyncMessage) {
    const msgId = `${this.role}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payloadWithMeta = {
      ...msg,
      roomCode: this.roomCode,
      _msgId: msgId,
      _senderRole: this.role,
      _sentAt: Date.now(),
    };

    // Mark as locally processed so loopback doesn't re-trigger
    this.processedMsgIds.add(msgId);
    if (this.processedMsgIds.size > 200) {
      const first = this.processedMsgIds.values().next().value;
      if (first) this.processedMsgIds.delete(first);
    }

    // 1. Direct In-Memory Dispatch (e.g. Split Demo in same tab)
    for (const other of activeClients) {
      if (other !== this && other.roomCode === this.roomCode) {
        other.handleIncomingMessage(payloadWithMeta);
      }
    }

    // 2. Vite Dev Server WebSocket Relay (instant cross-device over local Wi-Fi / LAN)
    if (this.relayWs && this.relayWs.readyState === WebSocket.OPEN) {
      try {
        this.relayWs.send(JSON.stringify(payloadWithMeta));
      } catch {}
    }

    // 3. PeerJS WebRTC Direct DataChannel (instant cross-device over internet P2P)
    this.peerConnections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payloadWithMeta);
        } catch {}
      }
    });

    // 4. Supabase Cloud Broadcast (if configured in .env)
    if (this.channel) {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'coresense-event',
          payload: payloadWithMeta,
        });
      } catch (err) {
        console.warn('Failed to broadcast on Supabase channel:', err);
      }
    }

    // 5. Local BroadcastChannel (to other tabs in the same browser)
    if (this.localBroadcast) {
      try {
        this.localBroadcast.postMessage(payloadWithMeta);
      } catch {}
    }

    // 6. LocalStorage fallback (to other windows)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          `coresense-storage-${this.roomCode}`,
          JSON.stringify(payloadWithMeta)
        );
      } catch {}
    }
  }

  public handleIncomingMessage(
    msg: SyncMessage & { _senderRole?: string; _msgId?: string; roomCode?: string }
  ) {
    if (!msg || msg._senderRole === this.role) {
      return;
    }

    // Filter by roomCode if present
    if (msg.roomCode && msg.roomCode !== this.roomCode) {
      return;
    }

    // Deduplication check
    if (msg._msgId) {
      if (this.processedMsgIds.has(msg._msgId)) {
        return;
      }
      this.processedMsgIds.add(msg._msgId);
      if (this.processedMsgIds.size > 200) {
        const first = this.processedMsgIds.values().next().value;
        if (first) this.processedMsgIds.delete(first);
      }
    }

    // Connection indicators
    if (msg.type === 'PHONE_JOINED' || msg.type === 'REQUEST_STATE') {
      this.isPeerJoined = true;
      this.setStatus('connected');
    } else if (msg.type === 'HEARTBEAT') {
      if (!this.isPeerJoined) {
        this.isPeerJoined = true;
        this.setStatus('connected');
      }
    }

    if (this.listener) {
      this.listener.onMessage(msg);
    }
  }

  public leaveRoom() {
    this.stopHeartbeat();
    activeClients.delete(this);

    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    if (this.peerReconnectTimer) {
      clearTimeout(this.peerReconnectTimer);
      this.peerReconnectTimer = null;
    }

    if (this.relayWs) {
      try {
        this.relayWs.close();
      } catch {}
      this.relayWs = null;
    }

    this.peerConnections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.peerConnections.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    if (this.localBroadcast) {
      try {
        this.localBroadcast.close();
      } catch {}
      this.localBroadcast = null;
    }
    if (this.channel && this.supabase) {
      try {
        this.channel.unsubscribe();
      } catch {}
      this.channel = null;
    }
    this.listener = null;
    this.status = 'connecting';
    this.isPeerJoined = false;
  }
}

// Factory to create a client per component instance
export function createRealtimeClient(): RealtimeClient {
  return new RealtimeClient();
}

// Global default instance for single-view mode
export const realtimeManager = new RealtimeClient();

export function generateRandomRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
