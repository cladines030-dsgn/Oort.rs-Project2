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
  CombatEvent,
  WeaponType
} from "../contracts";
import {
  vec3,
  vec3Add,
  vec3AngleXY,
  vec3Length,
  vec3RotateXY,
  vec3Scale,
  vec3Sub,
  VEC3_ZERO
} from "../math";
import type { Vec3 } from "../math";

const SHIP_MOBILITY_MULTIPLIER = 1.3;

export const SHIP_CLASS_STATS: Record<ShipClass, ShipClassStats> = {
  Fighter: {
    maxHealth: 100,
    maxForwardAccel: 60 * SHIP_MOBILITY_MULTIPLIER,
    maxBackwardAccel: 30 * SHIP_MOBILITY_MULTIPLIER,
    maxLateralAccel: 30 * SHIP_MOBILITY_MULTIPLIER,
    maxAngularAccel: 2 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxAngularSpeed: 2 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxFuel: null,
    weapons: [
      {
        type: "Gun",
        reloadTime: 0.066,
        projectileSpeed: 1000,
        maxRange: 5000,
        damagePerHit: 10,
        collisionRadius: 5,
        turreted: false
      },
      {
        type: "Missile",
        reloadTime: 5,
        projectileSpeed: 300,
        maxRange: 10000,
        damagePerHit: 50,
        collisionRadius: 15,
        turreted: false
      }
    ]
  },
  Frigate: {
    maxHealth: 10_000,
    maxForwardAccel: 10 * SHIP_MOBILITY_MULTIPLIER,
    maxBackwardAccel: 5 * SHIP_MOBILITY_MULTIPLIER,
    maxLateralAccel: 5 * SHIP_MOBILITY_MULTIPLIER,
    maxAngularAccel: (Math.PI / 4) * SHIP_MOBILITY_MULTIPLIER,
    maxAngularSpeed: (Math.PI / 2) * SHIP_MOBILITY_MULTIPLIER,
    maxFuel: null,
    weapons: [
      {
        type: "Gun",
        reloadTime: 2,
        projectileSpeed: 4000,
        maxRange: 8000,
        damagePerHit: 30,
        collisionRadius: 5,
        turreted: false
      },
      {
        type: "Gun",
        reloadTime: 0.066,
        projectileSpeed: 1000,
        maxRange: 5000,
        damagePerHit: 10,
        collisionRadius: 5,
        turreted: true
      },
      {
        type: "Gun",
        reloadTime: 0.066,
        projectileSpeed: 1000,
        maxRange: 5000,
        damagePerHit: 10,
        collisionRadius: 5,
        turreted: true
      },
      {
        type: "Missile",
        reloadTime: 2,
        projectileSpeed: 300,
        maxRange: 10000,
        damagePerHit: 50,
        collisionRadius: 15,
        turreted: false
      }
    ]
  },
  Cruiser: {
    maxHealth: 20_000,
    maxForwardAccel: 5 * SHIP_MOBILITY_MULTIPLIER,
    maxBackwardAccel: 2.5 * SHIP_MOBILITY_MULTIPLIER,
    maxLateralAccel: 2.5 * SHIP_MOBILITY_MULTIPLIER,
    maxAngularAccel: (Math.PI / 8) * SHIP_MOBILITY_MULTIPLIER,
    maxAngularSpeed: (Math.PI / 4) * SHIP_MOBILITY_MULTIPLIER,
    maxFuel: null,
    weapons: [
      {
        type: "Gun",
        reloadTime: 5,
        projectileSpeed: 2000,
        maxRange: 6000,
        damagePerHit: 20,
        collisionRadius: 5,
        turreted: true
      },
      {
        type: "Missile",
        reloadTime: 1.2,
        projectileSpeed: 300,
        maxRange: 10000,
        damagePerHit: 50,
        collisionRadius: 15,
        turreted: false
      },
      {
        type: "Missile",
        reloadTime: 1.2,
        projectileSpeed: 300,
        maxRange: 10000,
        damagePerHit: 50,
        collisionRadius: 15,
        turreted: false
      },
      {
        type: "Torpedo",
        reloadTime: 3,
        projectileSpeed: 200,
        maxRange: 15000,
        damagePerHit: 100,
        collisionRadius: 20,
        turreted: false
      }
    ]
  },
  Missile: {
    maxHealth: 20,
    maxForwardAccel: 300 * SHIP_MOBILITY_MULTIPLIER,
    maxBackwardAccel: 0,
    maxLateralAccel: 100 * SHIP_MOBILITY_MULTIPLIER,
    maxAngularAccel: 4 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxAngularSpeed: 4 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxFuel: 2_000,
    weapons: []
  },
  Torpedo: {
    maxHealth: 100,
    maxForwardAccel: 70 * SHIP_MOBILITY_MULTIPLIER,
    maxBackwardAccel: 0,
    maxLateralAccel: 20 * SHIP_MOBILITY_MULTIPLIER,
    maxAngularAccel: 2 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxAngularSpeed: 2 * Math.PI * SHIP_MOBILITY_MULTIPLIER,
    maxFuel: 3_000,
    weapons: []
  }
};

