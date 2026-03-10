import type { EditorSystem, ShipProgramSource } from "../contracts";

const DEFAULT_PROGRAM = `function update(ship) {
  const enemies = ship.scanEnemies();
  if (enemies.length > 0) {
    ship.lockTarget(enemies[0]);
    ship.fire(enemies[0]);
  }
}`;

export function createEditorSystem(initialProgram?: ShipProgramSource): EditorSystem {
  const currentProgram = initialProgram ?? DEFAULT_PROGRAM;

  return {
    initialize(): void {
      // Placeholder for Monaco/CodeMirror integration.
    },
    getProgramSource(): ShipProgramSource {
      return currentProgram;
    }
  };
}
