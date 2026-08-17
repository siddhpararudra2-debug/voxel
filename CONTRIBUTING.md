# Contributing to Nebula Bound

Nebula Bound is split between a frame-critical browser client and an authoritative multiplayer service. Contributions should preserve that boundary: presentation and local prediction belong in the client, while security-sensitive world changes, persistence, and player authority belong on the server.

## Local workflow

Start with the root [README](README.md) and bring up the client and server independently. Use `pnpm dev` from the repository root for the Vite client. Use `pnpm dev` from `nebula-server/` for the Socket.io service after configuring its Supabase environment. Keep server credentials in `nebula-server/.env`; do not copy them into a browser-facing `.env` file.

## Branches and commits

Create a focused branch per concern. A change that modifies a network payload should include the corresponding client and server work or state clearly which side intentionally remains pending. Commit messages should lead with an imperative verb and name the affected surface, such as `Add voxel edit acknowledgement` or `Document server deployment boundary`.

## Coding conventions

Client gameplay code belongs in `client/src/engine`, `client/src/voxels`, `client/src/physics`, or `client/src/network`; React should remain a UI frame around the canvas rather than becoming the source of physics or rendering truth. Server validation lives in `nebula-server/src/physics` and socket handlers; never trust a client-provided position, edit, faction permission, or inventory balance.

The visual system follows the **Orbital Field Manual** direction described in `ideas.md`: use near-black ultramarine for space, Perihelion Amber only for active or critical systems, and compact instrument-periphery UI that preserves a clear central viewport. Follow the reminder comments at the top of client UI and style files when extending them.

## Required checks

| Change type | Required validation |
| --- | --- |
| Client TypeScript or UI | `pnpm check`, `pnpm build`, then inspect the access screen and `?demo` route in a browser. |
| Voxel, physics, or flight logic | The client checks above plus manual verification of the affected movement transition and HUD reading. |
| Backend service or protocol | From `nebula-server/`, run `pnpm lint`, `pnpm test`, and `pnpm build`. |
| Database migration | Review the SQL carefully, apply it only to an appropriate environment, and test a clean local/server startup. |
| Documentation | Verify every command, pathname, variable name, and event payload against the implementation. |

## Pull requests

Describe the user-visible outcome, the authority model, and the validation performed. For visual changes, include a screenshot of the relevant state. For networking changes, include the event direction, full payload schema, validation behavior, and whether the server broadcasts an acknowledgement or state correction.

## Security and operational rules

The Supabase service-role key is server-only. Do not commit `.env` files, secrets, access tokens, or production URLs with embedded credentials. Restrict `CORS_ORIGIN` outside local development, retain the server’s validation and rate limits, and treat modifications to auth, persistence, faction permission, or movement validation as security-sensitive.
