import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { SpaceBackground } from "../components/SpaceBackground";
import { useSearchParams } from "react-router";
import { createEngine } from "../../engine";
import { createSimulationSystem } from "../../simulation";
import { createCombatSystem } from "../../combat";
import { createEditorSystem } from "../../editor";
import { createShipSandboxSystem } from "../../sandbox";
import { createUiSystem } from "../../ui";
import {
  createTargetChallange,
  createTargetChallengeConfig
} from "../../simpleMode";
import type { UiSystem, WorldConfig } from "../../contracts";

const TUTORIAL_LESSON_STARTER_CODE: Record<string, string> = {
  "1": `// Tutorial 1: Basic Movement
// update(ship) runs 60 times per second.
// Goal: make controlled movement instead of drifting forever.

function update(ship) {
  // Two-point patrol using moveTo helper.
  const phase = Math.floor(ship.currentTick() / 180) % 2;
  const waypoint = phase === 0 ? { x: 1200, y: 0 } : { x: -1200, y: 0 };
  ship.moveTo(waypoint.x, waypoint.y);

  // Keep one weapon active so you can see fire/reload behavior.
  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "2": `// Tutorial 2: Steering Practice
// Goal: hold near the center and rotate to inspect heading control.

function update(ship) {
  // Stay near center to avoid endless forward travel.
  ship.moveTo(0, 0);

  // Slow continuous turn while parked near center.
  ship.turn(0.6);

  // Fire on cooldown.
  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "3": `// Tutorial 3: Weapons & Combat
// Goal: act like a stationary turret and fire whenever possible.

function update(ship) {
  // Brake first so recoil/motion does not drift you away.
  ship.brake(1.0);

  // Sweep firing arc.
  ship.turn(1.0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "4": `// Tutorial 4: Coordination Prep
// Fleet messaging APIs are not wired yet.
// For now, this starter demonstrates stable patrol + fire control.

function update(ship) {
  const phase = Math.floor(ship.currentTick() / 240) % 4;

  if (phase === 0) ship.moveTo(800, 800);
  if (phase === 1) ship.moveTo(-800, 800);
  if (phase === 2) ship.moveTo(-800, -800);
  if (phase === 3) ship.moveTo(800, -800);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  default: `// Tutorial starter
// Keep update(ship) defined. It runs every tick.

function update(ship) {
  ship.moveTo(0, 0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`
};

const STANDARD_STARTER_CODE = `// Standard starter
// update(ship) runs every tick.

function update(ship) {
  ship.thrust(1.0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`;

const CHALLENGE_STARTER_CODE: Record<string, string> = {
  // Challenge-specific templates live here.
  // Add new keys as scenarios are implemented (defense, obstacle, etc).
  shooting: `// Challenge: Target Practice
// Goal: Destroy as many static targets as possible before time runs out.

function update(ship) {
  // Stay controlled and rotate to sweep targets.
  ship.brake(1.0);
  ship.turn(0.9);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,
  defense: `// Challenge: Defense (starter placeholder)
// Tip: Keep your ship between threats and the protected zone.

function update(ship) {
  // TODO: Move to patrol position.
  // TODO: Prioritize nearest threat.
}`,
  obstacle: `// Challenge: Obstacle Course (starter placeholder)
// Tip: Balance thrust and turning to avoid collisions.

function update(ship) {
  // TODO: Steer toward checkpoints.
  // TODO: Slow down before tight turns.
}`,
  default: `// Challenge starter
// Scenario-specific starting code can be added in CHALLENGE_STARTER_CODE.

function update(ship) {
  // TODO: Implement your challenge strategy.
}`
};

const CHALLENGE_DISPLAY_NAMES: Record<string, string> = {
  shooting: "Target Practice",
  defense: "Defense",
  obstacle: "Obstacle Course"
};

function getStarterCodeForScenario(mode: string, challenge: string, lesson: string): string {
  if (mode === "tutorial") {
    return TUTORIAL_LESSON_STARTER_CODE[lesson] ?? TUTORIAL_LESSON_STARTER_CODE.default;
  }

  if (mode === "challenges") {
    return CHALLENGE_STARTER_CODE[challenge] ?? CHALLENGE_STARTER_CODE.default;
  }

  return STANDARD_STARTER_CODE;
}

const DEFAULT_SEED = 1234;

export function Game() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "tutorial";
  const challenge = searchParams.get("challenge") || "defense";
  const lesson = searchParams.get("lesson") || "1";
  const scenarioKey = mode === "tutorial" ? `${mode}:${lesson}` : `${mode}:${challenge}`;

  const [code, setCode] = useState(() => getStarterCodeForScenario(mode, challenge, lesson));
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeTime, setChallengeTime] = useState(60);
  const [challengeDone, setChallengeDone] = useState(false);
  const [hitPops, setHitPops] = useState<{ id: number }[]>([]);
  const hitPopIdRef = useRef(0);

  // Refs — keep latest values that the engine needs without re-creating it
  const codeRef = useRef(code);
  const scenarioRef = useRef(scenarioKey);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const editorRef = useRef<ReturnType<typeof createEditorSystem> | null>(null);
  const challengeRef = useRef<ReturnType<typeof createTargetChallange> | null>(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (scenarioRef.current === scenarioKey) return;
    scenarioRef.current = scenarioKey;

    engineRef.current?.stop();
    setIsRunning(false);
    setCode(getStarterCodeForScenario(mode, challenge, lesson));
    setStatus("Starter code loaded");
  }, [mode, challenge, lesson, scenarioKey]);

  // Poll challenge score/time/hits while running (shooting mode only)
  useEffect(() => {
    if (!isRunning || challenge !== "shooting") return;
    const interval = setInterval(() => {
      const ch = challengeRef.current;
      if (!ch) return;
      setChallengeScore(ch.getScore());
      setChallengeTime(ch.getTime());

      const newHits = ch.flushHits();
      if (newHits > 0) {
        setHitPops((prev) => {
          const additions = Array.from({ length: newHits }, () => {
            hitPopIdRef.current += 1;
            return { id: hitPopIdRef.current };
          });
          return [...prev, ...additions];
        });
      }

      if (ch.isFinished()) {
        setChallengeDone(true);
        setIsRunning(false);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, challenge]);

  // Stop engine if component unmounts while running
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const handleToggleRun = useCallback(() => {
    if (isRunning) {
      engineRef.current?.stop();
      setIsRunning(false);
      setStatus("Simulation stopped");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create fresh systems for each run
    const simulation = createSimulationSystem();
    const combat = createCombatSystem();
    const freshEditor = createEditorSystem();
    const sandbox = createShipSandboxSystem();
    const ui = createUiSystem() as UiSystem & { attachToCanvas: (c: HTMLCanvasElement) => void };
    ui.attachToCanvas(canvas);
    freshEditor.initialize();
    freshEditor.setProgramSource(codeRef.current);
    editorRef.current = freshEditor;

    let challengeMode: ReturnType<typeof createTargetChallange> | null = null;
    let worldConfig: WorldConfig | undefined;

    if (challenge === "shooting") {
      const rng = { next: () => Math.random() };
      const ch = createTargetChallange();
      challengeRef.current = ch;
      challengeMode = ch;
      worldConfig = createTargetChallengeConfig(rng);
      setChallengeScore(0);
      setChallengeTime(60);
      setChallengeDone(false);
      setHitPops([]);
    }

    const engine = createEngine({
      simulation,
      combat,
      editor: freshEditor,
      sandbox,
      ui,
      timestepSeconds: 1 / 60,
      targetChallenge: challengeMode
    });
    engineRef.current = engine;
    engine.start(DEFAULT_SEED, worldConfig);
    setIsRunning(true);
    setStatus("Simulation running");
  }, [isRunning, challenge]);

  const formatTime = (seconds: number) => {
    const secs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(secs / 60);
    return `${mins}:${String(secs % 60).padStart(2, "0")}`;
  };

  const getTimeColor = () => (challengeTime < 15 ? "#FF4B4B" : "#00CFFF");

  const getModeName = () => {
    if (mode === "challenges") {
      return CHALLENGE_DISPLAY_NAMES[challenge] ?? challenge;
    }

    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const isPlaceholderChallenge =
    mode === "challenges" && challenge !== "shooting";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <SpaceBackground />

      <div className="relative z-10 flex flex-col h-screen">
        <Header />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Half - Code Editor */}
          <div className="w-1/2 border-r border-primary/30 flex flex-col">
            <div className="border-b border-primary/30 px-6 py-3 bg-card/60 backdrop-blur-sm flex items-center justify-between">
              <div>
                <h3 className="text-primary uppercase tracking-wider code-font text-sm neon-text">
                  COMMAND INPUT
                </h3>
                {mode === "multiplayer" && (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full bg-[#A8D8FF]"
                      style={{
                        boxShadow: "0 0 5px #A8D8FF"
                      }}
                    />
                    <span className="text-[#A8D8FF] text-xs code-font">YOU</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 bg-[#0A1020] overflow-auto">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent text-foreground code-font resize-none focus:outline-none text-sm"
                style={{
                  caretColor: "#00CFFF",
                  lineHeight: "1.6"
                }}
                spellCheck={false}
              />
            </div>

            <div className="p-4 border-t border-primary/30 bg-card/60 backdrop-blur-sm">
              <button
                onClick={handleToggleRun}
                className="w-full py-3 px-6 bg-primary text-black uppercase tracking-wider hover:bg-white transition-all code-font border border-primary"
                style={{
                  boxShadow: "0 0 15px rgba(0, 207, 255, 0.4)"
                }}
              >
                [ {isRunning ? "STOP" : "RUN"} SIMULATION ]
              </button>
              {status !== "Ready" && (
                <p className="mt-2 text-xs code-font text-center text-[#A8D8FF]">{status}</p>
              )}
            </div>
          </div>

          {/* Right Half - Game View */}
          <div className="w-1/2 flex flex-col">
            <div className="border-b border-primary/30 px-6 py-3 bg-card/60 backdrop-blur-sm">
              <h3 className="text-primary uppercase tracking-wider code-font text-sm neon-text">
                SIMULATION VIEW
              </h3>
              {mode === "challenges" && (
                <div className="mt-1 text-[#A8D8FF] text-xs code-font">▸ {getModeName()}</div>
              )}
            </div>

            <div className="flex-1 relative bg-black overflow-hidden">
              {isPlaceholderChallenge ? (
                /* Placeholder for Defense and Obstacle Course challenges */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div
                    className="text-primary opacity-30"
                    style={{ fontSize: "64px", lineHeight: 1 }}
                  >
                    ⬡
                  </div>
                  <div className="text-center">
                    <h2
                      className="uppercase tracking-widest header-font mb-3"
                      style={{ color: "#00CFFF" }}
                    >
                      {getModeName()} Challenge
                    </h2>
                    <p className="code-font text-sm text-[#A8D8FF]/60 max-w-sm">
                      Coming soon — this challenge is under construction.
                    </p>
                  </div>
                  <div
                    className="px-6 py-2 border border-primary/40 code-font text-xs uppercase tracking-widest text-primary/60"
                    style={{ boxShadow: "0 0 10px rgba(0, 207, 255, 0.1)" }}
                  >
                    [ PLACEHOLDER ]
                  </div>
                </div>
              ) : (
                /* Real canvas-based simulation */
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ display: "block" }}
                />
              )}

              {/* Challenge scoreboard (shooting mode only) */}
              {mode === "challenges" && challenge === "shooting" && (
                <div
                  className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-primary p-3 min-w-[160px] z-20"
                  style={{ boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)" }}
                >
                  <div className="code-font text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#A8D8FF]">TIME</span>
                      <span style={{ color: getTimeColor() }}>
                        {formatTime(challengeTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#A8D8FF]">SCORE</span>
                      <div className="relative flex items-center justify-end">
                        <span className="text-white">{challengeScore}</span>
                        <div className="absolute right-full mr-2 pointer-events-none" style={{ width: "52px" }}>
                          <AnimatePresence>
                            {hitPops.map((pop) => (
                              <motion.span
                                key={pop.id}
                                className="absolute right-0 code-font text-[10px] font-bold whitespace-nowrap"
                                style={{ color: "#4ade80", textShadow: "0 0 6px #4ade80" }}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -28 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.1, ease: "easeOut" }}
                                onAnimationComplete={() =>
                                  setHitPops((prev) => prev.filter((p) => p.id !== pop.id))
                                }
                              >
                                HIT +10
                              </motion.span>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    {challengeDone && (
                      <div className="mt-2 text-center text-[#00CFFF] text-xs uppercase tracking-wider">
                        COMPLETE!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
