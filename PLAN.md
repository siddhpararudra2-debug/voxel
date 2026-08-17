# Game Plan: Nebula Bound

## Risk Tasks

### 1. Voxel chunks and greedy meshing
- **Why isolated:** Runtime mesh generation can create invalid normals, wrong face winding, or excessive draw calls when a chunk’s visible faces are merged incorrectly.
- **Approach:** Generate fixed 16×16×16 chunk buffers, evaluate exposed block faces on all three axes, and merge adjacent coplanar equal-type faces into indexed-free colored quads. Keep each chunk as one mesh and dispose rebuilt geometries.
- **Verify:** The starting asteroid visibly consists of block-scale features, has no obvious inside-out faces, and the renderer reports one mesh per chunk rather than one mesh per block.

### 2. Pointer-lock first-person and zero-G transition
- **Why isolated:** Pointer lock needs a user gesture, and walking/jetpack control can feel broken if ground and zero-G acceleration share the same velocity model.
- **Approach:** Use a Cannon body for collision/gravity state, a semantic input map, camera yaw/pitch managed by the Three.js engine, and altitude-driven gravity/jetpack rules.
- **Verify:** Clicking Launch binds pointer lock; W/A/S/D follows the camera heading; Space jumps near terrain and applies EVA ascent after crossing the space threshold; Shift descends in EVA; the HUD changes from Surface to EVA.

### 3. Cockpit-bound ship controls and dynamic center of mass
- **Why isolated:** The vehicle needs a stable transition between on-foot and flight control, and a block’s mass should visibly affect center-of-mass telemetry without destabilizing the render transform.
- **Approach:** Represent the ship as a Cannon body with a separate Three.js group. Calculate weighted local block positions after every build change, drive main thrust and yaw torque from semantic actions, and re-bind the camera only while flight mode is active.
- **Verify:** F near the cockpit changes the HUD to Flight, W/S changes vessel speed, A/D changes heading, F exits flight, and crafting a cargo module shifts the reported center-of-mass value.

## Main Build

The client consists of a full-screen Three.js scene, an industrial-aerospace React overlay, procedural terrain chunks, a modular ship, survival telemetry, equipment drawers, and a typed Socket.io client boundary. It is a standalone playable client demonstration: the PRD references a backend owned by another agent, so the UI transparently labels the networking layer as local standby until `VITE_SOCKET_URL` is provided.

- **Assets:**
  - Generated in-game reference / launch plate — 1920×1080, fills the access screen.
  - Generated orbital dock plate — 1920×1080, supports the equipment-drawer background.
  - Generated cockpit instrument surface — 1920×1080, used behind right-side flight telemetry.
  - Generated logistics card — 512×512, used as an inventory material tile.
  - Generated split-vector compass mark — 512×512 transparent PNG, used in the access screen and HUD.
- **Verify:**
  - Pointer-lock input produces visible walking, EVA, and flight responses.
  - Cannon bodies receive gravity/collision updates and the ship receives force/torque input.
  - Terrain and ship blocks render without missing materials; chunky terrain uses generated greedy meshes.
  - Oxygen, fuel, reactor, altitude, speed, center of mass, and network status are readable at desktop and mobile widths.
  - E opens the inventory/crafting drawer; M opens Market; G opens Faction; buttons are keyboard reachable.
  - `?demo` opens a deterministic auto-pilot mode suitable for visual proof without pointer lock.
  - The scene remains readable and no browser console errors occur during a captured run.

## Scope Boundary

This delivery implements the complete **client-side demonstrator** specified in the PRD. A persistent ten-player world, credentials, authoritative inventory, and market transactions require the separately specified backend endpoint and protocol; the typed event boundary is present so those systems can be connected without rewriting the game loop.

## PRD 1 Completion Addendum

The revised frontend PRD adds a local-development contract and an explicit authenticated integration handshake. The client now uses a compound Cannon-es capsule approximation, applies six-degree vessel forces and torques, renders diegetic cockpit/visor telemetry, sends `player:move`, `voxel:modify`, and `ship:steer` schemas, consumes the server event set, and runs an IndexedDB-backed mock transport when an endpoint or token is absent. See `PRD_1_RECONCILIATION.md` for the requirement-by-requirement record.
