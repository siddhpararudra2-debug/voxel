export type UserId = string;

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
  w?: number;
}

export interface PlayerState {
  userId: UserId;
  username: string;
  position: Vector3;
  velocity: Vector3;
  rotation: Rotation;
  updatedAt: number;
}

export interface VoxelChunk {
  chunkKey: string;
  blockData: unknown;
  updatedAt: number;
  dirty: boolean;
}

export interface ShipState {
  shipId: string;
  ownerId: UserId;
  voxelMatrix: unknown;
  position: Vector3;
  velocity: Vector3;
  updatedAt: number;
  dirty: boolean;
}

export interface Faction {
  factionId: string;
  name: string;
  leaderId: UserId;
  memberIds: Set<UserId>;
  friendlyFire: boolean;
  basePermissions: Set<UserId>;
  doorPasscodeHash?: string;
}

export interface RoomSnapshot {
  roomId: string;
  players: PlayerState[];
  createdAt: number;
}
