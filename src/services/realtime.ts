import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
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
  public roomCode: string = '';
  public role: 'simulator' | 'phone' = 'simulator';
  private listener: RealtimeListener | null = null;
  private status: ConnectionState = 'connecting';
  private isPeerJoined: boolean = false;
  private heartbeatTimer: number | null = null;

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

    // Check if counterpart client is already in the same page/window (e.g., Split Demo mode)
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

    // 2. Setup localStorage cross-window fallback event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }

    // 3. Setup Supabase Realtime Channel if credentials exist
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
      // Offline / Demo fallback
      if (counterpartFound) {
        this.setStatus('connected');
      } else if (this.role === 'simulator') {
        this.setStatus('waiting');
      } else {
        this.setStatus('connected');
        this.sendMessage({
          type: 'PHONE_JOINED',
          payload: { roomCode, joinedAt: Date.now() },
        });
      }
    }

    this.startHeartbeat();
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
    const payloadWithMeta = {
      ...msg,
      _senderRole: this.role,
      _sentAt: Date.now(),
    };

    // 1. Direct In-Memory Dispatch to counterpart in the same window (e.g. Split Demo)
    for (const other of activeClients) {
      if (other !== this && other.roomCode === this.roomCode) {
        other.handleIncomingMessage(payloadWithMeta);
      }
    }

    // 2. Supabase Cloud Broadcast (to other devices over internet)
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

    // 3. Local BroadcastChannel (to other tabs in the same browser)
    if (this.localBroadcast) {
      try {
        this.localBroadcast.postMessage(payloadWithMeta);
      } catch {}
    }

    // 4. LocalStorage fallback (to other windows)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          `coresense-storage-${this.roomCode}`,
          JSON.stringify(payloadWithMeta)
        );
      } catch {}
    }
  }

  public handleIncomingMessage(msg: SyncMessage & { _senderRole?: string }) {
    if (!msg || msg._senderRole === this.role) {
      return;
    }

    // Connection indicator
    if (msg.type === 'PHONE_JOINED') {
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
