import type { SimulationStateSnapshot, SimulationSystem } from "../contracts";

interface SimulationState {
  tick: number;
  ships: number;
  projectiles: number;
  seed: number;
  rngState: number;
}

function lcgNext(value: number): number {
  return (1664525 * value + 1013904223) >>> 0;
}

function cloneSnapshot(state: SimulationState): SimulationStateSnapshot {
  return {
    tick: state.tick,
    ships: state.ships,
    projectiles: state.projectiles,
    seed: state.seed
  };
}

export function createSimulationSystem(): SimulationSystem {
  let state: SimulationState = {
    tick: 0,
    ships: 2,
    projectiles: 0,
    seed: 1,
    rngState: 1
  };

  return {
    initialize(seed: number): void {
      state = {
        tick: 0,
        ships: 2,
        projectiles: 0,
        seed,
        rngState: seed >>> 0
      };
    },
    step(_deltaSeconds: number): SimulationStateSnapshot {
      state.tick += 1;
      state.rngState = lcgNext(state.rngState);
      return cloneSnapshot(state);
    },
    getState(): SimulationStateSnapshot {
      return cloneSnapshot(state);
    }
  };
}
