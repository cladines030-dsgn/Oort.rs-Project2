type CommandInputPanelProps = {
  mode: string;
  code: string;
  status: string;
  isRunning: boolean;
  onCodeChange: (code: string) => void;
  onToggleRun: () => void;
};

export function CommandInputPanel({
  mode,
  code,
  status,
  isRunning,
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
