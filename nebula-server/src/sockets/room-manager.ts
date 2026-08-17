import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { Faction, PlayerState, ShipState, VoxelChunk } from '../models/domain.js';
import { PhysicsValidator } from '../physics/validation.js';

export interface Room {
  roomId: string;
  createdAt: number;
  players: Map<string, PlayerState>;
}

export class RoomManager {
  readonly rooms = new Map<string, Room>();
  readonly chunks = new Map<string, VoxelChunk>();
  readonly ships = new Map<string, ShipState>();
  readonly factions = new Map<string, Faction>();
  private readonly editCounters = new Map<string, { windowStart: number; count: number }>();
  private readonly physics = new PhysicsValidator();

  join(roomId: string, player: PlayerState): Room {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { roomId, createdAt: Date.now(), players: new Map() };
      this.rooms.set(roomId, room);
    }
    if (!room.players.has(player.userId) && room.players.size >= env.ROOM_MAX_PLAYERS) {
      throw new Error('Room is full');
    }
    room.players.set(player.userId, player);
    return room;
  }

  leave(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    room?.players.delete(userId);
    if (room && room.players.size === 0) this.rooms.delete(roomId);
  }

  get(roomId: string): Room | undefined { return this.rooms.get(roomId); }

  updatePlayer(roomId: string, userId: string, patch: Pick<PlayerState, 'position' | 'velocity' | 'rotation'>): PlayerState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    const current = room.players.get(userId);
    if (!current) throw new Error('Player is not in room');
    if (!this.physics.validateMove(current.position, patch.position, (Date.now() - current.updatedAt) / 1000)) {
      throw new Error('Movement rejected by server validation');
    }
    const next = { ...current, ...patch, updatedAt: Date.now() };
    room.players.set(userId, next);
    return next;
  }

  modifyVoxel(userId: string, chunkKey: string, x: number, y: number, z: number, block: unknown): VoxelChunk {
    if (!this.physics.validateVoxelEdit(chunkKey, x, y, z)) throw new Error('Invalid voxel coordinate');
    const now = Date.now();
    const counter = this.editCounters.get(userId) ?? { windowStart: now, count: 0 };
    if (now - counter.windowStart >= 1000) { counter.windowStart = now; counter.count = 0; }
    counter.count += 1;
    this.editCounters.set(userId, counter);
    if (counter.count > env.MAX_VOXEL_EDITS_PER_SECOND) throw new Error('Voxel edit rate limit exceeded');
    const existing = this.chunks.get(chunkKey) ?? { chunkKey, blockData: {}, updatedAt: now, dirty: true };
    const data = (existing.blockData && typeof existing.blockData === 'object') ? { ...(existing.blockData as Record<string, unknown>) } : {};
    data[`${x},${y},${z}`] = block;
    const updated = { ...existing, blockData: data, updatedAt: now, dirty: true };
    this.chunks.set(chunkKey, updated);
    return updated;
  }

  createFaction(name: string, leaderId: string, factionId: string = randomUUID()): Faction {
    const faction: Faction = { factionId, name, leaderId, memberIds: new Set([leaderId]), friendlyFire: false, basePermissions: new Set([leaderId]) };
    this.factions.set(faction.factionId, faction);
    return faction;
  }

  getFaction(factionId: string): Faction | undefined { return this.factions.get(factionId); }

  canAddFactionMember(factionId: string, userId: string, requestedBy: string): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) throw new Error('Faction not found');
    if (faction.leaderId !== requestedBy) throw new Error('Only the faction leader can add members');
    return faction.memberIds.has(userId) || faction.memberIds.size < env.ROOM_MAX_PLAYERS;
  }

  addFactionMember(factionId: string, userId: string, requestedBy: string): Faction {
    const faction = this.factions.get(factionId);
    if (!faction) throw new Error('Faction not found');
    if (faction.leaderId !== requestedBy) throw new Error('Only the faction leader can add members');
    if (!faction.memberIds.has(userId) && faction.memberIds.size >= env.ROOM_MAX_PLAYERS) throw new Error('Faction is full');
    faction.memberIds.add(userId);
    faction.basePermissions.add(userId);
    return faction;
  }

  canBuild(factionId: string | undefined, userId: string): boolean {
    return !factionId || Boolean(this.factions.get(factionId)?.basePermissions.has(userId));
  }

  dirtySnapshot(): { chunks: VoxelChunk[]; players: PlayerState[]; ships: ShipState[] } {
    const players = [...this.rooms.values()].flatMap((room) => [...room.players.values()]);
    return { chunks: [...this.chunks.values()].filter((c) => c.dirty), players, ships: [...this.ships.values()].filter((s) => s.dirty) };
  }

  markClean(): void {
    for (const chunk of this.chunks.values()) chunk.dirty = false;
    for (const ship of this.ships.values()) ship.dirty = false;
  }
}
