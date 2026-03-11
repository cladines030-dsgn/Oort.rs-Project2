import type { Vec3 } from "../math";

export type { Vec3 };

export type ShipProgramSource = string;


export type ShipClass = "Fighter" | "Frigate" | "Cruiser" | "Missile" | "Torpedo";

export interface ShipClassStats {
  readonly maxHealth: number;
  /** Maximum forward acceleration in m/s². */
  readonly maxForwardAccel: number;
  /** Maximum backward acceleration in m/s². */
  readonly maxBackwardAccel: number;
  /** Maximum lateral (strafe) acceleration in m/s². */
  readonly maxLateralAccel: number;
  /** Maximum angular acceleration in rad/s². */
  readonly maxAngularAccel: number;
  /** Maximum angular velocity in rad/s. */
  readonly maxAngularSpeed: number;
  /** Delta-v budget in m/s; null for crewed ships whose fuel is unlimited. */
  readonly maxFuel: number | null;
}

/** Public, read-only snapshot of a single ship included in every tick snapshot. */
export interface ShipSnapshot {
  readonly id: number;
  readonly team: number;
  readonly class: ShipClass;
  readonly position: Vec3;
  readonly velocity: Vec3;
  /** Current heading in radians. */
  readonly heading: number;
  /** Current angular velocity in rad/s. */
  readonly angularVelocity: number;
  readonly health: number;
  /** Remaining delta-v in m/s. Infinity for crewed ships. */
  readonly fuel: number;
}

/** State snapshot emitted by the simulation every tick. */
export interface SimulationStateSnapshot {
  readonly tick: number;
  readonly seed: number;
  readonly ships: ReadonlyArray<ShipSnapshot>;
  readonly projectileCount: number;
}

/**
 * API surface exposed to ship programs each simulation tick.
 * Mirrors the Oort API reference: status reads plus buffered control commands.
 */
export interface ShipCommandsApi {
  // --- Status reads ---
  position(): Vec3;
  velocity(): Vec3;
  heading(): number;
  angularVelocity(): number;
  health(): number;
  /** Remaining delta-v in m/s. Infinity for crewed ships. */
  fuel(): number;
  shipClass(): ShipClass;
  currentTick(): number;
  maxForwardAcceleration(): number;
  maxBackwardAcceleration(): number;
  maxLateralAcceleration(): number;
  maxAngularAcceleration(): number;
  maxAngularSpeed(): number;

  /** Apply forward/backward thrust power in [-1, 1]. */
  thrust(power: number): void;
  /** Apply lateral thrust power in [-1, 1]. Positive is starboard (+y local). */
  strafe(power: number): void;
  /** Damp local forward and lateral velocity components using available acceleration limits. */
  brake(power?: number): void;
  /** Steer toward a target heading in radians with angular speed and acceleration limits. */
  setHeading(angle: number): void;
  /** Navigation helper that steers and thrusts toward a world-space waypoint. */
  moveTo(x: number, y: number): void;

  /** Accelerate in ship-local space: x = forward (+) / backward (−), y = lateral, z = vertical (reserved). Units: m/s². */
  accelerate(acceleration: Vec3): void;
  /** Request a target angular velocity in rad/s. Applied at maximum angular acceleration. */
  turn(speed: number): void;
  /** Apply angular acceleration in rad/s². Clamped to max angular acceleration. */
  torque(acceleration: number): void;
}

/** Invoked once per live ship per simulation tick. May issue control commands via the api. */
export type ShipCodeHook = (shipId: number, team: number, api: ShipCommandsApi) => void;

/** Blueprint for a single ship used when initializing the world. */
export interface ShipConfig {
  team: number;
  class: ShipClass;
  position: Vec3;
  /** Initial heading in radians. */
  heading: number;
}

/** Full configuration used to reproducibly initialize a world from a seed. */
export interface WorldConfig {
  ships: ReadonlyArray<ShipConfig>;
  /** Side length of the square battlefield in metres. Defaults to 20 000. */
  worldSize?: number;
}

export interface SimulationSystem {
  initialize(seed: number, config?: WorldConfig): void;
  step(deltaSeconds: number): SimulationStateSnapshot;
  getState(): SimulationStateSnapshot;
  /** Register a hook that is called for each live ship during every simulation tick. */
  registerShipCodeHook(hook: ShipCodeHook): void;
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
