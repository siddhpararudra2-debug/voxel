# Nebula Bound Documentation

This directory explains the boundaries that are easy to lose when a graphical voxel client and a realtime authoritative backend evolve at different speeds.

| Document | Purpose |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Shows system ownership, module boundaries, world state flow, and deployment responsibilities. |
| [Client-server integration](CLIENT_SERVER_INTEGRATION.md) | Defines the Socket.io contract, authentication handoff, current client/server mismatch, and the work required for live multiplayer. |

The root [README](../README.md) provides the project overview and setup instructions. The server’s own [README](../nebula-server/README.md) is the operational source of truth for its environment and persistence behavior.
