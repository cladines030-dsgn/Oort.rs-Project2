import type {
  ShipClass,
  ShipClassStats,
  ShipCodeHook,
  ShipCommandsApi,
  ShipConfig,
  ShipSnapshot,
  SimulationStateSnapshot,
  SimulationSystem,
  WorldConfig,
} from "../contracts";
import { vec3, vec3Add, vec3Length, vec3RotateXY, vec3Scale, VEC3_ZERO } from "../math";
import type { Vec3 } from "../math";


export const SHIP_CLASS_STATS: Record<ShipClass, ShipClassStats> = {
  Fighter: {
    maxHealth: 100,
    maxForwardAccel: 60,
    maxBackwardAccel: 30,
    maxLateralAccel: 30,
    maxAngularAccel: 2 * Math.PI,
    maxFuel: null,
  },
  Frigate: {
    maxHealth: 10_000,
    maxForwardAccel: 10,
    maxBackwardAccel: 5,
    maxLateralAccel: 5,
    maxAngularAccel: Math.PI / 4,
    maxFuel: null,
  },
  Cruiser: {
    maxHealth: 20_000,
    maxForwardAccel: 5,
    maxBackwardAccel: 2.5,
    maxLateralAccel: 2.5,
    maxAngularAccel: Math.PI / 8,
    maxFuel: null,
  },
  Missile: {
    maxHealth: 20,
    maxForwardAccel: 300,
    maxBackwardAccel: 0,
    maxLateralAccel: 100,
    maxAngularAccel: 4 * Math.PI,
    maxFuel: 2_000,
  },
  Torpedo: {
    maxHealth: 100,
    maxForwardAccel: 70,
    maxBackwardAccel: 0,
    maxLateralAccel: 20,
    maxAngularAccel: 2 * Math.PI,
    maxFuel: 3_000,
  },
};


interface PendingCommands {
  acceleration: Vec3 | null; // ship-local space
  turn: number | null;       // target angular velocity (rad/s)
  torque: number | null;     // angular acceleration (rad/s²)
}

interface ShipEntity {
  id: number;
  team: number;
  class: ShipClass;
  position: Vec3;
  velocity: Vec3;
  heading: number;
  angularVelocity: number;
  health: number;
  /** Remaining delta-v in m/s. Infinity for crewed ships. */
  fuel: number;
  pending: PendingCommands;
}

interface WorldState {
  tick: number;
  seed: number;
  rngState: number;
  ships: ShipEntity[];
  projectileCount: number;
  worldSize: number;
}

// ---------------------------------------------------------------------------
// Deterministic LCG RNG (Numerical Recipes constants).
// All intermediate values stay within Number.MAX_SAFE_INTEGER.
// ---------------------------------------------------------------------------

function lcgNext(state: number): number {
  return (1_664_525 * state + 1_013_904_223) >>> 0;
}

