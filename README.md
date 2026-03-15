# Oort.js (Checkpoint 1 Baseline)

Browser-native strategy simulator foundation inspired by Oort.rs.

## Checkpoint 1 Scope Implemented

- Modular boundaries created at `src/engine`, `src/combat`, `src/simulation`, `src/ui`, and `src/editor`.
- Public subsystem interfaces are centralized in `src/contracts/index.ts`.
- Browser-first TypeScript + Vite development environment is configured.
- Linting, formatting, and test harness are configured with ESLint, Prettier, and Vitest.
- CI is configured in `.github/workflows/ci.yml` to run lint, format checks, tests, and build.
- Coding conventions are documented in `docs/coding-conventions.md`.

## Project Structure

```
src/
	app/
	combat/
	contracts/
	editor/
	engine/
	simulation/
	ui/
```

## Local Development

```bash
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`) in a browser.

## Quality Commands

```bash
npm run lint
npm run format
npm run test:ci
npm run build
```

## Notes

- This baseline intentionally keeps combat/editor internals minimal while locking in stable interfaces.
- The fixed-step engine loop and deterministic simulation seed handling are in place as a starting point for Checkpoint 2.


# Oort.rs Game Interface

This is a code bundle for Oort.rs Game Interface. The original project is available at https://www.figma.com/design/O0MFFMHHTfaERiuyunAZ5P/Oort.rs-Game-Interface.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.
  
