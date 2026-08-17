import { io, type Socket } from 'socket.io-client';
import { randomUUID } from 'node:crypto';

const url = process.env.NEBULA_SERVER_URL ?? 'http://localhost:3000';
const token = process.env.SUPABASE_TEST_TOKEN;
const durationMs = Number(process.env.STRESS_DURATION_MS ?? 5_000);
const roomId = `stress-${randomUUID()}`;

if (!token) {
  console.error('Set SUPABASE_TEST_TOKEN to a valid Supabase access token before running the stress harness.');
  process.exit(1);
}

const sockets: Socket[] = [];
let broadcasts = 0;
let errors = 0;

await Promise.all(Array.from({ length: 10 }, async (_, index) => {
  const socket = io(url, { auth: { token }, reconnection: false, transports: ['websocket'] });
  sockets.push(socket);
  socket.on('player:moved', () => { broadcasts += 1; });
  socket.on('server:error', () => { errors += 1; });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => {
      socket.emit('room:join', { roomId, username: `stress-${index}` });
      resolve();
    });
    socket.once('connect_error', reject);
  });
}));

const started = Date.now();
while (Date.now() - started < durationMs) {
  for (const [index, socket] of sockets.entries()) {
    socket.emit('player:move', {
      position: { x: index * 0.01, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 20));
}

for (const socket of sockets) socket.close();
console.log(JSON.stringify({ clients: sockets.length, roomId, broadcasts, protocolErrors: errors, durationMs }));
if (sockets.length !== 10 || errors > 0) process.exit(1);