interface PendingCommands {
  acceleration: Vec3 | null; // ship-local space
  turn: number | null; // target angular velocity (rad/s)
  torque: number | null; // angular acceleration (rad/s²)
  fireCommands: number[]; // indices of weapons to fire this tick
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
  /** Cooldown timer in seconds for each weapon. 0 means ready to fire. */
  weaponCooldowns: number[];
}

interface Projectile {
  id: number;
  team: number;
  firedBy: number; // ship id
  weaponType: WeaponType;
  position: Vec3;
  velocity: Vec3;
  traveledDistance: number;
  maxRange: number;
  damagePerHit: number;
  collisionRadius: number;
}

interface WorldState {
  tick: number;
  seed: number;
  rngState: number;
  ships: ShipEntity[];
  projectiles: Projectile[];
  nextProjectileId: number;
  combatEvents: CombatEvent[];
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
    { team: 1, class: "Fighter", position: vec3(500, 0, 0), heading: Math.PI }
  ]
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function angleDiff(target: number, current: number): number {
  return normalizeAngle(target - current);
}

function pendingAccelerationOrZero(entity: ShipEntity): Vec3 {
  return entity.pending.acceleration ?? VEC3_ZERO;
}

function freshPending(): PendingCommands {
  return { acceleration: null, turn: null, torque: null, fireCommands: [] };
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
    weaponCooldowns: stats.weapons.map(() => 0)
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
    fuel: entity.fuel
  };
}

function buildSnapshot(world: WorldState): SimulationStateSnapshot {
  return {
    tick: world.tick,
    seed: world.seed,
    worldSize: world.worldSize,
    ships: world.ships.map(snapshotShip),
    projectiles: world.projectiles.map((p) => ({
      id: p.id,
      team: p.team,
      firedBy: p.firedBy,
      weaponType: p.weaponType,
      position: p.position,
      velocity: p.velocity,
      traveledDistance: p.traveledDistance
    })),
    combatEvents: world.combatEvents
  };
}

// ---------------------------------------------------------------------------
// ShipCommandsApi factory — wraps a mutable entity into the public API.
// ---------------------------------------------------------------------------

