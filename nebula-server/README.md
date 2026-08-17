# Nebula Bound Server

This directory contains the authoritative backend for **Nebula Bound**, a browser-based multiplayer voxel sandbox. It provides authenticated Express APIs, Socket.io room synchronization, server-side movement and voxel validation, faction permissions, Supabase persistence, and a ten-second dirty-state auto-save worker.

## Requirements

Use Node.js 20 or newer and a Supabase project. Apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI. The server requires both the Supabase anonymous key, used to validate user JWTs, and the service-role key, used only on the trusted server for persistence. Never expose the service-role key to a browser client.

## Local setup

Copy `.env.example` to `.env`, fill in the Supabase values, install dependencies, then compile and start the server:

```bash
cp .env.example .env
pnpm install
./node_modules/.bin/tsc -p tsconfig.json
node dist/server.js
```

The health endpoint is available at `GET /health`. The server listens on port `3000` by default. Use a process supervisor or a hosted always-on Node service for production because WebSocket rooms and the auto-save worker maintain live in-memory state.

## Authentication

Every Socket.io connection must send a Supabase access token in one of these forms:

```ts
io('https://your-server.example', { auth: { token: supabaseAccessToken } });
```

or as an HTTP `Authorization: Bearer <token>` handshake header. Invalid or missing tokens are rejected during the handshake. HTTP routes requiring authentication use the same bearer-token convention.

## Socket.io protocol

Clients join a room with `room:join`, then receive `room:joined`, `player:joined`, `player:moved`, `voxel:modified`, `ship:steered`, and `player:left` events. The server enforces a maximum of ten concurrent players per room, validates movement distance against elapsed time and the configured speed limit, and rate-limits voxel edits.

| Event | Direction | Payload summary |
|---|---|---|
| `room:join` | Client to server | `{ roomId, username?, position? }` |
| `player:move` | Client to server | `{ position, velocity, rotation }` |
| `voxel:modify` | Client to server | `{ chunkKey, x, y, z, block, factionId? }` |
| `ship:steer` | Client to server | `{ shipId, thrusters, coreTemperature, fuel }` |
| `server:error` | Server to client | `{ event, message }` |

The server rejects malformed payloads and emits `server:error` rather than trusting client state. A client must join a room before broadcasting gameplay events.

## Persistence and recovery

The worker scans dirty chunks, active player state, and dirty ships every `AUTOSAVE_INTERVAL_MS`, which defaults to 10,000 milliseconds. It writes batches through Supabase upserts. If a write fails, dirty state remains marked and is retried on the next interval. Shutdown handlers stop the interval, flush once, and then close the HTTP server.

## Faction APIs

Authenticated clients can call `POST /api/factions` with `{ "name": "My Faction" }` and `POST /api/factions/:factionId/members` with `{ "userId": "..." }`. Factions are capped at ten members. Base-building permission is represented in memory and persisted in `faction_members`; voxel edits carrying a `factionId` are rejected unless the authenticated user has build permission.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP and WebSocket port | `3000` |
| `CORS_ORIGIN` | Allowed browser origin | `*` |
| `ROOM_MAX_PLAYERS` | Room and faction capacity | `10` |
| `AUTOSAVE_INTERVAL_MS` | Auto-save interval | `10000` |
| `MAX_MOVE_SPEED` | Maximum validated movement speed | `40` |
| `MAX_VOXEL_EDITS_PER_SECOND` | Per-user voxel edit limit | `30` |

## Production notes

Run exactly one persistent server instance per authoritative room-state domain unless room state is moved to a shared coordination layer. Use TLS at the edge, restrict `CORS_ORIGIN`, rotate Supabase keys through the hosting provider's secret manager, and monitor the `/health` and `/ready` endpoints. The current implementation deliberately fails closed for authentication and preserves dirty state on persistence errors.
