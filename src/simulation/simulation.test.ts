import { createSimulationSystem } from "./index";
import { describe, expect, test } from "vitest";
import { vec3 } from "../math";
import { SHIP_CLASS_STATS } from "./index";
import type { ShipCommandsApi, SimulationStateSnapshot, WorldConfig } from "../contracts";

const TWO_FIGHTER_CONFIG: WorldConfig = {
  worldSize: 20_000,
  ships: [
    { team: 0, class: "Fighter", position: vec3(-500, 0, 0), heading: 0 },
    { team: 1, class: "Fighter", position: vec3(500, 0, 0), heading: Math.PI },
  ],
};

describe("simulation determinism", () => {
  test("same seed without ship code produces identical snapshots", () => {
    const a = createSimulationSystem();
    const b = createSimulationSystem();
    a.initialize(42);
    b.initialize(42);
    for (let i = 0; i < 180; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.getState()).toEqual(b.getState());
  });

  test("same seed, config, and ship program produce identical positions after 300 ticks", () => {
    const hook = (_id: number, _team: number, api: ShipCommandsApi): void => {
      api.accelerate(vec3(api.maxForwardAcceleration(), 0, 0));
      api.turn(0.5);
    };
    const a = createSimulationSystem();
    a.initialize(42, TWO_FIGHTER_CONFIG);
    a.registerShipCodeHook(hook);
    const b = createSimulationSystem();
    b.initialize(42, TWO_FIGHTER_CONFIG);
    b.registerShipCodeHook(hook);
    for (let i = 0; i < 300; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.getState()).toEqual(b.getState());
  });

  test("different seeds produce different RNG lineages", () => {
    const a = createSimulationSystem();
    const b = createSimulationSystem();
    a.initialize(1, TWO_FIGHTER_CONFIG);
    b.initialize(2, TWO_FIGHTER_CONFIG);
    for (let i = 0; i < 60; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.getState().seed).not.toBe(b.getState().seed);
  });

  test("ship position advances deterministically under forward thrust", () => {
    const sim = createSimulationSystem();
    sim.initialize(1, {
      worldSize: 20_000,
      ships: [{ team: 0, class: "Fighter", position: vec3(0, 0, 0), heading: 0 }],
    });
    sim.registerShipCodeHook((_id, _team, api) => {
      api.accelerate(vec3(api.maxForwardAcceleration(), 0, 0));
    });
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      sim.step(dt);
    }
    const ship = sim.getState().ships[0];
    // Symplectic Euler: vel_n = n m/s, pos_x = Σ(n/60) for n=1..60 = 30.5 m
    expect(ship.velocity.x).toBeCloseTo(60, 1);
    expect(ship.position.x).toBeCloseTo(30.5, 1);
    expect(ship.position.y).toBeCloseTo(0, 5);
    expect(ship.position.z).toBeCloseTo(0, 8);
  });

  test("lateral thrust produces no forward displacement when heading is 0", () => {
    const sim = createSimulationSystem();
    sim.initialize(1, {
      worldSize: 20_000,
      ships: [{ team: 0, class: "Fighter", position: vec3(0, 0, 0), heading: 0 }],
    });
    sim.registerShipCodeHook((_id, _team, api) => {
      api.accelerate(vec3(0, api.maxLateralAcceleration(), 0));
    });
    for (let i = 0; i < 60; i++) {
      sim.step(1 / 60);
    }
    const ship = sim.getState().ships[0];
    expect(ship.position.x).toBeCloseTo(0, 5);
    expect(ship.position.y).toBeGreaterThan(0);
    expect(ship.position.z).toBeCloseTo(0, 8);
  });

  test("ship class stats match Oort API reference values", () => {
    expect(SHIP_CLASS_STATS.Fighter.maxHealth).toBe(100);
    expect(SHIP_CLASS_STATS.Fighter.maxForwardAccel).toBe(60);
    expect(SHIP_CLASS_STATS.Fighter.maxBackwardAccel).toBe(30);
    expect(SHIP_CLASS_STATS.Fighter.maxLateralAccel).toBe(30);
    expect(SHIP_CLASS_STATS.Fighter.maxAngularAccel).toBeCloseTo(2 * Math.PI, 5);
    expect(SHIP_CLASS_STATS.Frigate.maxHealth).toBe(10_000);
    expect(SHIP_CLASS_STATS.Cruiser.maxHealth).toBe(20_000);
    expect(SHIP_CLASS_STATS.Missile.maxFuel).toBe(2_000);
    expect(SHIP_CLASS_STATS.Missile.maxForwardAccel).toBe(300);
    expect(SHIP_CLASS_STATS.Torpedo.maxFuel).toBe(3_000);
    expect(SHIP_CLASS_STATS.Torpedo.maxForwardAccel).toBe(70);
  });

  test("acceleration is clamped to ship class limits", () => {
    const sim = createSimulationSystem();
    sim.initialize(1, {
      worldSize: 20_000,
      ships: [{ team: 0, class: "Fighter", position: vec3(0, 0, 0), heading: 0 }],
    });
    sim.registerShipCodeHook((_id, _team, api) => {
      api.accelerate(vec3(9_999, 0, 0)); // far above max
    });
    sim.step(1 / 60);
    const ship = sim.getState().ships[0];
    // velocity must equal maxForwardAccel * dt = 60 * (1/60) = 1 m/s
    expect(ship.velocity.x).toBeCloseTo(1, 5);
  });

  test("simulation runs headless without renderer", () => {
    const sim = createSimulationSystem();
    sim.initialize(99);
    expect(() => {
      for (let i = 0; i < 600; i++) {
        sim.step(1 / 60);
      }
    }).not.toThrow();
  });

  test("tick counter increments by one per step", () => {
    const sim = createSimulationSystem();
    sim.initialize(1);
    sim.step(1 / 60);
    expect(sim.getState().tick).toBe(1);
    sim.step(1 / 60);
    expect(sim.getState().tick).toBe(2);
  });
});

