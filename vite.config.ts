import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import { WebSocketServer, WebSocket } from 'ws';

function coresenseDevRelay(): Plugin {
  return {
    name: 'coresense-dev-relay',
    configureServer(server) {
      // 1. Local Network IP API
      server.middlewares.use('/api/host-info', (_req, res) => {
        const ifaces = os.networkInterfaces();
        const networkIps: string[] = [];
        for (const dev in ifaces) {
          for (const details of ifaces[dev] || []) {
            if (details.family === 'IPv4' && !details.internal) {
              networkIps.push(details.address);
            }
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(
          JSON.stringify({
            networkIps,
            primaryIp: networkIps[0] || 'localhost',
            port: server.config.server.port || 5173,
          })
        );
      });

      // 2. WebSocket Relay for cross-device local communication
      const wss = new WebSocketServer({ noServer: true });
      const rooms = new Map<string, Set<WebSocket>>();

      wss.on('connection', (ws: WebSocket, req) => {
        let currentRoom: string | null = null;

        // Parse query params if room passed in URL: e.g. ws://host:5173/coresense-ws?room=8492
        if (req.url) {
          try {
            const parsed = new URL(req.url, 'http://localhost');
            const room = parsed.searchParams.get('room');
            if (room) {
              currentRoom = room;
              if (!rooms.has(room)) {
                rooms.set(room, new Set());
              }
              rooms.get(room)!.add(ws);
            }
          } catch {}
        }

        ws.on('message', (raw) => {
          try {
            const data = JSON.parse(raw.toString());

            // Handle Room Join message
            if (data.type === 'JOIN_ROOM') {
              if (currentRoom && rooms.has(currentRoom)) {
                rooms.get(currentRoom)!.delete(ws);
              }
              currentRoom = data.roomCode;
              if (!rooms.has(data.roomCode)) {
                rooms.set(data.roomCode, new Set());
              }
              rooms.get(data.roomCode)!.add(ws);
              return;
            }

            // Relay message to all other clients in the room
            const targetRoom = data.roomCode || currentRoom;
            if (targetRoom && rooms.has(targetRoom)) {
              const clients = rooms.get(targetRoom)!;
              const payloadStr = JSON.stringify(data);
              for (const client of clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(payloadStr);
                }
              }
            }
          } catch {}
        });

        ws.on('close', () => {
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom)!.delete(ws);
            if (rooms.get(currentRoom)!.size === 0) {
              rooms.delete(currentRoom);
            }
          }
        });
      });

      if (server.httpServer) {
        server.httpServer.on('upgrade', (req, socket, head) => {
          if (req.url && req.url.startsWith('/coresense-ws')) {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          }
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), coresenseDevRelay()],
  server: {
    host: true,
    port: 5173,
  },
});
