import type { RefObject } from "react";
import type { ChallengeHudState } from "../../../simpleMode";

type SimulationViewPanelProps = {
  mode: string;
  modeName: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  challengeHud: ChallengeHudState | null;
};

function getToneColor(tone?: "default" | "danger" | "success") {
  if (tone === "danger") return "#FF6B6B";
  if (tone === "success") return "#4ADE80";
  return "#00CFFF";
}

export function SimulationViewPanel({
  mode,
  modeName,
  canvasRef,
  challengeHud
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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: "block" }}
        />

        {mode === "challenges" && challengeHud && (
          <div
            className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-primary p-3 min-w-[160px] z-20"
            style={{ boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)" }}
          >
            <div className="code-font text-xs space-y-3 max-w-[260px]">
              <div>
                <div className="text-primary uppercase tracking-[0.24em] text-[10px]">
                  {challengeHud.title}
                </div>
                <p className="mt-2 text-[#A8D8FF] leading-5">{challengeHud.objective}</p>
              </div>

              <div className="space-y-2">
                {challengeHud.stats.map((stat) => (
                  <div key={stat.label} className="flex justify-between gap-4">
                    <span className="text-[#A8D8FF]">{stat.label}</span>
                    <span style={{ color: getToneColor(stat.tone) }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {challengeHud.completionLabel && (
                <div
                  className="mt-2 text-center text-xs uppercase tracking-wider"
                  style={{ color: getToneColor(challengeHud.completionTone) }}
                >
                  {challengeHud.completionLabel}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
