# oort.tsx Implementation Plan

Source: `constitution.md` (Version 1.0, updated 2026-03-09)

This plan breaks development into large checkpoints that can be delivered and validated incrementally. Each checkpoint should end with a playable or testable state.

## Checkpoint 1: Foundation and Architecture Baseline

Goal:
- Establish a browser-native, modular project structure and engineering workflow.

Deliverables:
- Create `/src/engine`, `/src/combat`, `/src/simulation`, `/src/ui`, `/src/editor` module boundaries.
- Define public interfaces between subsystems so internals are replaceable.
- Set up TypeScript/JavaScript tooling, linting, formatting, and test harness.
- Add CI for automated tests and basic build checks.
- Document coding conventions (naming, docs, minimal global state).

Exit criteria:
- Project builds and runs in browser locally.
- Subsystems are imported through explicit interfaces, not tight coupling.
- CI runs on every PR and reports pass/fail.

## Checkpoint 2: Deterministic Simulation Core

Goal:
- Build the fixed-timestep simulation loop independent of rendering speed.

Deliverables:
- Implement core loop: input processing, ship code execution hook, physics update, combat resolution hook, state update.
- Add deterministic seed handling and reproducible world initialization.
- Create simulation state container (ships, projectiles, tick count, RNG state).
- Add deterministic replay test utilities (same seed + code + initial state => same outcome).

Exit criteria:
- Simulation can run headless without renderer.
- Determinism tests pass across repeated runs in the same environment.
- Rendering frame rate changes do not alter simulation outcome.

## Checkpoint 3: Movement and Navigation System

Goal:
- Implement programmable ship movement with realistic constraints.

Deliverables:
- Add movement APIs
- Implement inertial movement, acceleration limits, rotational speed limits.
- Add navigation helpers for waypoint and heading-based movement.
- Add unit tests for movement physics and edge cases.

Exit criteria:
- Ships move predictably under control APIs.
- Movement remains deterministic at fixed tick rate.
- Test scenarios validate inertia and rotation constraints.

## Checkpoint 4: Combat Engine MVP

Goal:
- Deliver autonomous combat with collision and damage resolution.

Deliverables:
- Implement combat APIs
- Add projectile lifecycle with travel time and collision detection.
- Implement cooldowns, hit processing, and damage model.
- Provide first weapon types (projectile baseline, optional missile/energy stubs).

Exit criteria:
- Two scripted fleets can engage and produce deterministic outcomes.
- Combat logs show shots, hits, damage, and eliminations.
- Collision and cooldown rules are validated by automated tests.

## Checkpoint 5: Ship Programming Sandbox

Goal:
- Execute user ship code safely each simulation tick.

Deliverables:
- Implement sandbox execution model using Web Workers or equivalent isolation.
- Expose only approved ship API surface to user scripts.
- Block access to DOM, network, filesystem, and non-approved browser APIs.
- Add script runtime guards (timeouts, error handling, per-tick budget).
- Route user `console` output to game logs.

Exit criteria:
- User `update(ship)` code runs every tick without crashing core simulation.
- Unauthorized API access attempts are denied.
- Script errors are isolated and reported without destabilizing the simulation.

## Checkpoint 6: Visualization and Render Layer

Goal:
- Render battles in real time without affecting simulation determinism.

Deliverables:
- Implement render pipeline (WebGL preferred, Canvas fallback acceptable).
- Visualize ships, projectiles, explosions, sensor ranges, and overlays.
- Decouple render interpolation from fixed simulation ticks.
- Add camera controls and basic battlefield readability improvements.

Exit criteria:
- Real-time battle visualization works at target smoothness on supported browsers.
- Turning rendering off does not change simulation results.
- Visual output reflects authoritative simulation state.

## Checkpoint 7: Editor and UI Integration

Goal:
- Provide the core programming workflow in a modular UI.

Deliverables:
- Integrate code editor (Monaco or CodeMirror).
- Add syntax highlighting, line numbers, error display, auto-format support.
- Implement Run/Reset controls and status indicators.
- Build layout with editor pane, simulation view, logs, controls, and battle status.
- Keep UI components decoupled from simulation internals through interfaces/events.

Exit criteria:
- User can edit ship code, run simulation, and iterate in one screen.
- Editor errors and runtime logs are visible and actionable.
- UI module boundaries allow replacement without rewriting core engine.

## Checkpoint 8: Debugging and Developer Tools

Goal:
- Make strategy iteration and engine diagnosis fast and transparent.

Deliverables:
- Implement simulation logs and ship-script console output panel.
- Add performance stats (tick time, frame time, entity counts).
- Add debug controls: `pause`, `stepFrame`, optional hitbox/vector overlays.
- Add replay capture/load for deterministic regression debugging.

Exit criteria:
- Developers can pause, step, inspect, and reproduce issues reliably.
- Logs and metrics are sufficient to diagnose major gameplay bugs.
- Replay-driven tests can reproduce selected bugs.

## Checkpoint 9: Performance and Scale Hardening

Goal:
- Reach project performance targets while preserving correctness.

Deliverables:
- Profile and optimize simulation hot paths and render bottlenecks.
- Validate 100+ ship scenarios and maintain deterministic tick behavior.
- Maintain responsive UI at target conditions and near-60 FPS rendering.
- Add performance regression tests/benchmarks in CI.

Exit criteria:
- Benchmark scenarios meet or approach 60 FPS rendering targets on baseline hardware.
- 100+ ship battles complete with stable tick rate and deterministic outcomes.
- No critical perf regressions in CI benchmark suite.

## Checkpoint 10: Extensibility and v1 Release Readiness

Goal:
- Finalize v1 architecture and documentation for future growth.

Deliverables:
- Document extension points for new weapons, ship types, and scripting evolutions.
- Define API versioning strategy for gameplay and script interfaces.
- Record non-goals for v1 (no server infra, no multiplayer networking, no accounts).
- Complete end-to-end tests for playable loops and core developer workflows.
- Prepare release docs, contribution guidelines, and roadmap for post-v1 features.

Exit criteria:
- Core gameplay loop is stable, test-covered, and documented.
- New feature prototypes can be added through defined interfaces.
- v1 scope is clearly complete and non-goals are explicitly deferred.

## Suggested Delivery Gates

1. Gate A (after Checkpoint 4): deterministic headless combat prototype.
2. Gate B (after Checkpoint 7): first complete playable browser workflow.
3. Gate C (after Checkpoint 9): performance-validated beta.
4. Gate D (after Checkpoint 10): v1 release candidate.

## Success Metrics Across All Checkpoints

- Determinism: identical input conditions produce identical outputs.
- Security: user scripts remain sandboxed with no prohibited API access.
- Modularity: subsystems can be replaced behind stable interfaces.
- Usability: rapid code-edit-run-debug iteration loop in browser.
- Performance: responsive UI, scalable battles, stable simulation ticks.
