# Coding Conventions

These conventions enforce modularity and replaceable subsystems for oort.tsx.

## Naming and API Design

- Use descriptive names and avoid abbreviations in exported symbols.
- Model every subsystem behind an explicit public interface in `src/contracts/index.ts`.
- Export one creation function per subsystem (`createEngine`, `createSimulationSystem`, etc.).
- Use dependency injection when wiring subsystems to avoid hidden coupling.

## State and Side Effects

- Avoid global mutable state.
- Keep simulation state inside the simulation subsystem.
- Keep UI as a consumer of state snapshots, not a source of truth.

## Documentation and Comments

- Add comments only when logic is non-obvious.
- Keep module-level files short and focused.

## Workflow and Quality Gates

- Run `npm run lint`, `npm run format`, and `npm run test:ci` before opening a PR.
- Keep changes in feature branches and submit through PR review.
- CI must pass before merge.
