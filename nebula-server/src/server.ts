import http from 'node:http';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { authenticateSocket, requireAuth, type AuthenticatedRequest } from './auth/auth.js';
import { GameRepository } from './database/repository.js';
import { AutosaveWorker } from './services/autosave.js';
import { RoomManager } from './sockets/room-manager.js';
import type { PlayerState, Vector3, Rotation } from './models/domain.js';
import { parseContract, roomJoinSchema, playerMoveSchema, voxelModifySchema, shipSteerSchema } from './types/contracts.js';

const app: Express = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const repository = new GameRepository();
const rooms = new RoomManager();
const autosave = new AutosaveWorker(rooms, repository);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'nebula-bound-server', time: new Date().toISOString() }));
app.get('/ready', (_req, res) => res.json({ status: 'ready', rooms: rooms.rooms.size }));
app.get('/api/me', requireAuth, (req: AuthenticatedRequest, res) => res.json({ userId: req.userId }));

app.post('/api/factions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 48) return res.status(400).json({ error: 'Faction name is required and must be 48 characters or fewer' });
    const factionId = await repository.createFaction(name, req.userId!);
    try {
      await repository.addFactionMember(factionId, req.userId!);
      const faction = rooms.createFaction(name, req.userId!, factionId);
      return res.status(201).json({ ...faction, factionId });
    } catch (error) {
      await repository.deleteFaction(factionId).catch((rollbackError) => console.error('[factions] unable to roll back failed faction creation', rollbackError));
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Faction creation failed' });
  }
});

app.post('/api/factions/:factionId/members', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : '';
    const factionId = String(req.params.factionId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const persistedFaction = await repository.getFaction(factionId);
    if (!persistedFaction) return res.status(404).json({ error: 'Faction not found' });
    if (persistedFaction.leaderId !== req.userId) return res.status(403).json({ error: 'Only the faction leader can add members' });
    if (!rooms.getFaction(factionId)) rooms.createFaction(persistedFaction.name, persistedFaction.leaderId, persistedFaction.factionId);
    const canAdd = rooms.canAddFactionMember(factionId, userId, req.userId!);
    if (!canAdd) return res.status(400).json({ error: 'Faction is full' });
    await repository.addFactionMember(factionId, userId);
    try {
      const faction = rooms.addFactionMember(factionId, userId, req.userId!);
      return res.status(200).json(faction);
    } catch (error) {
      await repository.removeFactionMember(factionId, userId).catch((rollbackError) => console.error('[factions] unable to roll back failed membership update', rollbackError));
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to add member';
    const status = message === 'Only the faction leader can add members' ? 403 : message === 'Faction not found' ? 404 : 400;
    return res.status(status).json({ error: message });
  }
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN, credentials: true } });
io.use(authenticateSocket);

function isVector3(value: unknown): value is Vector3 {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return ['x', 'y', 'z'].every((key) => typeof v[key] === 'number' && Number.isFinite(v[key]));
}
function isRotation(value: unknown): value is Rotation {
  return Boolean(value && typeof value === 'object' && ['x', 'y', 'z'].every((key) => typeof (value as Record<string, unknown>)[key] === 'number'));
}

io.on('connection', (socket) => {
  const userId = socket.data.user.userId as string;
  let roomId: string | undefined;
  let player: PlayerState | undefined;

  socket.on('room:join', (rawPayload: unknown) => {
    try {
      const payload = parseContract(roomJoinSchema, rawPayload);
      const requestedRoom = payload.roomId;
      if (!requestedRoom || requestedRoom.length > 64) throw new Error('Invalid room ID');
      roomId = requestedRoom;
      player = {
        userId,
        username: payload.username?.slice(0, 32) || socket.data.user.email || userId.slice(0, 8),
        position: isVector3(payload.position) ? payload.position : { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        updatedAt: Date.now()
      };
      const room = rooms.join(roomId, player);
      socket.join(roomId);
      socket.emit('room:joined', { roomId, players: [...room.players.values()] });
      socket.to(roomId).emit('player:joined', player);
    } catch (error) {
      socket.emit('server:error', { event: 'room:join', message: error instanceof Error ? error.message : 'Join failed' });
    }
  });

  socket.on('player:move', (rawPayload: unknown) => {
    try {
      const payload = parseContract(playerMoveSchema, rawPayload);
      if (!roomId) throw new Error('Join a room first');
      const updated = rooms.updatePlayer(roomId, userId, payload);
      player = updated;
      socket.to(roomId).emit('player:moved', updated);
    } catch (error) {
      socket.emit('server:error', { event: 'player:move', message: error instanceof Error ? error.message : 'Movement rejected' });
    }
  });

  socket.on('voxel:modify', (rawPayload: unknown) => {
    try {
      const payload = parseContract(voxelModifySchema, rawPayload);
      if (!rooms.canBuild(payload.factionId, userId)) throw new Error('Faction permission denied');
      const chunk = rooms.modifyVoxel(userId, payload.chunkKey, payload.x, payload.y, payload.z, payload.block);
      if (!roomId) throw new Error('Join a room first');
      io.to(roomId).emit('voxel:modified', { userId, chunkKey: chunk.chunkKey, x: payload.x, y: payload.y, z: payload.z, block: payload.block, updatedAt: chunk.updatedAt });
    } catch (error) {
      socket.emit('server:error', { event: 'voxel:modify', message: error instanceof Error ? error.message : 'Voxel edit rejected' });
    }
  });

  socket.on('ship:steer', (rawPayload: unknown) => {
    try {
      const payload = parseContract(shipSteerSchema, rawPayload);
      if (!roomId) throw new Error('Join a room first');
      socket.to(roomId).emit('ship:steered', { ...payload, userId, timestamp: Date.now() });
    } catch (error) {
      socket.emit('server:error', { event: 'ship:steer', message: error instanceof Error ? error.message : 'Invalid ship telemetry' });
    }
  });

  socket.on('disconnect', () => {
    if (roomId) { rooms.leave(roomId, userId); socket.to(roomId).emit('player:left', { userId }); }
  });
});

autosave.start();
export const server = httpServer.listen(env.PORT, () => console.log(`Nebula Bound server listening on port ${env.PORT}`));

const shutdown = async (signal: string) => {
  console.log(`[server] ${signal}; flushing state before shutdown`);
  autosave.stop();
  await autosave.flush();
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app, io, rooms, autosave };
