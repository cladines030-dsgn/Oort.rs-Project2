import { Link } from "react-router";

export function Header() {
  return (
    <header
      className="border-b border-primary/20 py-4 mb-8 relative bg-black/40 backdrop-blur-sm z-[10000]"
      style={{
        boxShadow: "0 1px 0 rgba(0, 207, 255, 0.2)"
      }}
    >
      <div
        className="mx-auto px-8 flex items-center justify-between"
        style={{ maxWidth: "1440px" }}
      >
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="header-font tracking-wider text-white">Oort.rs</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 code-font text-sm">
          <Link
            to="/tutorial"
            className="text-[#A8D8FF] hover:text-primary transition-colors relative group"
          >
            Tutorial
            <span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"
              style={{
                boxShadow: "0 0 5px #00CFFF"
              }}
            />
          </Link>

          <div className="relative group">
            <button className="text-[#A8D8FF] hover:text-primary transition-colors flex items-center gap-1">
              Challenges
              <span className="text-xs">▾</span>
            </button>
            <div className="absolute top-full left-0 pt-2 hidden group-hover:block group-focus-within:block min-w-[200px] z-[9999]">
              <div
                className="bg-[#0A1020] border border-primary"
                style={{
                  boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)"
                }}
              >
                <Link
                  to="/game?mode=challenges&challenge=defense"
                  className="block px-4 py-2 text-[#A8D8FF] hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  Defense
                </Link>
                <Link
                  to="/game?mode=challenges&challenge=obstacle"
                  className="block px-4 py-2 text-[#A8D8FF] hover:bg-primary/10 hover:text-primary transition-colors border-t border-primary/20"
                >
                  Obstacle Course
                </Link>
                <Link
                  to="/game?mode=challenges&challenge=shooting"
                  className="block px-4 py-2 text-[#A8D8FF] hover:bg-primary/10 hover:text-primary transition-colors border-t border-primary/20"
                >
                  Target Practice
                </Link>
              </div>
            </div>
          </div>

          <Link
            to="/multiplayer"
            className="text-[#A8D8FF] hover:text-primary transition-colors relative group"
          >
            Multi-Play
            <span
              className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"
              style={{
                boxShadow: "0 0 5px #00CFFF"
              }}
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}
