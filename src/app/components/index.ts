import type { SimulationStateSnapshot, UiSystem } from "../contracts";

export function createUiSystem(): UiSystem {
  let statusEl: HTMLParagraphElement | null = null;
  let snapshotEl: HTMLPreElement | null = null;

  return {
    mount(container: HTMLElement): void {
      container.innerHTML = "";

      const shell = document.createElement("section");
      shell.className = "app-shell";

      const title = document.createElement("h1");
      title.textContent = "Oort.js";

      statusEl = document.createElement("p");
      statusEl.className = "status";

      snapshotEl = document.createElement("pre");
      snapshotEl.className = "snapshot";

      shell.append(title, statusEl, snapshotEl);
      container.append(shell);
    },
    updateStatus(message: string): void {
      if (statusEl) {
        statusEl.textContent = message;
      }
    },
    render(state: SimulationStateSnapshot): void {
      if (snapshotEl) {
        snapshotEl.textContent = JSON.stringify(state, null, 2);
      }
    }
  };
}
