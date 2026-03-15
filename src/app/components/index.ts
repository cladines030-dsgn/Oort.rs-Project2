import type {
  ShipClass,
  ShipProgramSource,
  ShipScriptLogEntry,
  ShipSnapshot,
  UiRenderFrame,
  UiSystem
} from "../contracts";

const MAX_LOG_LINES = 120;
const TEAM_COLORS = ["#60a5fa", "#fb7185", "#34d399", "#f59e0b"];
const PROJECTILE_COLORS: Record<string, string> = {
  Gun: "#f8fafc",
  Missile: "#fbbf24",
  Torpedo: "#f97316",
  Decoy: "#a78bfa"
};
const SHIP_RADIUS_BY_CLASS: Record<ShipClass, number> = {
  Fighter: 18,
  Frigate: 30,
  Cruiser: 42,
  Missile: 12,
  Torpedo: 14
};
const SENSOR_RANGE_BY_CLASS: Record<ShipClass, number> = {
  Fighter: 3200,
  Frigate: 4500,
  Cruiser: 5600,
  Missile: 1800,
  Torpedo: 2500
};

interface InterpolatedShip {
  id: number;
  team: number;
  class: ShipClass;
  health: number;
  x: number;
  y: number;
  heading: number;
}

interface InterpolatedProjectile {
  id: number;
  weaponType: string;
  x: number;
  y: number;
}

interface ExplosionFx {
  x: number;
  y: number;
  radius: number;
  ageSeconds: number;
  lifetimeSeconds: number;
  color: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}

function ensureCanvasSize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function teamColor(team: number): string {
  return TEAM_COLORS[Math.abs(team) % TEAM_COLORS.length] ?? "#f8fafc";
}

function mapById(ships: ReadonlyArray<ShipSnapshot>): Map<number, ShipSnapshot> {
  return new Map(ships.map((ship) => [ship.id, ship]));
}

function interpolateShips(frame: UiRenderFrame): InterpolatedShip[] {
  const alpha = clamp(frame.interpolationAlpha, 0, 1);
  const previousById = mapById(frame.previousState.ships);

  return frame.state.ships.map((ship) => {
    const prev = previousById.get(ship.id);
    if (!prev) {
      return {
        id: ship.id,
        team: ship.team,
        class: ship.class,
        health: ship.health,
        x: ship.position.x,
        y: ship.position.y,
        heading: ship.heading
      };
    }

    return {
      id: ship.id,
      team: ship.team,
      class: ship.class,
      health: ship.health,
      x: lerp(prev.position.x, ship.position.x, alpha),
      y: lerp(prev.position.y, ship.position.y, alpha),
      heading: lerpAngle(prev.heading, ship.heading, alpha)
    };
  });
}

function interpolateProjectiles(frame: UiRenderFrame): InterpolatedProjectile[] {
  const alpha = clamp(frame.interpolationAlpha, 0, 1);
  const previousById = new Map(
    frame.previousState.projectiles.map((projectile) => [projectile.id, projectile])
  );

  return frame.state.projectiles.map((projectile) => {
    const prev = previousById.get(projectile.id);
    if (!prev) {
      return {
        id: projectile.id,
        weaponType: projectile.weaponType,
        x: projectile.position.x,
        y: projectile.position.y
      };
    }

    return {
      id: projectile.id,
      weaponType: projectile.weaponType,
      x: lerp(prev.position.x, projectile.position.x, alpha),
      y: lerp(prev.position.y, projectile.position.y, alpha)
    };
  });
}

