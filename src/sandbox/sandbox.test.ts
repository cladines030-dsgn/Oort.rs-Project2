import { describe, expect, test } from "vitest";
import type { ShipCommandsApi } from "../contracts";
import { vec3 } from "../math";
import { createShipSandboxSystem } from "./index";

function createApi(overrides: Partial<ShipCommandsApi> = {}): ShipCommandsApi {
  const base: ShipCommandsApi = {
    position: () => vec3(0, 0, 0),
    velocity: () => vec3(0, 0, 0),
    heading: () => 0,
    angularVelocity: () => 0,
    health: () => 100,
    fuel: () => Infinity,
    shipClass: () => "Fighter",
    currentTick: () => 0,
    maxForwardAcceleration: () => 60,
    maxBackwardAcceleration: () => 30,
    maxLateralAcceleration: () => 30,
    maxAngularAcceleration: () => Math.PI * 2,
    maxAngularSpeed: () => Math.PI * 2,
    thrust: (_power: number): void => {
      // no-op
    },
    strafe: (_power: number): void => {
      // no-op
    },
    brake: (_power?: number): void => {
      // no-op
    },
    setHeading: (_angle: number): void => {
      // no-op
    },
    moveTo: (_x: number, _y: number): void => {
      // no-op
    },
    accelerate: (_acceleration): void => {
      // no-op
    },
    turn: (_speed: number): void => {
      // no-op
    },
    torque: (_acceleration: number): void => {
      // no-op
    },
    fire: (_weaponIndex: number): void => {
      // no-op
    },
    reloadTicks: (_weaponIndex: number): number => 0
  };

  return { ...base, ...overrides };
}

describe("ship sandbox", () => {
  test("executes update(ship) and applies API commands", () => {
    const sandbox = createShipSandboxSystem();
    let thrustPower = 0;

    sandbox.initialize("function update(ship) { ship.thrust(0.75); }");
    sandbox.execute(
      0,
      0,
      1,
      createApi({
        thrust(power: number): void {
          thrustPower = power;
        }
      })
    );

    expect(thrustPower).toBeCloseTo(0.75, 6);
  });

  test("captures console output into script logs", () => {
    const sandbox = createShipSandboxSystem();

    sandbox.initialize('function update(ship) { console.log("hello", ship.currentTick()); }');
    sandbox.execute(
      7,
      1,
      12,
      createApi({
        currentTick: () => 12
      })
    );

    const logs = sandbox.flushLogs();
    const logLine = logs.find((entry) => entry.level === "log" && entry.shipId === 7);
    expect(logLine).toBeDefined();
    expect(logLine?.message).toContain("hello");
    expect(logLine?.message).toContain("12");
  });

  test("rejects unauthorized browser APIs", () => {
    const sandbox = createShipSandboxSystem();

    sandbox.initialize('function update(ship) { fetch("https://example.com"); }');
    const logs = sandbox.flushLogs();

    expect(logs.some((entry) => entry.level === "error")).toBe(true);
    expect(logs.some((entry) => entry.message.includes("sandbox"))).toBe(true);
  });

  test("isolates runtime errors without throwing to simulation", () => {
    const sandbox = createShipSandboxSystem();

    sandbox.initialize('function update(ship) { throw new Error("boom"); }');

    expect(() => {
      sandbox.execute(1, 0, 4, createApi());
    }).not.toThrow();

    const logs = sandbox.flushLogs();
    expect(logs.some((entry) => entry.level === "error")).toBe(true);
    expect(logs.some((entry) => entry.message.includes("boom"))).toBe(true);
  });

  test("enforces per-tick execution budget via loop guards", () => {
    const sandbox = createShipSandboxSystem({ tickBudgetMs: 0.01 });

    sandbox.initialize("function update(ship) { while (true) { ship.thrust(0); } }");
    sandbox.execute(2, 0, 5, createApi());

    const logs = sandbox.flushLogs();
    expect(logs.some((entry) => entry.message.includes("Tick budget exceeded"))).toBe(true);
  });
});
