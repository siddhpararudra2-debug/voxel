import { z } from 'zod';

export const vector3Schema = z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite() }).strict();
export const rotationSchema = z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite(), w: z.number().finite().optional() }).strict();

export const roomJoinSchema = z.object({ roomId: z.string().trim().min(1).max(64), username: z.string().trim().min(1).max(32).optional(), position: vector3Schema.optional() }).strict();
export const playerMoveSchema = z.object({ position: vector3Schema, velocity: vector3Schema, rotation: rotationSchema }).strict();
export const voxelModifySchema = z.object({ chunkKey: z.string().regex(/^-?\d+_-?\d+_-?\d+$/), x: z.number().int().min(0).max(15), y: z.number().int().min(0).max(15), z: z.number().int().min(0).max(15), block: z.unknown(), factionId: z.string().uuid().optional() }).strict();
export const shipSteerSchema = z.object({ shipId: z.string().uuid(), thrusters: z.record(z.boolean()), coreTemperature: z.number().finite().min(0), fuel: z.number().finite().min(0).max(1) }).strict();

export type RoomJoinPayload = z.infer<typeof roomJoinSchema>;
export type PlayerMovePayload = z.infer<typeof playerMoveSchema>;
export type VoxelModifyPayload = z.infer<typeof voxelModifySchema>;
export type ShipSteerPayload = z.infer<typeof shipSteerSchema>;

export function parseContract<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) throw new Error(`Invalid event payload: ${result.error.issues.map((issue) => issue.path.join('.') || 'payload').join(', ')}`);
  return result.data;
}
