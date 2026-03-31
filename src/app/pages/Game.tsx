import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "../components/Header";
import { SpaceBackground } from "../components/SpaceBackground";
import { useNavigate, useSearchParams } from "react-router";
import { CommandInputPanel } from "./game/CommandInputPanel";
import { SimulationViewPanel } from "./game/SimulationViewPanel";
import { getStarterCodeForScenario } from "./game/starterCode";
import { createEngine } from "../../engine";
import { createSimulationSystem } from "../../simulation";
import { createCombatSystem } from "../../combat";
import { createEditorSystem } from "../../editor";
import { createShipSandboxSystem } from "../../sandbox";
import { createUiSystem } from "../../ui";
import {
  OBSTACLE_COURSE_OPTIONS,
  createChallengeScenario,
  getChallengeModeName,
  getChallengeObjective,
  getChallengePreviewHud,
  resolveObstacleCourseId
} from "../../simpleMode";
import type { UiSystem, WorldConfig } from "../../contracts";
import type { ChallengeHudState, ChallengeRuntime } from "../../simpleMode";

const DEFAULT_SEED = 1234;
const SUPPORTED_GAME_MODES = new Set(["tutorial", "challenges"]);

export function Game() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedMode = searchParams.get("mode") || "tutorial";
  const mode = SUPPORTED_GAME_MODES.has(requestedMode) ? requestedMode : "tutorial";
  const challenge = searchParams.get("challenge") || "defense";
  const course = resolveObstacleCourseId(searchParams.get("course") || undefined);
  const lesson = searchParams.get("lesson") || "1";
  const scenarioKey =
    mode === "tutorial"
      ? `${mode}:${lesson}`
      : `${mode}:${challenge}:${challenge === "obstacle" ? course : "default"}`;

  const [code, setCode] = useState(() => getStarterCodeForScenario(mode, challenge, lesson, course));
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [challengeHud, setChallengeHud] = useState<ChallengeHudState | null>(() =>
    mode === "challenges" ? getChallengePreviewHud(challenge, course) : null
  );

  const codeRef = useRef(code);
  const scenarioRef = useRef(scenarioKey);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const challengeRef = useRef<ChallengeRuntime | null>(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (scenarioRef.current === scenarioKey) return;
    scenarioRef.current = scenarioKey;

    engineRef.current?.stop();
    setIsRunning(false);
    challengeRef.current = null;
    setCode(getStarterCodeForScenario(mode, challenge, lesson, course));
    setChallengeHud(mode === "challenges" ? getChallengePreviewHud(challenge, course) : null);
    setStatus("Starter code loaded");
  }, [mode, challenge, lesson, course, scenarioKey]);

  useEffect(() => {
    if (!isRunning || mode !== "challenges") return;

    const interval = setInterval(() => {
      const ch = challengeRef.current;
      if (!ch) return;
      setChallengeHud(ch.getHudState());

      if (ch.isFinished()) {
        setIsRunning(false);
        setStatus(ch.getCompletionStatus?.() ?? "Challenge complete");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const handleSelectCourse = useCallback(
    (nextCourse: string) => {
      navigate(`/game?mode=challenges&challenge=obstacle&course=${nextCourse}`);
    },
    [navigate]
  );

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

    let challengeMode: ChallengeRuntime | null = null;
    let worldConfig: WorldConfig | undefined;

    if (mode === "challenges") {
      const scenario = createChallengeScenario(challenge, course, DEFAULT_SEED);
      challengeMode = scenario?.runtime ?? null;
      worldConfig = scenario?.worldConfig;
      challengeRef.current = challengeMode;
      setChallengeHud(challengeMode?.getHudState() ?? getChallengePreviewHud(challenge, course));
    } else {
      challengeRef.current = null;
      setChallengeHud(null);
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
  }, [isRunning, mode, challenge, course]);

  const getModeName = () => {
    if (mode === "challenges") {
      return getChallengeModeName(challenge, course);
    }

    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };
  const scenarioTitle = mode === "challenges" ? getModeName() : undefined;
  const scenarioObjective = mode === "challenges" ? getChallengeObjective(challenge, course) : undefined;
  const courseOptions =
    mode === "challenges" && challenge === "obstacle"
      ? OBSTACLE_COURSE_OPTIONS.map(({ id, label }) => ({ id, label }))
      : undefined;

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
            scenarioTitle={scenarioTitle}
            scenarioObjective={scenarioObjective}
            courseOptions={courseOptions}
            currentCourse={challenge === "obstacle" ? course : undefined}
            onSelectCourse={courseOptions ? handleSelectCourse : undefined}
            onCodeChange={setCode}
            onToggleRun={handleToggleRun}
          />

          <SimulationViewPanel
            mode={mode}
            modeName={getModeName()}
            canvasRef={canvasRef}
            challengeHud={challengeHud}
          />
        </div>
      </div>
    </div>
  );
}
