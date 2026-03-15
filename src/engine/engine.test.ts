import { createEngine, type EngineScheduler } from "./index";
import type {
  CombatSystem,
  EditorSystem,
  ShipSandboxSystem,
  SimulationStateSnapshot,
  SimulationSystem,
  UiRenderFrame,
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
    worldSize: 20_000,
    ships: [],
    projectiles: [],
    combatEvents: []
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
  let source = "function update() {}";

  return {
    initialize(): void {
      // no-op
    },
    getProgramSource(): string {
      return source;
    },
    setProgramSource(next: string): void {
      source = next;
    },
    resetProgramSource(): string {
      source = "function update() {}";
      return source;
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
    },
    renderScriptLogs(): void {
      // no-op
    },
    getProgramSource(): string {
      return "function update() {}";
    },
    setProgramSource(): void {
      // no-op
    },
    onRunRequested(): void {
      // no-op
    },
    onStopRequested(): void {
      // no-op
    },
    onResetRequested(): void {
      // no-op
    }
  };
}

function createUiRecorderMock(): { ui: UiSystem; frames: UiRenderFrame[] } {
  const frames: UiRenderFrame[] = [];

  return {
    ui: {
      mount(): void {
        // no-op
      },
      updateStatus(): void {
        // no-op
      },
      render(frame: UiRenderFrame): void {
        frames.push(frame);
      },
      renderScriptLogs(): void {
        // no-op
      },
      getProgramSource(): string {
        return "function update() {}";
      },
      setProgramSource(): void {
        // no-op
      },
      onRunRequested(): void {
        // no-op
      },
      onStopRequested(): void {
        // no-op
      },
      onResetRequested(): void {
        // no-op
      }
    },
    frames
  };
}

function createSandboxMock(): ShipSandboxSystem {
  return {
    initialize(): void {
      // no-op
    },
    execute(): void {
      // no-op
    },
    flushLogs() {
      return [];
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
        sandbox: createSandboxMock(),
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

  test("preserves previous simulation state between render-only frames", () => {
    const scheduler = new FakeScheduler();
    const simulationMock = createSimulationMock();
    const uiRecorder = createUiRecorderMock();

    const engine = createEngine(
      {
        simulation: simulationMock.simulation,
        combat: createCombatMock(),
        editor: createEditorMock(),
        sandbox: createSandboxMock(),
        ui: uiRecorder.ui,
        timestepSeconds: 1 / 60
      },
      scheduler
    );

    engine.start(7);

    scheduler.advance(17);
    const firstInterpolatedFrame = uiRecorder.frames.at(-1);
    expect(firstInterpolatedFrame).toBeDefined();
    expect(firstInterpolatedFrame?.state.tick).toBe(1);
    expect(firstInterpolatedFrame?.previousState.tick).toBe(0);

    scheduler.advance(8);
    const secondInterpolatedFrame = uiRecorder.frames.at(-1);
    expect(secondInterpolatedFrame).toBeDefined();
    expect(secondInterpolatedFrame?.state.tick).toBe(1);
    expect(secondInterpolatedFrame?.previousState.tick).toBe(0);
    expect(secondInterpolatedFrame?.interpolationAlpha ?? 0).toBeGreaterThan(
      firstInterpolatedFrame?.interpolationAlpha ?? 0
    );
    expect(simulationMock.getStepCount()).toBe(1);
  });
});
