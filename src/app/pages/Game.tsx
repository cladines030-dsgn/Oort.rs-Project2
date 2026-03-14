import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { SpaceBackground } from "../components/SpaceBackground";
import { Play, RotateCcw } from "lucide-react";
import { useSearchParams } from "react-router";
import { motion } from "motion/react";

export function Game() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'tutorial';
  const challenge = searchParams.get('challenge') || 'defense';
  
  const [code, setCode] = useState(`// Control your spaceship
// This function runs 60 times per second

function tick() {
  // Activate engines
  ship.setThrust(1.0);
  
  // Fire weapons at target
  if (radar.hasTarget()) {
    ship.fire();
  }
  
  // Rotate towards enemy
  const target = radar.getClosest();
  if (target) {
    ship.turnTowards(target.position);
  }
}`);

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(mode === 'tutorial' ? 300 : 180); // 5:00 for tutorial, 3:00 for challenges
  const [hits, setHits] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isRunning && time > 0) {
      const interval = setInterval(() => {
        setTime(prev => prev - 1);
        // Simulate score increase
        if (Math.random() > 0.7) {
          setHits(prev => prev + 1);
          setScore(prev => prev + 10);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, time]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (mode === 'tutorial' && time < 60) return '#FF4B4B';
    if (mode === 'challenges' && time < 45) return '#FF4B4B';
    return '#00CFFF';
  };

  const getModeName = () => {
    if (mode === 'challenges') {
      return challenge.charAt(0).toUpperCase() + challenge.slice(1);
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

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
                {mode === 'multiplayer' && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#A8D8FF]" style={{
                      boxShadow: '0 0 5px #A8D8FF'
                    }} />
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
                  caretColor: '#00CFFF',
                  lineHeight: '1.6'
                }}
                spellCheck={false}
              />
            </div>

            <div className="p-4 border-t border-primary/30 bg-card/60 backdrop-blur-sm">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-full py-3 px-6 bg-primary text-black uppercase tracking-wider hover:bg-white transition-all code-font border border-primary"
                style={{
                  boxShadow: '0 0 15px rgba(0, 207, 255, 0.4)'
                }}
              >
                [ {isRunning ? "STOP" : "RUN"} SIMULATION ]
              </button>
            </div>
          </div>

          {/* Right Half - Game View */}
          <div className="w-1/2 flex flex-col">
            <div className="border-b border-primary/30 px-6 py-3 bg-card/60 backdrop-blur-sm">
              <h3 className="text-primary uppercase tracking-wider code-font text-sm neon-text">
                SIMULATION VIEW
              </h3>
              {mode === 'challenges' && (
                <div className="mt-1 text-[#A8D8FF] text-xs code-font">
                  ▸ {getModeName()}
                </div>
              )}
            </div>
            
            <div className="flex-1 relative bg-black overflow-hidden">
              {/* Mode badge for challenges */}
              {mode === 'challenges' && (
                <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-primary px-3 py-1.5 code-font text-xs uppercase tracking-wider text-primary z-20"
                  style={{
                    boxShadow: '0 0 10px rgba(0, 207, 255, 0.2)'
                  }}
                >
                  {getModeName()}
                </div>
              )}

              {/* Multiplayer split view */}
              {mode === 'multiplayer' ? (
                <div className="h-full flex flex-col">
                  {/* Your Fleet */}
                  <div className="flex-1 border-b border-primary/30 relative">
                    <div className="absolute top-4 left-4 text-[#A8D8FF] code-font text-xs uppercase tracking-wider z-20">
                      YOUR FLEET
                    </div>
                    {/* Starfield */}
                    <div className="absolute inset-0">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full bg-[#A8D8FF]"
                          style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            opacity: Math.random() * 0.5 + 0.3,
                          }}
                        />
                      ))}
                    </div>
                    {/* Grid */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(rgba(0, 207, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 207, 255, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px'
                    }} />
                    {/* Ship */}
                    {isRunning && (
                      <motion.div
                        className="absolute w-8 h-8"
                        style={{ left: '40%', top: '40%' }}
                        animate={{
                          x: [0, 30, 0],
                          y: [0, -15, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <svg width="32" height="32" viewBox="0 0 32 32">
                          <polygon points="16,4 24,16 16,12 8,16" fill="#00CFFF" opacity="0.8" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Opponent Fleet */}
                  <div className="flex-1 relative">
                    <div className="absolute top-4 left-4 text-[#FF4B4B] code-font text-xs uppercase tracking-wider z-20">
                      OPPONENT FLEET
                    </div>
                    {/* Starfield */}
                    <div className="absolute inset-0">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={`opp-${i}`}
                          className="absolute rounded-full bg-[#A8D8FF]"
                          style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            opacity: Math.random() * 0.5 + 0.3,
                          }}
                        />
                      ))}
                    </div>
                    {/* Grid */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(rgba(255, 75, 75, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 75, 75, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px'
                    }} />
                    {/* Ship */}
                    {isRunning && (
                      <motion.div
                        className="absolute w-8 h-8"
                        style={{ left: '60%', top: '60%' }}
                        animate={{
                          x: [0, -30, 0],
                          y: [0, 15, 0],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <svg width="32" height="32" viewBox="0 0 32 32">
                          <polygon points="16,28 24,16 16,20 8,16" fill="#FF4B4B" opacity="0.8" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Single view for tutorial and challenges */}
                  {/* Starfield */}
                  <div className="absolute inset-0">
                    {[...Array(100)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-[#A8D8FF]"
                        style={{
                          width: Math.random() * 2 + 1 + 'px',
                          height: Math.random() * 2 + 1 + 'px',
                          left: Math.random() * 100 + '%',
                          top: Math.random() * 100 + '%',
                          opacity: Math.random() * 0.5 + 0.3,
                        }}
                      />
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0, 207, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 207, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }} />

                  {/* Ships */}
                  {isRunning && (
                    <>
                      <motion.div
                        className="absolute"
                        style={{ left: '30%', top: '40%' }}
                        animate={{
                          x: [0, 50, 0],
                          y: [0, -20, 0],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <svg width="40" height="40" viewBox="0 0 40 40">
                          <polygon points="20,5 30,20 20,15 10,20" fill="#00CFFF" opacity="0.8" />
                        </svg>
                      </motion.div>

                      <motion.div
                        className="absolute"
                        style={{ left: '60%', top: '60%' }}
                        animate={{
                          x: [0, -30, 0],
                          y: [0, 15, 0],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <svg width="32" height="32" viewBox="0 0 32 32">
                          <polygon points="16,28 24,16 16,20 8,16" fill="#FF4B4B" opacity="0.8" />
                        </svg>
                      </motion.div>
                    </>
                  )}
                </>
              )}

              {/* Scoreboard - Top Right */}
              <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-primary p-3 min-w-[160px] z-20"
                style={{
                  boxShadow: '0 0 10px rgba(0, 207, 255, 0.2)'
                }}
              >
                {mode === 'multiplayer' ? (
                  <div className="code-font text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#A8D8FF]">YOU</span>
                      <span className="text-white">{score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#FF4B4B]">OPPONENT</span>
                      <span className="text-white">{Math.floor(score * 0.8)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="code-font text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#A8D8FF]">TIME</span>
                      <span style={{ color: getTimeColor() }}>{formatTime(time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A8D8FF]">HITS</span>
                      <span className="text-white">{hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A8D8FF]">SCORE</span>
                      <span className="text-white">{score}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connection status for multiplayer */}
              {mode === 'multiplayer' && (
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-primary px-3 py-2 z-20 flex items-center gap-2"
                  style={{
                    boxShadow: '0 0 10px rgba(0, 207, 255, 0.2)'
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="code-font text-xs text-primary uppercase tracking-wider">
                    {isRunning ? "CONNECTED" : "WAITING FOR OPPONENT..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