describe("simulation replay determinism", () => {
  test("re-running identical seed and config produces the same final state", () => {
    const config: WorldConfig = {
      worldSize: 20_000,
      ships: [
        { team: 0, class: "Fighter", position: vec3(-1_000, 0, 0), heading: 0 },
        { team: 1, class: "Fighter", position: vec3(1_000, 0, 0), heading: Math.PI },
        { team: 0, class: "Frigate", position: vec3(-2_000, 200, 0), heading: Math.PI / 4 },
      ],
    };
    function runSim(): SimulationStateSnapshot {
      const sim = createSimulationSystem();
      sim.initialize(7_777, config);
      sim.registerShipCodeHook((_id, _team, api) => {
        api.accelerate(vec3(api.maxForwardAcceleration() * 0.5, 0, 0));
        api.turn(0.2);
      });
      for (let i = 0; i < 600; i++) {
        sim.step(1 / 60);
      }
      return sim.getState();
    }
    expect(runSim()).toEqual(runSim());
  });

  test("missile fuel decreases under thrust and never drops below zero", () => {
    const sim = createSimulationSystem();
    sim.initialize(1, {
      worldSize: 20_000,
      ships: [{ team: 0, class: "Missile", position: vec3(0, 0, 0), heading: 0 }],
    });
    sim.registerShipCodeHook((_id, _team, api) => {
      api.accelerate(vec3(api.maxForwardAcceleration(), 0, 0));
    });
    const initialFuel = SHIP_CLASS_STATS.Missile.maxFuel as number;
    // 2000 m/s fuel / 300 m/s² ≈ 6.67 s; run 500 ticks (~8.3 s) to exhaust.
    for (let i = 0; i < 500; i++) {
      sim.step(1 / 60);
    }
    const ship = sim.getState().ships[0];
    expect(ship.fuel).toBeGreaterThanOrEqual(0);
    expect(ship.fuel).toBeLessThan(initialFuel);
  });
});
