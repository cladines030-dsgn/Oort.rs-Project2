import { createCombatSystem } from "../combat";
import { createEditorSystem } from "../editor";
import { createEngine } from "../engine";
import { createShipSandboxSystem } from "../sandbox";
import { createSimulationSystem } from "../simulation";
import { createUiSystem } from "../ui";

export interface Application {
  start(seed?: number): void;
  stop(): void;
}

export function createApplication(container: HTMLElement): Application {
  const simulation = createSimulationSystem();
  const combat = createCombatSystem();
  const editor = createEditorSystem();
  const sandbox = createShipSandboxSystem();
  const ui = createUiSystem();

  ui.mount(container);
  ui.setProgramSource(editor.getProgramSource());
  ui.updateStatus("Ready");

  const engine = createEngine({
    simulation,
    combat,
    editor,
    sandbox,
    ui,
    timestepSeconds: 1 / 60,
    targetChallenge: null
  });

  const DEFAULT_SEED = 1234;

  ui.onRunRequested(() => {
    editor.setProgramSource(ui.getProgramSource());
    if (engine.isRunning()) {
      engine.stop();
    }
    engine.start(DEFAULT_SEED);
  });

  ui.onStopRequested(() => {
    engine.stop();
  });

  ui.onResetRequested(() => {
    engine.stop();
    const resetProgram = editor.resetProgramSource();
    ui.setProgramSource(resetProgram);
    ui.updateStatus("Ready");
  });

  return {
    start(seed = DEFAULT_SEED): void {
      editor.setProgramSource(ui.getProgramSource());
      engine.start(seed);
    },
    stop(): void {
      engine.stop();
    }
  };
}
