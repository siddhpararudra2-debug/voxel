/** Orbital Field Manual reminder: network messages are compact operational records; authority remains explicit and observable. */
export type Vector3 = { x: number; y: number; z: number };
export type Rotation = { x: number; y: number; z: number; w: number };

export type PlayerState = { userId: string; username: string; position: Vector3; velocity: Vector3; rotation: Rotation; updatedAt: number };
export type RoomJoinPayload = { roomId: string; username?: string; position?: Vector3 };
export type PlayerMovePayload = { position: Vector3; velocity: Vector3; rotation: Rotation };
export type VoxelModifyPayload = { chunkKey: string; x: number; y: number; z: number; block: number; factionId?: string };
export type ShipSteerPayload = { shipId: string; thrusters: Record<string, boolean>; coreTemperature: number; fuel: number };

export type ClientEventMap = {
  "room:join": RoomJoinPayload;
  "player:move": PlayerMovePayload;
  "voxel:modify": VoxelModifyPayload;
  "ship:steer": ShipSteerPayload;
};

export type ServerEventMap = {
  "room:joined": { roomId: string; players: PlayerState[] };
  "player:joined": PlayerState;
  "player:moved": PlayerState;
  "player:left": { userId: string };
  "voxel:modified": VoxelModifyPayload & { userId: string; updatedAt: number };
  "ship:steered": ShipSteerPayload & { userId: string; timestamp: number };
  "server:error": { event: keyof ClientEventMap; message: string };
};

export const INBOUND_EVENTS = ["room:joined", "player:joined", "player:moved", "player:left", "voxel:modified", "ship:steered", "server:error"] as const satisfies readonly (keyof ServerEventMap)[];
