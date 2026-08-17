# Nebula Bound — Implementation Notes

- The PRD mandates Three.js, Cannon-es, React, Tailwind, and Socket.io-client. The client uses those exact runtime libraries.
- The selected GitHub repository contained only a README, so the managed WebDev project is the implementation source of truth.
- The PRD does not define a backend URL or event schema. `VITE_SOCKET_URL` is optional and its typed boundaries are intentionally conservative.
- The WebDev host supplies React 19 and Vite. React is used only for the outer frame and panels, leaving frame-critical rendering inside `NebulaEngine`.
- `?demo` enables deterministic movement and a cockpit camera so the game can be reviewed without a pointer-lock click.
- PRD 1 adds strict parallel-integration requirements. The backend accepts `auth.token` or `Authorization: Bearer` during the Socket.io handshake, then expects `room:join`, `player:move`, `voxel:modify`, and `ship:steer`. The client now follows those schemas rather than emitting its retired `player:state` placeholder.
- `socket.io-client` browser transports cannot rely solely on custom WebSocket headers, so `auth.token` is the reliable primary JWT path; the Authorization header is also supplied for compatible transports and to reflect the shared contract.
