import { parse } from "acorn";
import { simple as walkSimple } from "acorn-walk";
import MagicString from "magic-string";
import type {
  ShipCommandsApi,
  ShipProgramSource,
  ShipSandboxSystem,
  ShipScriptLogEntry,
  ShipScriptLogLevel
} from "../contracts";

interface SandboxOptions {
  readonly tickBudgetMs?: number;
  readonly compileBudgetMs?: number;
  readonly maxBufferedLogs?: number;
}

interface SandboxConsole {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

type ProgramUpdateFn = (ship: ShipCommandsApi) => void;

const DEFAULT_TICK_BUDGET_MS = 2;
const DEFAULT_COMPILE_BUDGET_MS = 25;
const DEFAULT_MAX_BUFFERED_LOGS = 300;

const FORBIDDEN_SOURCE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bwindow\b/, reason: "window is not available in sandboxed ship code" },
  { pattern: /\bdocument\b/, reason: "document is not available in sandboxed ship code" },
  { pattern: /\bglobalThis\b/, reason: "globalThis is not available in sandboxed ship code" },
  { pattern: /\bself\b/, reason: "self is not available in sandboxed ship code" },
  { pattern: /\bfetch\b/, reason: "network APIs are not available in sandboxed ship code" },
  {
    pattern: /\bXMLHttpRequest\b/,
    reason: "network APIs are not available in sandboxed ship code"
  },
  { pattern: /\bWebSocket\b/, reason: "network APIs are not available in sandboxed ship code" },
  { pattern: /\bWorker\b/, reason: "worker APIs are not available in sandboxed ship code" },
  {
    pattern: /\bSharedWorker\b/,
    reason: "worker APIs are not available in sandboxed ship code"
  },
  {
    pattern: /\bimportScripts\b/,
    reason: "script loading APIs are not available in sandboxed ship code"
  },
  {
    pattern: /\b(localStorage|sessionStorage|indexedDB|caches)\b/,
    reason: "storage APIs are not available in sandboxed ship code"
  },
  { pattern: /\beval\b/, reason: "dynamic code evaluation is not allowed" },
  {
    pattern: /\bFunction\s*\(/,
    reason: "dynamic code evaluation is not allowed"
  },
  {
    pattern: /constructor\s*\.\s*constructor/,
    reason: "prototype constructor escape is not allowed"
  },
  { pattern: /\b(process|require|module|exports|Deno|Bun)\b/, reason: "host APIs are blocked" }
];

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function stringifyLogArg(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ensureSourceAllowed(source: string): void {
  for (const item of FORBIDDEN_SOURCE_PATTERNS) {
    if (item.pattern.test(source)) {
      throw new Error(`Sandbox violation: ${item.reason}`);
    }
  }
}

function prependGuardToBlock(ms: MagicString, block: { start: number }): void {
  ms.appendLeft(block.start + 1, "\n__budgetGuard();\n");
}

function wrapNonBlockLoopBody(
  ms: MagicString,
  body: { start: number; end: number }
): void {
  ms.prependLeft(body.start, "{ __budgetGuard(); ");
  ms.appendRight(body.end, " }");
}

function instrumentSourceForBudgetGuards(source: string): string {
  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowHashBang: true
  }) as unknown;

  const ms = new MagicString(source);

  walkSimple(ast as Parameters<typeof walkSimple>[0], {
    ForStatement(node: { body: { type: string; start: number; end: number } }): void {
      if (node.body.type === "BlockStatement") {
        prependGuardToBlock(ms, node.body);
      } else {
        wrapNonBlockLoopBody(ms, node.body);
      }
    },
    ForInStatement(node: { body: { type: string; start: number; end: number } }): void {
      if (node.body.type === "BlockStatement") {
        prependGuardToBlock(ms, node.body);
      } else {
        wrapNonBlockLoopBody(ms, node.body);
      }
    },
    ForOfStatement(node: { body: { type: string; start: number; end: number } }): void {
      if (node.body.type === "BlockStatement") {
        prependGuardToBlock(ms, node.body);
      } else {
        wrapNonBlockLoopBody(ms, node.body);
      }
    },
    WhileStatement(node: { body: { type: string; start: number; end: number } }): void {
      if (node.body.type === "BlockStatement") {
        prependGuardToBlock(ms, node.body);
      } else {
        wrapNonBlockLoopBody(ms, node.body);
      }
    },
    DoWhileStatement(node: { body: { type: string; start: number; end: number } }): void {
      if (node.body.type === "BlockStatement") {
        prependGuardToBlock(ms, node.body);
      } else {
        wrapNonBlockLoopBody(ms, node.body);
      }
    }
  });

  return ms.toString();
}

