# Nebula Bound — Implementation Notes

- The PRD mandates Three.js, Cannon-es, React, Tailwind, and Socket.io-client. The client uses those exact runtime libraries.
- The selected GitHub repository contained only a README, so the managed WebDev project is the implementation source of truth.
- The PRD does not define a backend URL or event schema. `VITE_SOCKET_URL` is optional and its typed boundaries are intentionally conservative.
- The WebDev host supplies React 19 and Vite. React is used only for the outer frame and panels, leaving frame-critical rendering inside `NebulaEngine`.
- `?demo` enables deterministic movement and a cockpit camera so the game can be reviewed without a pointer-lock click.
