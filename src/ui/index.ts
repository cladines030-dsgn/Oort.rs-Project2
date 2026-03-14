import type { ShipScriptLogEntry, SimulationStateSnapshot, UiSystem } from "../contracts";

const MAX_LOG_LINES = 50;

export function createUiSystem(): UiSystem {
  let statusEl: HTMLParagraphElement | null = null;
  let snapshotEl: HTMLPreElement | null = null;
  let logsEl: HTMLPreElement | null = null;
  let logLines: string[] = [];
  let lastRenderMs = 0;
  const RENDER_INTERVAL_MS = 250;

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

      logsEl = document.createElement("pre");
      logsEl.className = "script-logs";
      logsEl.textContent = "Ship logs will appear here";
      logLines = [];

      shell.append(title, statusEl, snapshotEl, logsEl);
      container.append(shell);
    },
    updateStatus(message: string): void {
      if (statusEl) {
        statusEl.textContent = message;
      }
    },
    render(state: SimulationStateSnapshot): void {
      if (!snapshotEl) {
        return;
      }
      const now = Date.now();
      if (now - lastRenderMs < RENDER_INTERVAL_MS) {
        return;
      }
      lastRenderMs = now;
      snapshotEl.textContent = JSON.stringify(state, null, 2);
    },
    renderScriptLogs(entries: ReadonlyArray<ShipScriptLogEntry>): void {
      if (!logsEl || entries.length === 0) {
        return;
      }

      const newLines = entries.map(
        (entry) => `[tick ${entry.tick}] ship=${entry.shipId} team=${entry.team} ${entry.level}: ${entry.message}`
      );
      logLines.push(...newLines);
      if (logLines.length > MAX_LOG_LINES) {
        logLines = logLines.slice(logLines.length - MAX_LOG_LINES);
      }
      logsEl.textContent = logLines.join("\n");
      const atBottom = logsEl.scrollHeight - logsEl.scrollTop - logsEl.clientHeight < 40;
      if (atBottom) {
        logsEl.scrollTop = logsEl.scrollHeight;
      }
    }
  };
}
