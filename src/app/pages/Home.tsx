import { useState } from "react";
import { GridContainer } from "../components/GridContainer";
import { PageCard } from "../components/PageCard";
import { HeroPanel } from "../components/HeroPanel";
import { SpaceBackground } from "../components/SpaceBackground";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export function Home() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  const dropdownContent = {
    "What is Oort.rs?":
      "Oort.rs is a programming game where you control spaceships by writing TypeScript. Command everything from tiny missiles to massive cruisers. Your code runs in real-time simulations at 60 frames per second, managing engines, weapons, radar, and communications systems.",
    "How do I start?":
      "Begin your journey in the Tutorial to master basic ship control and combat tactics. Progress through Challenges to test your skills in specialized scenarios like Defense, Obstacle Course, and Target Practice. When ready, face real opponents in Multi-Play mode.",
    "Your first mission":
      "Your first tutorial mission teaches fundamental ship control. Learn to activate engines, rotate your ship, and fire weapons. Master the radar system to detect enemies and coordinate fleet movements. Each lesson builds your skills for more complex battles."
  };

  const handleChallengeClick = (mode: string) => {
    navigate(`/game?mode=challenges&challenge=${mode}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      <div className="relative z-10">
        <GridContainer>
          {/* Hero Panel */}
          <div className="pt-12">
            <HeroPanel />
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="header-font mb-4" style={{ fontSize: "4rem", letterSpacing: "0.2em" }}>
              <span className="text-white neon-text">OORT.RS</span>
            </h1>
            <p className="code-font text-[#A8D8FF] text-sm tracking-wide">
              "Program your fleet. Command the void."
            </p>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <PageCard
              title="Tutorial"
              to="/game?mode=tutorial"
              icon={
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 8L32 16L24 24L16 16L24 8Z" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M14 18L24 28L34 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="24" cy="32" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              }
            >
              <p className="text-[#A8D8FF]">"Learn to fly. Learn to fight."</p>
            </PageCard>

            {expandedCard === "challenges" ? (
              <motion.div
                className="bg-card border border-primary/40 p-8 h-full relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  boxShadow:
                    "0 0 20px rgba(0, 207, 255, 0.3), inset 0 0 20px rgba(0, 207, 255, 0.1)"
                }}
              >
                <div className="mb-4 text-primary">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="2" fill="currentColor" />
                    <path
                      d="M12 24L8 24M40 24L36 24M24 12L24 8M24 40L24 36"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 8L12 12M36 8L32 12M16 40L12 36M36 40L32 36"
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  </svg>
                </div>

                <h3 className="mb-4 uppercase tracking-wider text-white header-font">Challenges</h3>
                <p className="code-font text-sm text-[#A8D8FF] mb-6">
                  "Test your code under fire."
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleChallengeClick("defense")}
                    className="w-full py-3 px-4 bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black transition-all code-font text-sm uppercase tracking-wider"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)"
                    }}
                  >
                    Defense
                  </button>
                  <button
                    onClick={() => handleChallengeClick("obstacle")}
                    className="w-full py-3 px-4 bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black transition-all code-font text-sm uppercase tracking-wider"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)"
                    }}
                  >
                    Obstacle Course
                  </button>
                  <button
                    onClick={() => handleChallengeClick("shooting")}
                    className="w-full py-3 px-4 bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black transition-all code-font text-sm uppercase tracking-wider"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 207, 255, 0.2)"
                    }}
                  >
                    Target Practice
                  </button>
                </div>

                <button
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-4 right-4 text-primary hover:text-white text-2xl"
                >
                  ×
                </button>
              </motion.div>
            ) : (
              <PageCard
                title="Challenges"
                onClick={() => setExpandedCard("challenges")}
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="2" fill="currentColor" />
                    <path
                      d="M12 24L8 24M40 24L36 24M24 12L24 8M24 40L24 36"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                }
              >
                <p className="text-[#A8D8FF]">"Test your code under fire."</p>
              </PageCard>
            )}

            <PageCard
              title="Multi-Play"
              to="/game?mode=multiplayer"
              icon={
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M16 20L20 16L16 12L12 16L16 20Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M32 36L36 32L32 28L28 32L32 36Z" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M18 18L30 30"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                  <circle cx="24" cy="24" r="2" fill="currentColor" />
                </svg>
              }
            >
              <p className="text-[#A8D8FF]">"Code against real opponents."</p>
            </PageCard>
          </div>

          {/* Introduction Section */}
          <div className="pb-16">
            <h2 className="mb-6 uppercase tracking-widest text-[#A8D8FF] header-font text-sm pb-3 border-b border-[#A8D8FF]/15">
              Introduction
            </h2>

            <div className="space-y-3">
              {Object.entries(dropdownContent).map(([title, content]) => (
                <div
                  key={title}
                  className="border border-[#A8D8FF]/15 overflow-hidden bg-card/40 backdrop-blur-sm"
                >
                  <button
                    onClick={() => toggleDropdown(title)}
                    className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors uppercase tracking-wide text-[#A8D8FF] code-font text-sm"
                  >
                    <span className="text-left">{title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openDropdown === title ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === title && (
                    <motion.div
                      className="p-4 border-t border-[#A8D8FF]/15 bg-card/50 code-font text-sm"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-[#7BA3C0]">{content}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </GridContainer>
      </div>
    </div>
  );
}
