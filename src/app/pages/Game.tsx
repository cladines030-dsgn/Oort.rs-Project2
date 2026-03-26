import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "../components/Header";
import { SpaceBackground } from "../components/SpaceBackground";
import { useSearchParams } from "react-router";
import { CommandInputPanel } from "./game/CommandInputPanel";
import { SimulationViewPanel } from "./game/SimulationViewPanel";
import {
  CHALLENGE_DISPLAY_NAMES,
  getStarterCodeForScenario
} from "./game/starterCode";
import { createEngine } from "../../engine";
import { createSimulationSystem } from "../../simulation";
import { createCombatSystem } from "../../combat";
import { createEditorSystem } from "../../editor";
import { createShipSandboxSystem } from "../../sandbox";
import { createUiSystem } from "../../ui";
import {
  createTargetChallenge,
  createTargetChallengeConfig
} from "../../simpleMode";
import type { UiSystem, WorldConfig } from "../../contracts";

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
  const challengeRef = useRef<ReturnType<typeof createTargetChallenge> | null>(null);

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

    let challengeMode: ReturnType<typeof createTargetChallenge> | null = null;
    let worldConfig: WorldConfig | undefined;

    if (challenge === "shooting") {
      const rng = { next: () => Math.random() };
      const ch = createTargetChallenge();
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
          <CommandInputPanel
            mode={mode}
            code={code}
            status={status}
            isRunning={isRunning}
            onCodeChange={setCode}
            onToggleRun={handleToggleRun}
          />

          <SimulationViewPanel
            mode={mode}
            challenge={challenge}
            modeName={getModeName()}
            isPlaceholderChallenge={isPlaceholderChallenge}
            canvasRef={canvasRef}
            challengeScore={challengeScore}
            challengeTime={challengeTime}
            challengeDone={challengeDone}
            hitPops={hitPops}
            onHitPopAnimationComplete={(id) =>
              setHitPops((prev) => prev.filter((pop) => pop.id !== id))
            }
          />
        </div>
      </div>
    </div>
  );
}
