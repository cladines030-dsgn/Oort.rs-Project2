import type { EditorSystem, ShipProgramSource } from "../contracts";

const DEFAULT_PROGRAM = `function update(ship) {
  if (ship.currentTick() % 120 === 0) {
    console.log("tick", ship.currentTick(), "ship", ship.shipClass());
  }

  ship.thrust(0.2);
  ship.turn(0.15);

  if (ship.currentTick() % 60 === 0 && ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`;

export function createEditorSystem(initialProgram?: ShipProgramSource): EditorSystem {
  const baseProgram = initialProgram ?? DEFAULT_PROGRAM;
  let currentProgram = baseProgram;

  return {
    initialize(): void {
      // Placeholder for Monaco/CodeMirror integration.
    },
    getProgramSource(): ShipProgramSource {
      return currentProgram;
    },
    setProgramSource(source: ShipProgramSource): void {
      currentProgram = source;
    },
    resetProgramSource(): ShipProgramSource {
      currentProgram = baseProgram;
      return currentProgram;
    }
  };
}