// ---------------------------------------------------------------------------
// Default world: two Fighter ships, one per team, facing each other.
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: WorldConfig = {
  worldSize: 20_000,
  ships: [
    { team: 0, class: "Fighter", position: vec3(-500, 0, 0), heading: 0 },
    { team: 1, class: "Fighter", position: vec3(500, 0, 0), heading: Math.PI },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function freshPending(): PendingCommands {
  return { acceleration: null, turn: null, torque: null };
}

function makeShipEntity(id: number, cfg: ShipConfig): ShipEntity {
  const stats = SHIP_CLASS_STATS[cfg.class];
  return {
    id,
    team: cfg.team,
    class: cfg.class,
    position: cfg.position,
    velocity: VEC3_ZERO,
    heading: cfg.heading,
    angularVelocity: 0,
    health: stats.maxHealth,
    fuel: stats.maxFuel ?? Infinity,
    pending: freshPending(),
  };
}

function snapshotShip(entity: ShipEntity): ShipSnapshot {
  return {
    id: entity.id,
    team: entity.team,
    class: entity.class,
    position: entity.position,
    velocity: entity.velocity,
    heading: entity.heading,
    angularVelocity: entity.angularVelocity,
    health: entity.health,
    fuel: entity.fuel,
  };
}

function buildSnapshot(world: WorldState): SimulationStateSnapshot {
  return {
    tick: world.tick,
    seed: world.seed,
    ships: world.ships.map(snapshotShip),
    projectileCount: world.projectileCount,
  };
}

// ---------------------------------------------------------------------------
// ShipCommandsApi factory — wraps a mutable entity into the public API.
// ---------------------------------------------------------------------------

function createShipApi(entity: ShipEntity, tick: number): ShipCommandsApi {
  const stats = SHIP_CLASS_STATS[entity.class];
  return {
    position: () => entity.position,
    velocity: () => entity.velocity,
    heading: () => entity.heading,
    angularVelocity: () => entity.angularVelocity,
    health: () => entity.health,
    fuel: () => entity.fuel,
    shipClass: () => entity.class,
    currentTick: () => tick,
    maxForwardAcceleration: () => stats.maxForwardAccel,
    maxBackwardAcceleration: () => stats.maxBackwardAccel,
    maxLateralAcceleration: () => stats.maxLateralAccel,
    maxAngularAcceleration: () => stats.maxAngularAccel,
    accelerate(acceleration: Vec3): void {
      entity.pending.acceleration = acceleration;
    },
    turn(speed: number): void {
      entity.pending.turn = speed;
    },
    torque(acceleration: number): void {
      entity.pending.torque = acceleration;
    },
  };
}

// ---------------------------------------------------------------------------
// Symplectic Euler physics update for a single ship.
// Velocity is integrated before position so kinetic energy is conserved.
// ---------------------------------------------------------------------------

function physicsUpdate(entity: ShipEntity, dt: number): void {
  const stats = SHIP_CLASS_STATS[entity.class];
  const { pending } = entity;

  // --- Angular velocity via torque command ---
  if (pending.torque !== null) {
    const clamped = clamp(pending.torque, -stats.maxAngularAccel, stats.maxAngularAccel);
    entity.angularVelocity += clamped * dt;
  }

  // --- Angular velocity via turn command (target velocity, approached at max angular accel) ---
  if (pending.turn !== null) {
    const maxDelta = stats.maxAngularAccel * dt;
    const diff = pending.turn - entity.angularVelocity;
    entity.angularVelocity += clamp(diff, -maxDelta, maxDelta);
  }

  // --- Heading ---
  entity.heading += entity.angularVelocity * dt;

  // --- Linear acceleration (ship-local XY plane → world XY plane, z pinned at 0) ---
  if (pending.acceleration !== null) {
    const local = pending.acceleration;

    // Clamp each axis to class limits (forward/backward split on x-axis).
    const clampedX =
      local.x >= 0
        ? clamp(local.x, 0, stats.maxForwardAccel)
        : clamp(local.x, -stats.maxBackwardAccel, 0);
    const clampedY = clamp(local.y, -stats.maxLateralAccel, stats.maxLateralAccel);

    // z-axis remains disabled for current gameplay.
    const clampedLocal = vec3(clampedX, clampedY, 0);
    const appliedMagnitude = vec3Length(clampedLocal);

    if (appliedMagnitude > 0 && entity.fuel > 0) {
      const worldAccel = vec3RotateXY(clampedLocal, entity.heading);
      entity.velocity = vec3Add(entity.velocity, vec3Scale(worldAccel, dt));

      // Consume delta-v for missiles and torpedoes (crewed ships have Infinity fuel).
      if (entity.fuel !== Infinity) {
        entity.fuel = Math.max(0, entity.fuel - appliedMagnitude * dt);
      }
    }
  }

  // --- Position (after velocity update for symplectic integration) ---
  entity.position = vec3Add(entity.position, vec3Scale(entity.velocity, dt));

  // --- Clear pending commands for next tick ---
  entity.pending = freshPending();
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

export function createSimulationSystem(): SimulationSystem {
  let world: WorldState = {
    tick: 0,
    seed: 1,
    rngState: 1,
    ships: [],
    projectileCount: 0,
    worldSize: 20_000,
  };

  let shipCodeHook: ShipCodeHook | null = null;

  return {
    initialize(seed: number, config: WorldConfig = DEFAULT_CONFIG): void {
      world = {
        tick: 0,
        seed,
        rngState: seed >>> 0,
        ships: config.ships.map((cfg, idx) => makeShipEntity(idx, cfg)),
        projectileCount: 0,
        worldSize: config.worldSize ?? 20_000,
      };
    },

    registerShipCodeHook(hook: ShipCodeHook): void {
      shipCodeHook = hook;
    },

    step(deltaSeconds: number): SimulationStateSnapshot {
      // 1. Execute ship code — hook buffers acceleration/turn/torque commands.
      if (shipCodeHook !== null) {
        for (const ship of world.ships) {
          if (ship.health > 0) {
            const api = createShipApi(ship, world.tick);
            shipCodeHook(ship.id, ship.team, api);
          }
        }
      }

      // 2. Physics update — apply buffered commands and integrate motion.
      for (const ship of world.ships) {
        if (ship.health > 0) {
          physicsUpdate(ship, deltaSeconds);
        }
      }

      // 3. Advance deterministic RNG and tick counter.
      world.rngState = lcgNext(world.rngState);
      world.tick += 1;

      return buildSnapshot(world);
    },

    getState(): SimulationStateSnapshot {
      return buildSnapshot(world);
    },
  };
}
