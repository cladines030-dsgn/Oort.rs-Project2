import type { Vec3 } from "../math";

export type { Vec3 };

export type ShipProgramSource = string;

export type ShipClass = "Fighter" | "Frigate" | "Cruiser" | "Missile" | "Torpedo";

/**
 * Weapon types supported in the combat system.
 * Each ship class has a predetermined loadout of weapons indexed 0..n.
 */
export type WeaponType = "Gun" | "Missile" | "Torpedo" | "Decoy";

/**
 * Stats for a single weapon type. Determines reload time, projectile speed, travel distance, etc.
 */
export interface WeaponStats {
  readonly type: WeaponType;
  /** Time between shots in seconds. */
  readonly reloadTime: number;
  /** Projectile velocity in m/s. */
  readonly projectileSpeed: number;
  /** Maximum travel distance before projectile expires in meters. */
  readonly maxRange: number;
  /** Damage dealt on hit (not used for decoys). */
  readonly damagePerHit: number;
  /** Radius of collision detection in meters. */
  readonly collisionRadius: number;
  /** Whether the weapon can be turreted (rotated independently of ship heading). */
  readonly turreted: boolean;
}

/**
 * Weapon loadout for a given ship class.
 * Index corresponds to weapon index used in fire() API.
 */
export interface WeaponLoadout {
  readonly weapons: ReadonlyArray<WeaponStats>;
}

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
  /** Weapons for this ship class. */
  readonly weapons: ReadonlyArray<WeaponStats>;
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

/**
 * Snapshot of an active projectile in the world.
 * Used for rendering and state inspection.
 */
export interface ProjectileSnapshot {
  readonly id: number;
  readonly team: number;
  readonly firedBy: number; // ship id
  readonly weaponType: WeaponType;
  readonly position: Vec3;
  readonly velocity: Vec3;
  readonly traveledDistance: number;
  readonly collisionRadius: number;
}

/** Combat event logged during this tick (hit, miss, kill, etc.) */
export interface CombatEvent {
  readonly tick: number;
  readonly type: "fire" | "hit" | "kill";
  readonly attackerId: number;
  readonly targetId?: number;
  readonly targetTeam?: number;
  readonly weaponIndex?: number;
}

/** State snapshot emitted by the simulation every tick. */
export interface SimulationStateSnapshot {
  readonly tick: number;
  readonly seed: number;
  /** Side length of the square battlefield in metres. */
  readonly worldSize: number;
  readonly ships: ReadonlyArray<ShipSnapshot>;
  readonly projectiles: ReadonlyArray<ProjectileSnapshot>;
  readonly combatEvents: ReadonlyArray<CombatEvent>;
}

export type ShipScriptLogLevel = "log" | "warn" | "error";

/** Structured log line emitted by sandboxed ship code. */
export interface ShipScriptLogEntry {
  readonly tick: number;
  readonly shipId: number;
  readonly team: number;
  readonly level: ShipScriptLogLevel;
  readonly message: string;
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

  // --- Combat ---
  /** Fire weapon at the given index (0-based). Only fires if projectile is not loaded. */
  fire(weaponIndex: number): void;
  /** Query ticks remaining until a weapon is ready to fire. 0 means ready. */
  reloadTicks(weaponIndex: number): number;
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
  /** Optional custom collision radius in metres for scenario-specific tuning. */
  collisionRadius?: number;
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
  setProgramSource(source: ShipProgramSource): void;
  resetProgramSource(): ShipProgramSource;
}

export interface ShipSandboxSystem {
  /** Compile and activate the latest user program source. */
  initialize(programSource: ShipProgramSource): void;
  /** Execute user update(ship) for one ship in one simulation tick. */
  execute(shipId: number, team: number, tick: number, api: ShipCommandsApi): void;
  /** Return and clear buffered script logs since the previous flush. */
  flushLogs(): ReadonlyArray<ShipScriptLogEntry>;
}

export interface UiSystem {
  mount(container: HTMLElement): void;
  /** Attach the canvas renderer to an existing canvas without full DOM mounting. */
  attachToCanvas(canvas: HTMLCanvasElement): void;
  updateStatus(message: string): void;
  render(frame: UiRenderFrame): void;
  renderScriptLogs(entries: ReadonlyArray<ShipScriptLogEntry>): void;
  getProgramSource(): ShipProgramSource;
  setProgramSource(source: ShipProgramSource): void;
  onRunRequested(handler: () => void): void;
  onStopRequested(handler: () => void): void;
  onResetRequested(handler: () => void): void;
}

export interface UiRenderFrame {
  readonly state: SimulationStateSnapshot;
  readonly previousState: SimulationStateSnapshot;
  /**
   * Fractional progress toward the next simulation tick in [0, 1).
   * Used only for visual interpolation; simulation authority stays in state snapshots.
   */
  readonly interpolationAlpha: number;
}

export interface EngineSystem {
  start(seed?: number, worldConfig?: WorldConfig): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Optional challenge mode hooked into the engine tick loop.
 * `update` is called once per simulation tick with the tick delta and latest state.
 */
export interface TargetChallengeMode {
  update(dt: number, state: SimulationStateSnapshot): void;
  isFinished(): boolean;
  getScore(): number;
  getTime(): number;
  /** Optional controller for non-player ships in scenario modes. */
  controlShip?(shipId: number, team: number, api: ShipCommandsApi): void;
  /** Optional summary used when the engine auto-stops a completed challenge. */
  getCompletionStatus?(): string;
}

export interface EngineDependencies {
  simulation: SimulationSystem;
  combat: CombatSystem;
  editor: EditorSystem;
  sandbox: ShipSandboxSystem;
  ui: UiSystem;
  timestepSeconds: number;
  /** Optional challenge controller to drive per-tick logic. */
  targetChallenge?: TargetChallengeMode | null;
}
