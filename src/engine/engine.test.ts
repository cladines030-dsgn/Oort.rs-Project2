import { createEngine, type EngineScheduler } from "./index";
import type {
  CombatSystem,
  EditorSystem,
  SimulationStateSnapshot,
  SimulationSystem,
  UiSystem
} from "../contracts";

class FakeScheduler implements EngineScheduler {
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  private nowMs = 0;

  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    return id;
  }

  cancelAnimationFrame(id: number): void {
    this.callbacks.delete(id);
  }

  now(): number {
    return this.nowMs;
  }

  advance(milliseconds: number): void {
    this.nowMs += milliseconds;
    const batch = [...this.callbacks.entries()];
    this.callbacks.clear();
    for (const [, callback] of batch) {
      callback(this.nowMs);
    }
  }
}

function createSimulationMock(): { simulation: SimulationSystem; getStepCount: () => number } {
  let stepCount = 0;
  let state: SimulationStateSnapshot = {
    tick: 0,
    seed: 0,
    ships: [],
    projectileCount: 0
  };

  return {
    simulation: {
      initialize(seed: number): void {
        stepCount = 0;
        state = { ...state, tick: 0, seed };
      },
      step(): SimulationStateSnapshot {
        stepCount += 1;
        state = { ...state, tick: state.tick + 1 };
        return state;
      },
      getState(): SimulationStateSnapshot {
        return state;
      },
      registerShipCodeHook(): void {
        // no-op
      }
    },
    getStepCount(): number {
      return stepCount;
    }
  };
}

function createCombatMock(): CombatSystem {
  return {
    initialize(): void {
      // no-op
    },
    resolveTick(): void {
      // no-op
    }
  };
}

function createEditorMock(): EditorSystem {
  return {
    initialize(): void {
      // no-op
    },
    getProgramSource(): string {
      return "function update() {}";
    }
  };
}

function createUiMock(): UiSystem {
  return {
    mount(): void {
      // no-op
    },
    updateStatus(): void {
      // no-op
    },
    render(): void {
      // no-op
    }
  };
}

describe("engine fixed timestep loop", () => {
  test("runs simulation in fixed-size steps regardless of frame duration", () => {
    const scheduler = new FakeScheduler();
    const simulationMock = createSimulationMock();

    const engine = createEngine(
      {
        simulation: simulationMock.simulation,
        combat: createCombatMock(),
        editor: createEditorMock(),
        ui: createUiMock(),
        timestepSeconds: 1 / 60
      },
      scheduler
    );

    engine.start(99);

    scheduler.advance(50);
    scheduler.advance(16.6667);

    expect(simulationMock.getStepCount()).toBe(4);
  });
});
