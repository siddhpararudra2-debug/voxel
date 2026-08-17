# Nebula Bound — Design Directions

## Three approaches considered

### 1. Orbital Field Manual
**Very Brief Intro:** A practical aerospace field instrument translated into a living game interface: dense where it needs to be, calm where it matters, and emotionally grounded in the feeling of operating a fragile craft far from home.

**Probability:** 0.071

### 2. Archive of a Lost Expedition
**Very Brief Intro:** A tactile retrofuturist archive built from star charts, numbered cargo manifests, faded thermal-print textures, and museum-grade astronomical plates. It makes the game feel discovered rather than manufactured.

**Probability:** 0.038

### 3. Signal Burn
**Very Brief Intro:** A dark, high-contrast arcade transmission with saturated electric color, scanline artifacts, and sharp chromatic interference. It would favor energy and immediacy over physical credibility.

**Probability:** 0.086

---

# Chosen Direction: Orbital Field Manual

## Design Movement

**Industrial aerospace modernism** informed by spacecraft flight manuals, mission-control telemetry, orbital photography, and the restrained visual language of real navigation instruments. The world should feel inhabited by systems with engineering constraints, not by generic science-fiction decoration.

## Core Principles

1. **Operational clarity before ornament.** Every panel, indicator, and world-space display should look like it can be used under pressure.
2. **Material realism through restraint.** Use low-key charcoal, deep navy, smoked glass, brushed-metal linework, and sparse luminous telemetry instead of glossy gradients or visual noise.
3. **Scale through asymmetric framing.** Interfaces should hug corners and cockpit geometry, leaving the world, horizon, and player movement unobstructed.
4. **Information as atmosphere.** Oxygen, reactor temperature, velocity, and resource data are both gameplay tools and evidence that the craft is alive.

## Color Philosophy

Space is represented as **near-black ultramarine**, never flat black, to retain depth around stars and voxel silhouettes. System-critical states use a deliberately narrow warm-to-cool language: **Perihelion Amber** is the ownable active color for thrust, interactable mechanisms, and live telemetry; ice-cyan marks neutral environmental information; oxide red appears only for damage or danger. This preserves instant readability and avoids indiscriminate rainbow HUDs.

## Layout Paradigm

The game is an **instrument periphery**, not a centered dashboard. Information lives in structural zones: a vertical left-side mission rail, a lower-right flight telemetry wedge, an upper-right compact vessel state strip, and an intentional central void reserved for the 3D world. Menus slide from the edge as equipment drawers rather than appearing as centered cards.

## Signature Elements

1. **Bracketed telemetry:** open-corner frames, alignment ticks, and exacting baseline rules around key readings.
2. **Orbit-line cartography:** fine elliptical paths and rotating coordinate arcs used subtly in title, loading, and navigational states.
3. **Machined state lamps:** small, square, emissive status nodes that communicate survival systems without relying on large colored pills.

## Interaction Philosophy

Inputs should feel like operating equipment. A pointer-lock click enters the simulation; inventory and market panels open as deliberate equipment bays; useful keyboard commands are always visible in the UI language. Hover states brighten linework and reveal an annotation, while active controls make a brief physical compression before responding.

## Animation

World-facing motion is slow and environmental: stars drift, dust moves in depth, atmospheric haze breathes, and telemetry bands sweep with a low-frequency cadence. Interface animation stays short and mechanical: drawers travel from their physical edge in 220ms, key status changes blink once, and reticles settle with a 140ms ease-out. Use only opacity and transforms, respect reduced-motion preferences, and avoid continuous neon pulsing.

## Typography System

**Barlow Condensed** carries display headings, numbers, and acceleration/velocity readouts with a tall, engineered silhouette. **IBM Plex Mono** carries labels, commands, coordinates, and resource values. Headings use wide tracking and concise phrases; data labels use all caps at small sizes with generous letterspacing; no default sans-serif is used as the visual identity.

## Brand Essence

**Nebula Bound is the tactile browser sandbox for crews who want to build, fly, and survive inside a persistent voxel galaxy.**

Personality: **methodical, expansive, resilient.**

## Brand Voice

The voice is brief, procedural, and quietly human: it treats the player as a capable crew member, not a customer. Headlines state a physical condition or mission opportunity; CTAs use decisive technical verbs; microcopy names the system consequence.

> “Hull integrity is a decision you can build.”

> “Enter cockpit — flight controls will bind to this vessel.”

## Wordmark & Logo

The wordmark is a custom, condensed **NEBULA BOUND** lockup with a clipped horizontal crossbar in the B and a thin orbital arc passing behind the final word. The accompanying symbol is a bold, text-free **split-vector compass mark**: a central amber diamond with two offset orbital brackets, designed to read as both a navigation reticle and a modular voxel assembly.

## Signature Brand Color

**Perihelion Amber — `#F6A53A`**. It is reserved for powered systems, primary calls to action, interaction reticles, and the logo mark.

## Implementation Commitments

The first playable build will prioritize the PRD’s core demonstrable loop: procedural voxel terrain and a constructed vessel, pointer-lock first-person walking and zero-G movement, cockpit-bound flight with dynamic mass feedback, diegetic in-world telemetry, responsive HUD overlays, inventory/crafting, market/faction equipment bays, and an observable multiplayer-ready network status. The PRD does not include a server endpoint, so the client will expose a typed Socket.io integration boundary and demonstrate local synchronized state without inventing a backend protocol.

## Style Decisions

- Every first-visible state must include the Nebula Bound mark or wordmark, a clear mission/status rail, a live telemetry cluster, and one Perihelion Amber powered-system action.
- The central viewport remains open for world-space piloting; the left, lower-right, upper-right, and lower screen edges carry the cockpit’s bracket lines, lamps, ticks, orbit arcs, and data frames.
- Interface copy addresses the player as crew and states system consequences directly, for example: “Enter cockpit — flight controls will bind to this vessel.”
