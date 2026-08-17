# Nebula Bound

**Nebula Bound** is a browser-based voxel space sandbox. The repository contains the WebGL client that renders and simulates the player experience, plus an authoritative multiplayer backend that validates state, coordinates rooms, and persists world data.

> **Project status:** The client is playable with an explicit IndexedDB-backed local mock or an authenticated Socket.io session. It implements the shared room, movement, voxel, and ship event contract; a deployed server URL, a Supabase sign-in journey that obtains the access token, and production hosting configuration remain the operational handoff. See the [integration guide](docs/CLIENT_SERVER_INTEGRATION.md).

## What is in this repository

| Area | Location | Responsibility |
| --- | --- | --- |
| Browser client | `client/` | React interface, Three.js rendering, greedy-meshed voxel terrain, Cannon-es movement and ship physics, flight telemetry, and Socket.io client boundary. |
| Authoritative server | `nebula-server/` | Express health/API routes, authenticated Socket.io rooms, movement and voxel validation, faction permissions, autosave, and Supabase persistence. |
| Design and build notes | `ideas.md`, `PLAN.md`, `STRUCTURE.md`, `ASSETS.md` | Visual direction, verification criteria, code ownership, and generated asset manifest. |
| Engineering docs | `docs/` | System architecture, client-server integration contract, and documentation index. |

## Key capabilities

The client presents a full-screen **Orbital Field Manual** interface around a Three.js world. It creates 16×16×16 voxel chunks with greedy face merging, supports pointer-lock surface traversal and altitude-triggered EVA movement with a Cannon-es capsule approximation, and lets a player bind to a modular ship cockpit for six-degree flight. Vessel mass and center of mass are recalculated from attached block modules, while the HUD and diegetic cockpit/visor displays expose oxygen, fuel, reactor load, hull, speed, altitude, draw-call count, and network state.

The server is designed as the authoritative multiplayer layer. It authenticates Socket.io handshakes with Supabase access tokens, limits rooms to ten players, validates movement and voxel mutations, restricts faction construction, and retries dirty-state persistence through its autosave worker.

## Prerequisites

Use **Node.js 20 or newer** and **pnpm 10 or newer**. The server also requires a Supabase project with the migration in `nebula-server/supabase/migrations/001_initial_schema.sql` applied before it can authenticate or persist world state.

## Quick start

Clone the repository and install the browser client dependencies from the repository root.

```bash
git clone https://github.com/siddhpararudra2-debug/voxel.git
cd voxel
pnpm install
cp .env.example .env
pnpm dev
```

The Vite client will start on the address printed in the terminal. Open the root URL for the interactive access sequence. Add `?demo` to the URL to open the deterministic demonstration view without acquiring pointer lock.

In a second terminal, configure and start the multiplayer backend.

```bash
cd nebula-server
cp .env.example .env
# Add valid Supabase values to .env before starting the service.
pnpm install
pnpm dev
```

The backend defaults to `http://localhost:3000`; its unauthenticated health endpoint is available at `GET /health`.

## Configuration

The root `.env.example` is for the browser client. The `VITE_` prefix is required because Vite exposes only prefixed variables to client-side code. Do not place private service keys in this file.

| Browser variable | Purpose | Example |
| --- | --- | --- |
| `VITE_SOCKET_URL` | Base URL for the Socket.io multiplayer service. Omit it to keep the client in explicit local-simulation mode. | `http://localhost:3000` |

The server’s environment configuration is in `nebula-server/.env.example`.

| Server variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP and Socket.io listening port. | `3000` |
| `CORS_ORIGIN` | Single permitted browser origin. Use a deployed client URL in production. | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL. | Required |
| `SUPABASE_ANON_KEY` | Public Supabase key used to validate user tokens. | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used for persistence. Never expose it to a browser. | Required |
| `ROOM_MAX_PLAYERS` | Maximum players per room and faction. | `10` |
| `AUTOSAVE_INTERVAL_MS` | Interval for flushing dirty state. | `10000` |
| `MAX_MOVE_SPEED` | Server-side movement validation limit. | `40` |
| `MAX_VOXEL_EDITS_PER_SECOND` | Per-user world-edit limit. | `30` |

## Controls

| Input | Action |
| --- | --- |
| Click **Enter Orbital Layer** | Binds pointer lock and begins the session. |
| Mouse | Looks around while pointer lock is active. |
| `W`, `A`, `S`, `D` | Walks on the surface or applies directional flight input. |
| `Space` | Jumps while grounded; ascends with EVA thrusters in zero gravity. |
| `Shift` | Descends during EVA. |
| `F` | Enters or leaves the ship cockpit when within range. |
| `E` | Opens loadout and fabrication. |
| `M` | Opens the market terminal. |
| `G` | Opens faction link status. |
| `Escape` | Closes an open equipment drawer. |

## Repository commands

### Browser client

| Command | Result |
| --- | --- |
| `pnpm dev` | Runs the Vite development server. |
| `pnpm check` | Runs TypeScript without emitting files. |
| `pnpm build` | Builds the client and production static host bundle. |
| `pnpm preview` | Serves the client’s production Vite output locally. |
| `pnpm format` | Formats source files with Prettier. |

### Multiplayer backend

Run these commands from `nebula-server/`.

| Command | Result |
| --- | --- |
| `pnpm dev` | Runs the TypeScript server with watch mode. |
| `pnpm lint` | Type-checks the server. |
| `pnpm test` | Runs server tests. |
| `pnpm build` | Compiles the server to `dist/`. |
| `pnpm start` | Starts the compiled server. |

## Architecture and integration

The browser client and server intentionally have separate lifecycles. The client can ship through static hosting, whereas the Socket.io service must run on an always-on Node.js environment because it maintains active room state and a persistence worker. Read the following documents before extending either side.

| Document | Use it for |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Module ownership, runtime boundaries, persistence flow, and rendering/physics responsibilities. |
| [Client-server integration](docs/CLIENT_SERVER_INTEGRATION.md) | Socket authentication, authoritative event mapping, current integration gap, and completion checklist. |
| [PRD 1 reconciliation](PRD_1_RECONCILIATION.md) | Requirement-by-requirement record for the updated frontend PRD. |
| [Backend guide](nebula-server/README.md) | Server-specific configuration, protocol, persistence, and operational behavior. |
| [Contributing](CONTRIBUTING.md) | Local workflow, change-quality requirements, testing, and security rules. |
| [Documentation index](docs/README.md) | A compact map of all repository documents. |

## Quality checks

The client build has been verified with `pnpm check` and `pnpm build`. Before merging an engineering change, run the relevant client or server checks, verify the interactive route in a real browser, and update the integration document whenever an event, payload, or authority boundary changes.

## Deployment boundaries

The browser client can be published as a static frontend. The authoritative server must be deployed separately to a persistent Node.js service with TLS, a fixed public URL, and private Supabase keys stored in the hosting provider’s secret manager. Configure the client’s `VITE_SOCKET_URL` and the server’s `CORS_ORIGIN` to point to each other’s deployed public origins.

## License

This repository declares the MIT license in its client package manifest. Add a root `LICENSE` file before public distribution if a formal license text is required.
