# PRD 1 — Client Frontend Reconciliation

This document records the implementation status of `PRD_1_Client_Frontend.docx`. The browser client retains its original industrial-aerospace interface while adding the standalone-development and authoritative-transport requirements introduced by the revised PRD.

| PRD requirement | Implementation status | Location |
| --- | --- | --- |
| TypeScript, Vite, Three.js, Cannon-es, React, Tailwind, Socket.io-client | Complete | Root manifest and `client/src/` |
| 1×1×1 meter block vocabulary and 16×16×16 greedy-meshed chunks | Complete | `client/src/voxels/` |
| Under-100 draw-call target for starter scene | Observable | HUD exposes renderer draw calls; the starter scene uses one greedy terrain mesh per chunk. |
| Cannon-es capsule collider, pointer-lock movement, jump and EVA | Complete | `client/src/physics/PlayerController.ts` |
| Cockpit seating and six-degree flight | Complete | `client/src/physics/ShipController.ts`, `client/src/engine/NebulaEngine.ts` |
| Live center-of-mass calculation from attached ship blocks | Complete | `client/src/physics/ShipController.ts` |
| React inventory and operational overlay | Complete | `client/src/components/` |
| Diegetic cockpit and EVA-visor oxygen, reactor, fuel, altitude, and velocity displays | Complete | `client/src/engine/DiegeticTelemetry.ts` |
| Supabase JWT handshake and `player:move`, `voxel:modify`, `ship:steer` contract | Complete | `client/src/network/NetworkClient.ts`, `client/src/network/protocol.ts` |
| Typed listeners for server room, player, voxel, ship, and error events | Complete | `client/src/network/NetworkClient.ts`, `client/src/engine/NebulaEngine.ts` |
| Local mock server and IndexedDB standalone persistence | Complete | `client/src/network/MockNetworkServer.ts`, `client/src/network/LocalPersistence.ts` |

## Operational mode

When `VITE_SOCKET_URL` and a valid Supabase access token are available, the client sends the token through Socket.io `auth.token` and an `Authorization: Bearer` handshake header, joins the configured room, emits the shared movement, voxel, and ship events, and displays the server connection state. With no token or endpoint, it enters an explicit **MOCK LINK** state that exercises the same event schemas against an in-browser mock transport and stores the field session in IndexedDB.

## Remaining deployment input

The frontend contract is complete. To operate against a real persistent galaxy, provide a deployed `VITE_SOCKET_URL`, a Supabase authentication journey that obtains the user access token, and a matching server `CORS_ORIGIN`. The client does not embed a privileged Supabase key or infer production credentials.