function compileProgram(
  source: string,
  sandboxConsole: SandboxConsole,
  budgetGuard: () => void
): ProgramUpdateFn {
  ensureSourceAllowed(source);
  const instrumentedSource = instrumentSourceForBudgetGuards(source);

  const factory = new Function(
    "sandboxConsole",
    "budgetGuard",
    `"use strict";
const window = undefined;
const document = undefined;
const globalThis = undefined;
const self = undefined;
const fetch = undefined;
const XMLHttpRequest = undefined;
const WebSocket = undefined;
const Worker = undefined;
const SharedWorker = undefined;
const importScripts = undefined;
const localStorage = undefined;
const sessionStorage = undefined;
const indexedDB = undefined;
const caches = undefined;
const process = undefined;
const require = undefined;
const module = undefined;
const exports = undefined;
const Deno = undefined;
const Bun = undefined;
const console = sandboxConsole;
const __budgetGuard = budgetGuard;
${instrumentedSource}
if (typeof update !== "function") {
  throw new Error("Ship program must define function update(ship)");
}
return update;`
  ) as (sandboxConsoleArg: SandboxConsole, budgetGuardArg: () => void) => ProgramUpdateFn;

  return factory(sandboxConsole, budgetGuard);
}

export function createShipSandboxSystem(options: SandboxOptions = {}): ShipSandboxSystem {
  const tickBudgetMs = options.tickBudgetMs ?? DEFAULT_TICK_BUDGET_MS;
  const compileBudgetMs = options.compileBudgetMs ?? DEFAULT_COMPILE_BUDGET_MS;
  const maxBufferedLogs = options.maxBufferedLogs ?? DEFAULT_MAX_BUFFERED_LOGS;

  let updateFn: ProgramUpdateFn | null = null;
  let logs: ShipScriptLogEntry[] = [];

  let currentTick = 0;
  let currentShipId = -1;
  let currentTeam = -1;
  let activeBudgetMs = tickBudgetMs;
  let guardStartMs = 0;

  const pushLog = (level: ShipScriptLogLevel, args: ReadonlyArray<unknown>): void => {
    if (logs.length >= maxBufferedLogs) {
      return;
    }
    logs.push({
      tick: currentTick,
      shipId: currentShipId,
      team: currentTeam,
      level,
      message: args.map(stringifyLogArg).join(" ")
    });
  };

  const sandboxConsole: SandboxConsole = {
    log(...args: unknown[]): void {
      pushLog("log", args);
    },
    warn(...args: unknown[]): void {
      pushLog("warn", args);
    },
    error(...args: unknown[]): void {
      pushLog("error", args);
    }
  };

  const budgetGuard = (): void => {
    if (nowMs() - guardStartMs > activeBudgetMs) {
      throw new Error(`Tick budget exceeded (${activeBudgetMs.toFixed(2)}ms)`);
    }
  };

  return {
    initialize(programSource: ShipProgramSource): void {
      currentTick = 0;
      currentShipId = -1;
      currentTeam = -1;
      activeBudgetMs = compileBudgetMs;
      guardStartMs = nowMs();

      try {
        updateFn = compileProgram(programSource, sandboxConsole, budgetGuard);
        pushLog("log", ["Ship program loaded into sandbox"]);
      } catch (error) {
        updateFn = null;
        pushLog("error", ["Ship program rejected by sandbox:", (error as Error).message]);
      } finally {
        activeBudgetMs = tickBudgetMs;
        guardStartMs = 0;
      }
    },

    execute(shipId: number, team: number, tick: number, api: ShipCommandsApi): void {
      if (updateFn === null) {
        return;
      }

      currentTick = tick;
      currentShipId = shipId;
      currentTeam = team;
      activeBudgetMs = tickBudgetMs;
      guardStartMs = nowMs();

      try {
        updateFn(api);
        budgetGuard();
      } catch (error) {
        pushLog("error", ["Ship script runtime error:", (error as Error).message]);
      }
    },

    flushLogs(): ReadonlyArray<ShipScriptLogEntry> {
      const snapshot = logs;
      logs = [];
      return snapshot;
    }
  };
}
