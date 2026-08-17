# Nebula Bound — Client Structure

## Runtime Ownership

`GameCanvas` owns the HTML canvas lifecycle. `NebulaEngine` owns Three.js, Cannon, renderer timing, pointer lock, camera transforms, the `PlayerController`, the `ShipController`, and the chunk manager. React owns panels and reads game telemetry only; it never mutates Three.js scene objects directly.

## Directories

| Location | Responsibility |
| --- | --- |
| `client/src/engine/` | Renderer, scene, lights, procedural sky, animation loop, camera and pointer lock. |
| `client/src/voxels/` | Block definitions, chunk buffer generation, greedy meshing, static chunk placement. |
| `client/src/physics/` | Cannon player movement, EVA logic, ship body, thrust, torque, center-of-mass calculation. |
| `client/src/network/` | Typed Socket.io singleton and public state/event boundary. |
| `client/src/shaders/` | Atmosphere and black-hole-lensing GLSL source; atmosphere is active in the opening scene. |
| `client/src/components/` | Canvas lifecycle and the React HUD/equipment drawers. |

## Data Contracts

`GameTelemetry` is the sole engine-to-React state contract. It carries movement mode, physical readings, center of mass, hull integrity, and network state. `NetworkClient` performs an optional Supabase JWT handshake, emits `room:join`, `player:move`, `voxel:modify`, and `ship:steer`, and presents an explicit mock transport when a live session is unavailable. `MockNetworkServer` exercises the same typed payloads in standalone mode, while `LocalPersistence` retains non-authoritative room and crew metadata in IndexedDB.

## Asset Hints

The generated reference plates are UI/environmental support assets. All navigable geometry remains procedural, using cubes and custom meshing so game interactions always map cleanly to 1×1×1 meter voxel blocks.
