export type ShipProgramSource = string;

export interface SimulationStateSnapshot {
  tick: number;
  ships: number;
  projectiles: number;
  seed: number;
}

export interface SimulationSystem {
  initialize(seed: number): void;
  step(deltaSeconds: number): SimulationStateSnapshot;
  getState(): SimulationStateSnapshot;
}

export interface CombatSystem {
  initialize(): void;
  resolveTick(state: SimulationStateSnapshot): void;
}

export interface EditorSystem {
  initialize(): void;
  getProgramSource(): ShipProgramSource;
}

export interface UiSystem {
  mount(container: HTMLElement): void;
  updateStatus(message: string): void;
  render(state: SimulationStateSnapshot): void;
}

export interface EngineSystem {
  start(seed?: number): void;
  stop(): void;
  isRunning(): boolean;
}

export interface EngineDependencies {
  simulation: SimulationSystem;
  combat: CombatSystem;
  editor: EditorSystem;
  ui: UiSystem;
  timestepSeconds: number;
}
