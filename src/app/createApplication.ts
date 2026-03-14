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
  ui.updateStatus("Ready");

  const controls = document.createElement("div");
  controls.className = "controls";

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.textContent = "Run";

  const stopBtn = document.createElement("button");
  stopBtn.type = "button";
  stopBtn.textContent = "Stop";

  controls.append(startBtn, stopBtn);
  container.append(controls);

  const engine = createEngine({
    simulation,
    combat,
    editor,
    sandbox,
    ui,
    timestepSeconds: 1 / 60
  });

  startBtn.addEventListener("click", () => {
    engine.start(1234);
  });

  stopBtn.addEventListener("click", () => {
    engine.stop();
  });

  return {
    start(seed = 1234): void {
      engine.start(seed);
    },
    stop(): void {
      engine.stop();
    }
  };
}
