import { AnimatePresence, motion } from "motion/react";
import type { RefObject } from "react";

type HitPop = { id: number };

type SimulationViewPanelProps = {
  mode: string;
  challenge: string;
  modeName: string;
  isPlaceholderChallenge: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  challengeScore: number;
  challengeTime: number;
  challengeDone: boolean;
  hitPops: HitPop[];
  onHitPopAnimationComplete: (id: number) => void;
};

function formatTime(seconds: number) {
  const secs = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(secs / 60);
  return `${mins}:${String(secs % 60).padStart(2, "0")}`;
}

function getTimeColor(seconds: number) {
  return seconds < 15 ? "#FF4B4B" : "#00CFFF";
}

export function SimulationViewPanel({
  mode,
  challenge,
  modeName,
  isPlaceholderChallenge,
  canvasRef,
  challengeScore,
  challengeTime,
  challengeDone,
  hitPops,
  onHitPopAnimationComplete
}: SimulationViewPanelProps) {
  return (
    <div className="w-1/2 flex flex-col">
      <div className="border-b border-primary/30 px-6 py-3 bg-card/60 backdrop-blur-sm">
        <h3 className="text-primary uppercase tracking-wider code-font text-sm neon-text">
          SIMULATION VIEW
        </h3>
        {mode === "challenges" && (
          <div className="mt-1 text-[#A8D8FF] text-xs code-font">▸ {modeName}</div>
        )}
      </div>

      <div className="flex-1 relative bg-black overflow-hidden">
        {isPlaceholderChallenge ? (
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
                {modeName} Challenge
              </h2>
              <p className="code-font text-sm text-[#A8D8FF]/60 max-w-sm">
                Coming soon - this challenge is under construction.
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
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ display: "block" }}
          />
        )}

        {mode === "challenges" && challenge === "shooting" && (
          <div
            className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-primary p-3 min-w-[160px] z-20"
            style={{ boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)" }}
          >
            <div className="code-font text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#A8D8FF]">TIME</span>
                <span style={{ color: getTimeColor(challengeTime) }}>
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
                          onAnimationComplete={() => onHitPopAnimationComplete(pop.id)}
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
  );
}
