# oort.tsx

oort.tsx is a browser-native programming strategy simulator inspired by Oort.rs. Players write TypeScript to control ships, run deterministic combat scenarios in the browser, and iterate against tutorials and challenge modes through a React-based interface.

## Project Scope

- Physics-driven ship movement with acceleration, braking, heading, and waypoint helpers.
- Combat systems with ship loadouts, projectile travel, collision detection, damage, cooldowns, and combat event logs.
- A sandboxed ship-program execution layer that runs user `update(ship)` code each tick and blocks unsafe host APIs.
- Browser UI flows for Home, Tutorial, Challenges, and Game screens.
- A canvas-backed simulation view wired into the real engine.
- Starter-code driven scenarios, including an implemented target-practice challenge mode.

The project is structured so engine, simulation, combat, editor, sandbox, and UI systems remain replaceable behind stable contracts.

### Core Systems

- `src/engine`: fixed-timestep orchestration, lifecycle, and render interpolation.
- `src/simulation`: deterministic world state, ship entities, movement, and state snapshots.
- `src/combat`: weapon resolution, projectiles, collision checks, damage, and combat events.
- `src/sandbox`: restricted execution of player-authored ship code with runtime guards and structured logs.
- `src/editor`: program source management used by the game flow.
- `src/ui`: canvas attachment and render integration for the simulation view.
- `src/contracts`: shared public interfaces for all major subsystems.

### Player-Facing App Areas

- Home page introducing the project and entry points.
- Tutorial flow with starter lessons and scenario-specific starter code.
- Challenge flow with target practice implemented and other challenge routes scaffolded.
- Game screen that creates fresh engine/simulation/combat/editor/sandbox/UI systems for each run.

### Current Ship Programming API

The current sandboxed ship API supports status reads and core control/combat commands such as:

- `position()`, `velocity()`, `heading()`, `health()`, `fuel()`
- `thrust()`, `strafe()`, `brake()`, `setHeading()`, `moveTo()`
- `accelerate()`, `turn()`, `torque()`
- `fire()`, `reloadTicks()`

Additional Oort-inspired systems described in `constitution.md`, such as radar, radio, and broader scenario tooling, remain part of the intended direction but are not all implemented in the current API surface.

## Tech Stack

- TypeScript
- React 19
- React Router
- Vite
- Vitest
- ESLint + Prettier
- Tailwind CSS utilities in the frontend layer

## Project Structure

```text
src/
	app/         React application shell, routes, pages, and components
	combat/      Combat resolution and projectile systems
	contracts/   Shared subsystem interfaces and public types
	editor/      Program source management
	engine/      Main loop, timing, and orchestration
	math/        Vector math utilities
	sandbox/     Sandboxed ship-code compilation and execution
	simulation/  Deterministic world state and ship simulation
	ui/          Rendering integration
```

## Local Development

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, typically `http://localhost:5173`.

## Quality Commands

```bash
npm run lint
npm run format
npm run test
npm run test:ci
npm run build
```

## Project Status

This repository currently represents an in-progress but functional browser simulation prototype rather than a finished clone of Oort.rs.


## Reference Docs

- `constitution.md`: long-term project goals, architecture, and gameplay direction
- `implementation-plan.md`: checkpoint-based delivery plan
- `docs/coding-conventions.md`: code style and engineering expectations
