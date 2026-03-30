type CommandInputPanelProps = {
  mode: string;
  code: string;
  status: string;
  isRunning: boolean;
  scenarioTitle?: string;
  scenarioObjective?: string;
  courseOptions?: ReadonlyArray<{ id: string; label: string }>;
  currentCourse?: string;
  onSelectCourse?: (courseId: string) => void;
  onCodeChange: (code: string) => void;
  onToggleRun: () => void;
};

export function CommandInputPanel({
  mode,
  code,
  status,
  isRunning,
  scenarioTitle,
  scenarioObjective,
  courseOptions,
  currentCourse,
  onSelectCourse,
  onCodeChange,
  onToggleRun
}: CommandInputPanelProps) {
  return (
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

      {(scenarioTitle || scenarioObjective || courseOptions?.length) && (
        <div className="border-b border-primary/20 px-6 py-4 bg-card/40 backdrop-blur-sm space-y-3">
          {scenarioTitle && (
            <div>
              <p className="text-primary uppercase tracking-[0.24em] code-font text-[11px]">
                SCENARIO
              </p>
              <h4 className="mt-1 text-white header-font uppercase tracking-wide">{scenarioTitle}</h4>
            </div>
          )}

          {scenarioObjective && (
            <p className="text-[#A8D8FF] text-xs code-font leading-6">{scenarioObjective}</p>
          )}

          {courseOptions && courseOptions.length > 0 && onSelectCourse && (
            <div className="space-y-2">
              <p className="text-primary uppercase tracking-[0.24em] code-font text-[11px]">
                COURSES
              </p>
              <div className="flex flex-wrap gap-2">
                {courseOptions.map((course) => {
                  const isActive = currentCourse === course.id;

                  return (
                    <button
                      key={course.id}
                      onClick={() => onSelectCourse(course.id)}
                      className={`px-3 py-2 border code-font text-[11px] uppercase tracking-[0.22em] transition-colors ${
                        isActive
                          ? "bg-primary text-black border-primary"
                          : "bg-transparent text-[#A8D8FF] border-primary/40 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {course.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-6 bg-[#0A1020] overflow-auto">
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
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
          onClick={onToggleRun}
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
  );
}