function createShipApi(entity: ShipEntity, tick: number): ShipCommandsApi {
  const stats = SHIP_CLASS_STATS[entity.class];
  const setHeadingImpl = (targetHeading: number): void => {
    const headingError = angleDiff(targetHeading, entity.heading);
    const targetAngularVelocity = clamp(
      headingError * 4,
      -stats.maxAngularSpeed,
      stats.maxAngularSpeed
    );
    entity.pending.turn = targetAngularVelocity;
  };

  const api: ShipCommandsApi = {
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
    maxAngularSpeed: () => stats.maxAngularSpeed,
    thrust(power: number): void {
      const clampedPower = clamp(power, -1, 1);
      const current = pendingAccelerationOrZero(entity);
      const localX =
        clampedPower >= 0
          ? clampedPower * stats.maxForwardAccel
          : clampedPower * stats.maxBackwardAccel;
      entity.pending.acceleration = vec3(localX, current.y, 0);
    },
    strafe(power: number): void {
      const clampedPower = clamp(power, -1, 1);
      const current = pendingAccelerationOrZero(entity);
      entity.pending.acceleration = vec3(current.x, clampedPower * stats.maxLateralAccel, 0);
    },
    brake(power = 1): void {
      const brakePower = clamp(power, 0, 1);
      const localVelocity = vec3RotateXY(entity.velocity, -entity.heading);

      const accelX =
        localVelocity.x > 0
          ? -stats.maxBackwardAccel * brakePower
          : localVelocity.x < 0
            ? stats.maxForwardAccel * brakePower
            : 0;
      const accelY =
        localVelocity.y > 0
          ? -stats.maxLateralAccel * brakePower
          : localVelocity.y < 0
            ? stats.maxLateralAccel * brakePower
            : 0;

      entity.pending.acceleration = vec3(accelX, accelY, 0);
    },
    setHeading(angle: number): void {
      setHeadingImpl(angle);
    },
    moveTo(x: number, y: number): void {
      const toTarget = vec3Sub(vec3(x, y, 0), entity.position);
      const distance = Math.hypot(toTarget.x, toTarget.y);

      if (distance <= 1) {
        const localVelocity = vec3RotateXY(entity.velocity, -entity.heading);
        const accelX = clamp(-localVelocity.x * 2, -stats.maxBackwardAccel, stats.maxForwardAccel);
        const accelY = clamp(-localVelocity.y * 2, -stats.maxLateralAccel, stats.maxLateralAccel);
        entity.pending.acceleration = vec3(accelX, accelY, 0);
        return;
      }

      const targetHeading = vec3AngleXY(toTarget);
      setHeadingImpl(targetHeading);

      const localVelocity = vec3RotateXY(entity.velocity, -entity.heading);
      const headingError = angleDiff(targetHeading, entity.heading);
      const alignment = Math.max(0, Math.cos(headingError));
      const desiredForwardSpeed =
        Math.min(Math.sqrt(2 * stats.maxBackwardAccel * distance), 250) * alignment;

      let forwardAccel = clamp(
        (desiredForwardSpeed - localVelocity.x) * 2,
        -stats.maxBackwardAccel,
        stats.maxForwardAccel
      );
      if (alignment < 0.2) {
        forwardAccel = clamp(-localVelocity.x * 2, -stats.maxBackwardAccel, stats.maxForwardAccel);
      }

      const lateralAccel = clamp(
        -localVelocity.y * 2,
        -stats.maxLateralAccel,
        stats.maxLateralAccel
      );
      entity.pending.acceleration = vec3(forwardAccel, lateralAccel, 0);
    },
    accelerate(acceleration: Vec3): void {
      entity.pending.acceleration = acceleration;
    },
    turn(speed: number): void {
      entity.pending.turn = speed;
    },
    torque(acceleration: number): void {
      entity.pending.torque = acceleration;
    },
    fire(weaponIndex = 0): void {
      if (weaponIndex >= 0 && weaponIndex < stats.weapons.length) {
        if (entity.pending.fireCommands.indexOf(weaponIndex) === -1) {
          entity.pending.fireCommands.push(weaponIndex);
        }
      }
    },
    reloadTicks(weaponIndex: number): number {
      if (weaponIndex < 0 || weaponIndex >= stats.weapons.length) {
        return 0;
      }
      const cooldownSecs = entity.weaponCooldowns[weaponIndex] ?? 0;
      return Math.ceil(cooldownSecs / (1 / 60)); // Convert seconds to ticks (60 ticks per second).
    }
  };

  return api;
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
    const targetAngularVelocity = clamp(
      pending.turn,
      -stats.maxAngularSpeed,
      stats.maxAngularSpeed
    );
    const maxDelta = stats.maxAngularAccel * dt;
    const diff = targetAngularVelocity - entity.angularVelocity;
    entity.angularVelocity += clamp(diff, -maxDelta, maxDelta);
  }

  entity.angularVelocity = clamp(
    entity.angularVelocity,
    -stats.maxAngularSpeed,
    stats.maxAngularSpeed
  );

  // --- Heading ---
  entity.heading = normalizeAngle(entity.heading + entity.angularVelocity * dt);

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
    projectiles: [],
    nextProjectileId: 0,
    combatEvents: [],
    worldSize: 20_000
  };

  let shipCodeHook: ShipCodeHook | null = null;

  return {
    initialize(seed: number, config: WorldConfig = DEFAULT_CONFIG): void {
      world = {
        tick: 0,
        seed,
        rngState: seed >>> 0,
        ships: config.ships.map((cfg, idx) => makeShipEntity(idx, cfg)),
        projectiles: [],
        nextProjectileId: 0,
        combatEvents: [],
        worldSize: config.worldSize ?? 20_000
      };
    },

    registerShipCodeHook(hook: ShipCodeHook): void {
      shipCodeHook = hook;
    },

    step(deltaSeconds: number): SimulationStateSnapshot {
      // Clear combat events from previous tick.
      world.combatEvents = [];

      // 1. Decay weapon cooldowns.
      for (const ship of world.ships) {
        for (let i = 0; i < ship.weaponCooldowns.length; i++) {
          ship.weaponCooldowns[i] = Math.max(0, ship.weaponCooldowns[i] - deltaSeconds);
        }
      }

      // 2. Execute ship code — hook buffers acceleration/turn/torque commands and fire requests.
      if (shipCodeHook !== null) {
        for (const ship of world.ships) {
          if (ship.health > 0) {
            const api = createShipApi(ship, world.tick);
            shipCodeHook(ship.id, ship.team, api);
          }
        }
      }

      // 3. Process fire commands and create projectiles.
      for (const ship of world.ships) {
        if (ship.health > 0) {
          const stats = SHIP_CLASS_STATS[ship.class];
          for (const weaponIdx of ship.pending.fireCommands) {
            if (weaponIdx < stats.weapons.length && ship.weaponCooldowns[weaponIdx] <= 0) {
              const weapon = stats.weapons[weaponIdx];
              const projectile: Projectile = {
                id: world.nextProjectileId++,
                team: ship.team,
                firedBy: ship.id,
                weaponType: weapon.type,
                position: vec3(ship.position.x, ship.position.y, ship.position.z),
                velocity: vec3RotateXY(vec3(weapon.projectileSpeed, 0, 0), ship.heading),
                traveledDistance: 0,
                maxRange: weapon.maxRange,
                damagePerHit: weapon.damagePerHit,
                collisionRadius: weapon.collisionRadius
              };
              world.projectiles.push(projectile);
              ship.weaponCooldowns[weaponIdx] = weapon.reloadTime;
              world.combatEvents.push({
                tick: world.tick,
                type: "fire",
                attackerId: ship.id,
                weaponIndex: weaponIdx
              });
            }
          }
        }
      }

      // 4. Physics update — apply buffered commands and integrate motion for ships.
      for (const ship of world.ships) {
        if (ship.health > 0) {
          physicsUpdate(ship, deltaSeconds);
        }
      }

      // 5. Update projectiles and check for collisions.
      const projectilesToRemove: number[] = [];
      for (const projectile of world.projectiles) {
        projectile.position = vec3Add(
          projectile.position,
          vec3Scale(projectile.velocity, deltaSeconds)
        );
        projectile.traveledDistance += vec3Length(vec3Scale(projectile.velocity, deltaSeconds));

        if (projectile.traveledDistance >= projectile.maxRange) {
          projectilesToRemove.push(projectile.id);
          continue;
        }

        // Check collision with enemy ships.
        for (const ship of world.ships) {
          if (ship.health > 0 && ship.team !== projectile.team) {
            const dist = Math.hypot(
              ship.position.x - projectile.position.x,
              ship.position.y - projectile.position.y
            );
            if (dist <= projectile.collisionRadius + 20) {
              // Rough collision radius for ships, TODO: make more sophisticated.
              ship.health = Math.max(0, ship.health - projectile.damagePerHit);
              projectilesToRemove.push(projectile.id);
              world.combatEvents.push({
                tick: world.tick,
                type: "hit",
                attackerId: projectile.firedBy,
                targetId: ship.id
              });
              if (ship.health <= 0) {
                world.combatEvents.push({
                  tick: world.tick,
                  type: "kill",
                  attackerId: projectile.firedBy,
                  targetId: ship.id
                });
              }
              break;
            }
          }
        }
      }

      // Remove expired projectiles.
      world.projectiles = world.projectiles.filter((p) => projectilesToRemove.indexOf(p.id) === -1);

      // 6. Advance deterministic RNG and tick counter.
      world.rngState = lcgNext(world.rngState);
      world.tick += 1;

      return buildSnapshot(world);
    },

    getState(): SimulationStateSnapshot {
      return buildSnapshot(world);
    }
  };
}