export function createUiSystem(): UiSystem {
  let statusEl: HTMLParagraphElement | null = null;
  let logsEl: HTMLPreElement | null = null;
  let canvasEl: HTMLCanvasElement | null = null;
  let codeEditorEl: HTMLTextAreaElement | null = null;
  let tickValueEl: HTMLSpanElement | null = null;
  let shipsValueEl: HTMLSpanElement | null = null;
  let projectilesValueEl: HTMLSpanElement | null = null;
  let fpsValueEl: HTMLSpanElement | null = null;

  let runHandler: (() => void) | null = null;
  let stopHandler: (() => void) | null = null;
  let resetHandler: (() => void) | null = null;

  let logLines: string[] = [];
  let cameraZoom = 1;
  let cameraCenterX = 0;
  let cameraCenterY = 0;

  let previousRenderTimeMs = 0;
  let rollingFps = 0;
  let lastFxTick = -1;
  let fx: ExplosionFx[] = [];

  function draw(frame: UiRenderFrame): void {
    if (!canvasEl) {
      return;
    }

    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      return;
    }

    const now = performance.now();
    const dt = previousRenderTimeMs > 0 ? (now - previousRenderTimeMs) / 1000 : 0;
    previousRenderTimeMs = now;
    if (dt > 0) {
      const instantFps = 1 / dt;
      rollingFps = rollingFps === 0 ? instantFps : lerp(rollingFps, instantFps, 0.12);
    }

    const { width, height } = ensureCanvasSize(canvasEl, ctx);
    const pxPerMeter = (Math.min(width, height) / frame.state.worldSize) * cameraZoom;

    const worldToScreen = (x: number, y: number): { x: number; y: number } => {
      return {
        x: width * 0.5 + (x - cameraCenterX) * pxPerMeter,
        y: height * 0.5 - (y - cameraCenterY) * pxPerMeter
      };
    };

    const ships = interpolateShips(frame);
    const projectiles = interpolateProjectiles(frame);

    if (frame.state.tick !== lastFxTick) {
      const shipById = new Map(ships.map((ship) => [ship.id, ship]));
      for (const event of frame.state.combatEvents) {
        if (event.type !== "hit" && event.type !== "kill") {
          continue;
        }
        const target = event.targetId !== undefined ? shipById.get(event.targetId) : undefined;
        const attacker = shipById.get(event.attackerId);
        const source = target ?? attacker;
        if (!source) {
          continue;
        }
        fx.push({
          x: source.x,
          y: source.y,
          radius: event.type === "kill" ? 180 : 90,
          ageSeconds: 0,
          lifetimeSeconds: event.type === "kill" ? 0.55 : 0.3,
          color: event.type === "kill" ? "#f97316" : "#fde68a"
        });
      }
      lastFxTick = frame.state.tick;
    }

    fx = fx
      .map((item) => ({ ...item, ageSeconds: item.ageSeconds + dt }))
      .filter((item) => item.ageSeconds <= item.lifetimeSeconds);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#020617");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    const gridSpacingMeters = 1000;
    const gridPixel = gridSpacingMeters * pxPerMeter;
    if (gridPixel > 20) {
      const startX = ((width * 0.5 + cameraCenterX * pxPerMeter) % gridPixel) - gridPixel;
      const startY = ((height * 0.5 - cameraCenterY * pxPerMeter) % gridPixel) - gridPixel;
      for (let x = startX; x < width + gridPixel; x += gridPixel) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y < height + gridPixel; y += gridPixel) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    ctx.save();
    for (const ship of ships) {
      if (ship.health <= 0) {
        continue;
      }
      const screen = worldToScreen(ship.x, ship.y);
      const sensorRadius = SENSOR_RANGE_BY_CLASS[ship.class] * pxPerMeter;
      ctx.strokeStyle = `${teamColor(ship.team)}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, sensorRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    for (const projectile of projectiles) {
      const screen = worldToScreen(projectile.x, projectile.y);
      const radius = 2.5;
      ctx.fillStyle = PROJECTILE_COLORS[projectile.weaponType] ?? "#ffffff";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const ship of ships) {
      const screen = worldToScreen(ship.x, ship.y);
      const radius = Math.max(4, SHIP_RADIUS_BY_CLASS[ship.class] * pxPerMeter);
      const shipColor = teamColor(ship.team);

      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(-ship.heading);

      ctx.fillStyle = `${shipColor}dd`;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(radius * 1.25, 0);
      ctx.lineTo(-radius * 0.9, radius * 0.72);
      ctx.lineTo(-radius * 0.52, 0);
      ctx.lineTo(-radius * 0.9, -radius * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    for (const explosion of fx) {
      const progress = clamp(explosion.ageSeconds / explosion.lifetimeSeconds, 0, 1);
      const screen = worldToScreen(explosion.x, explosion.y);
      const radius = explosion.radius * pxPerMeter * (0.25 + progress * 0.95);
      const alpha = 1 - progress;
      ctx.strokeStyle = `${explosion.color}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (tickValueEl) {
      tickValueEl.textContent = String(frame.state.tick);
    }
    if (shipsValueEl) {
      shipsValueEl.textContent = String(frame.state.ships.filter((ship) => ship.health > 0).length);
    }
    if (projectilesValueEl) {
      projectilesValueEl.textContent = String(frame.state.projectiles.length);
    }
    if (fpsValueEl) {
      fpsValueEl.textContent = rollingFps > 0 ? rollingFps.toFixed(1) : "0.0";
    }
  }

  return {
    mount(container: HTMLElement): void {
      container.innerHTML = "";

      const shell = document.createElement("section");
      shell.className = "app-shell";

      const leftColumn = document.createElement("section");
      leftColumn.className = "left-column";

      const leftTop = document.createElement("section");
      leftTop.className = "left-top";

      const headingRow = document.createElement("div");
      headingRow.className = "heading-row";

      const title = document.createElement("h1");
      title.textContent = "Oort.js Battle Lab";

      statusEl = document.createElement("p");
      statusEl.className = "status";
      statusEl.textContent = "Ready";

      headingRow.append(title, statusEl);

      const controls = document.createElement("div");
      controls.className = "controls";

      const runBtn = document.createElement("button");
      runBtn.type = "button";
      runBtn.textContent = "Run";
      runBtn.addEventListener("click", () => {
        runHandler?.();
      });

      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.textContent = "Stop";
      stopBtn.addEventListener("click", () => {
        stopHandler?.();
      });

      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.textContent = "Reset";
      resetBtn.addEventListener("click", () => {
        resetHandler?.();
      });

      controls.append(runBtn, stopBtn, resetBtn);

      const codeHeader = document.createElement("div");
      codeHeader.className = "code-header";

      const codeLabel = document.createElement("h2");
      codeLabel.textContent = "Ship Program";

      const codeHelp = document.createElement("p");
      codeHelp.textContent = "Edit update(ship), then Run to compile in the sandbox.";

      codeHeader.append(codeLabel, codeHelp);

      codeEditorEl = document.createElement("textarea");
      codeEditorEl.className = "code-editor";
      codeEditorEl.spellcheck = false;
      codeEditorEl.wrap = "off";

      leftTop.append(headingRow, controls, codeHeader, codeEditorEl);

      const leftBottom = document.createElement("section");
      leftBottom.className = "left-bottom";

      const logsTitle = document.createElement("h2");
      logsTitle.textContent = "Output Log";

      logsEl = document.createElement("pre");
      logsEl.className = "script-logs";
      logsEl.textContent = "Ship logs will appear here";
      logLines = [];

      leftBottom.append(logsTitle, logsEl);

      leftColumn.append(leftTop, leftBottom);

      const rightColumn = document.createElement("section");
      rightColumn.className = "right-column";

      const battleHeader = document.createElement("div");
      battleHeader.className = "battle-header";

      const battleTitle = document.createElement("h2");
      battleTitle.textContent = "Battle Visualization";

      const cameraControls = document.createElement("div");
      cameraControls.className = "camera-controls";

      const zoomOutBtn = document.createElement("button");
      zoomOutBtn.type = "button";
      zoomOutBtn.textContent = "-";
      zoomOutBtn.addEventListener("click", () => {
        cameraZoom = clamp(cameraZoom * 0.8, 0.35, 4);
      });

      const fitBtn = document.createElement("button");
      fitBtn.type = "button";
      fitBtn.textContent = "Fit";
      fitBtn.addEventListener("click", () => {
        cameraZoom = 1;
        cameraCenterX = 0;
        cameraCenterY = 0;
      });

      const zoomInBtn = document.createElement("button");
      zoomInBtn.type = "button";
      zoomInBtn.textContent = "+";
      zoomInBtn.addEventListener("click", () => {
        cameraZoom = clamp(cameraZoom * 1.25, 0.35, 4);
      });

      cameraControls.append(zoomOutBtn, fitBtn, zoomInBtn);
      battleHeader.append(battleTitle, cameraControls);

      const battleCanvasWrap = document.createElement("div");
      battleCanvasWrap.className = "battle-canvas-wrap";

      canvasEl = document.createElement("canvas");
      canvasEl.className = "battle-canvas";
      battleCanvasWrap.append(canvasEl);

      const hud = document.createElement("div");
      hud.className = "battle-hud";

      const tickLine = document.createElement("p");
      tickLine.innerHTML = 'Tick: <span data-role="tick">0</span>';
      tickValueEl = tickLine.querySelector("span");

      const shipLine = document.createElement("p");
      shipLine.innerHTML = 'Alive ships: <span data-role="ships">0</span>';
      shipsValueEl = shipLine.querySelector("span");

      const projectileLine = document.createElement("p");
      projectileLine.innerHTML = 'Projectiles: <span data-role="projectiles">0</span>';
      projectilesValueEl = projectileLine.querySelector("span");

      const fpsLine = document.createElement("p");
      fpsLine.innerHTML = 'Render FPS: <span data-role="fps">0.0</span>';
      fpsValueEl = fpsLine.querySelector("span");

      hud.append(tickLine, shipLine, projectileLine, fpsLine);

      rightColumn.append(battleHeader, battleCanvasWrap, hud);
      shell.append(leftColumn, rightColumn);
      container.append(shell);
    },

    updateStatus(message: string): void {
      if (statusEl) {
        statusEl.textContent = message;
      }
    },

    render(frame: UiRenderFrame): void {
      draw(frame);
    },

    renderScriptLogs(entries: ReadonlyArray<ShipScriptLogEntry>): void {
      if (!logsEl || entries.length === 0) {
        return;
      }

      const wasNearBottom = logsEl.scrollHeight - logsEl.scrollTop - logsEl.clientHeight < 40;
      const newLines = entries.map(
        (entry) =>
          `[tick ${entry.tick}] ship=${entry.shipId} team=${entry.team} ${entry.level}: ${entry.message}`
      );
      logLines.push(...newLines);
      if (logLines.length > MAX_LOG_LINES) {
        logLines = logLines.slice(logLines.length - MAX_LOG_LINES);
      }
      logsEl.textContent = logLines.join("\n");

      if (wasNearBottom) {
        logsEl.scrollTop = logsEl.scrollHeight;
      }
    },

    getProgramSource(): ShipProgramSource {
      return codeEditorEl?.value ?? "";
    },

    setProgramSource(source: ShipProgramSource): void {
      if (codeEditorEl) {
        codeEditorEl.value = source;
      }
    },

    onRunRequested(handler: () => void): void {
      runHandler = handler;
    },

    onStopRequested(handler: () => void): void {
      stopHandler = handler;
    },

    onResetRequested(handler: () => void): void {
      resetHandler = handler;
    }
  };
}
