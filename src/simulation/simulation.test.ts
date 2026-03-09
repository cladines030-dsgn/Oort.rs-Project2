import { createSimulationSystem } from "./index";

describe("simulation determinism baseline", () => {
  test("same seed and inputs produce same snapshot", () => {
    const a = createSimulationSystem();
    const b = createSimulationSystem();

    a.initialize(42);
    b.initialize(42);

    for (let i = 0; i < 180; i += 1) {
      a.step(1 / 60);
      b.step(1 / 60);
    }

    expect(a.getState()).toEqual(b.getState());
  });
});
