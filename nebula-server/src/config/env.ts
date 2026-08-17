import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ROOM_MAX_PLAYERS: z.coerce.number().int().positive().default(10),
  AUTOSAVE_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
  MAX_MOVE_SPEED: z.coerce.number().positive().default(40),
  MAX_VOXEL_EDITS_PER_SECOND: z.coerce.number().int().positive().default(30)
});

export const env = schema.parse(process.env);
