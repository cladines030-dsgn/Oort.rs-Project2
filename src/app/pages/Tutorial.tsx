import { useState } from "react";
import { Header } from "../components/Header";
import { GridContainer } from "../components/GridContainer";
import { SpaceBackground } from "../components/SpaceBackground";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const lessons = [
  {
    id: 1,
    title: "Basic Movement",
    difficulty: "Beginner",
    description: "Learn to activate your ship's thrusters and navigate through space.",
    objectives: ["Activate engines with thrust()", "Rotate the ship with turn()", "Reach the target waypoint"],
    snippet: `function update(ship) {\n  // Fly toward the target waypoint\n  ship.moveTo(target.position.x, target.position.y);\n}`
  },
  {
    id: 2,
    title: "Radar & Detection",
    difficulty: "Beginner",
    description: "Use your radar system to detect and track enemy ships.",
    objectives: ["Scan for nearby hostiles with radar.scan()", "Track target position each tick", "Maintain visual contact during pursuit"],
    snippet: `function update(ship) {\n  // Rotate while holding position for better situational awareness\n  ship.brake(1.0);\n  ship.turn(0.6);\n}`
  },
  {
    id: 3,
    title: "Weapons & Combat",
    difficulty: "Intermediate",
    description: "Engage enemy ships using your weapons systems.",
    objectives: ["Fire weapons with ship.fire()", "Lead your shots for moving targets", "Manage reload cooldowns"],
    snippet: `function update(ship) {\n  ship.turn(1.0);\n  if (ship.reloadTicks(0) === 0) {\n    ship.fire(0);\n  }\n}`
  },
  {
    id: 4,
    title: "Fleet Coordination",
    difficulty: "Advanced",
    description: "Send and receive messages to coordinate with allied ships.",
    objectives: ["Broadcast position with comms.broadcast()", "Receive allied coordinates", "Execute a pincer maneuver"],
    snippet: `function tick() {\n  // Broadcast own position\n  comms.broadcast({ pos: ship.position });\n\n  // Read ally messages\n  const msgs = comms.receive();\n  msgs.forEach(m => {\n    if (m.data.pos) formUp(m.data.pos);\n  });\n}`
  }
];

const faqs = [
  {
    q: "Do I need coding experience?",
    a: "Basic JavaScript knowledge is helpful, but the tutorial starts from fundamentals. If you can write a function, you can command a fleet."
  },
  {
    q: "What APIs are available?",
    a: "Each ship exposes: ship (movement/weapons), radar (detection), comms (fleet messaging), and math utilities. Full documentation is in the in-game reference panel."
  },
  {
    q: "How does scoring work?",
    a: "Tutorial missions are graded on objectives completed, time taken, and ship health remaining. Faster, cleaner code earns higher scores."
  }
];

export function Tutorial() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <GridContainer>
          {/* Page heading */}
          <div className="text-center mb-12">
            <h1 className="header-font mb-3" style={{ fontSize: "2.5rem", letterSpacing: "0.15em" }}>
              <span className="text-white neon-text">TUTORIAL</span>
            </h1>
            <p className="code-font text-[#A8D8FF] text-sm tracking-wide">
              "Learn to fly. Learn to fight."
            </p>
          </div>

          {/* Lesson Cards */}
          <div className="mb-16">
            <h2 className="mb-6 uppercase tracking-widest text-[#A8D8FF] header-font text-sm pb-3 border-b border-[#A8D8FF]/15">
              Lessons
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  className="bg-card border border-primary/40 relative overflow-hidden cursor-pointer"
                  style={
                    activeLesson === lesson.id
                      ? { boxShadow: "0 0 20px rgba(0, 207, 255, 0.3), inset 0 0 20px rgba(0, 207, 255, 0.1)" }
                      : {}
                  }
                  whileHover={{
                    boxShadow: "0 0 15px rgba(0, 207, 255, 0.2), inset 0 0 10px rgba(0, 207, 255, 0.05)"
                  }}
                  onClick={() => setActiveLesson(activeLesson === lesson.id ? null : lesson.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="code-font text-xs text-primary/60 uppercase tracking-wider">
                          Lesson {lesson.id}
                        </span>
                        <h3 className="header-font text-white uppercase tracking-wider mt-1">
                          {lesson.title}
                        </h3>
                      </div>
                      <span
                        className="code-font text-xs px-2 py-1 border"
                        style={{
                          color: lesson.difficulty === "Beginner" ? "#34d399" : lesson.difficulty === "Intermediate" ? "#f59e0b" : "#fb7185",
                          borderColor: lesson.difficulty === "Beginner" ? "rgba(52,211,153,0.4)" : lesson.difficulty === "Intermediate" ? "rgba(245,158,11,0.4)" : "rgba(251,113,133,0.4)"
                        }}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>

                    <p className="code-font text-sm text-[#7BA3C0] mb-4">{lesson.description}</p>

                    {activeLesson === lesson.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Objectives */}
                        <div className="mb-4">
                          <p className="code-font text-xs text-primary uppercase tracking-wider mb-2">Objectives</p>
                          <ul className="space-y-1">
                            {lesson.objectives.map((obj, i) => (
                              <li key={i} className="code-font text-xs text-[#A8D8FF] flex items-start gap-2">
                                <span className="text-primary mt-0.5">▸</span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Code snippet */}
                        <div
                          className="bg-black/60 border border-primary/20 p-4 mb-4 overflow-x-auto"
                          style={{ borderLeft: "2px solid rgba(0, 207, 255, 0.4)" }}
                        >
                          <pre className="code-font text-xs text-[#A8D8FF] whitespace-pre">{lesson.snippet}</pre>
                        </div>
                      </motion.div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game?mode=tutorial&lesson=${lesson.id}`);
                      }}
                      className="w-full py-2 px-4 bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black transition-all code-font text-xs uppercase tracking-wider"
                      style={{ boxShadow: "0 0 10px rgba(0, 207, 255, 0.15)" }}
                    >
                      [ Start Lesson {lesson.id} ]
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick-start CTA */}
          <div
            className="mb-16 p-8 border border-primary/40 bg-card/40 backdrop-blur-sm text-center"
            style={{ boxShadow: "0 0 20px rgba(0, 207, 255, 0.1)" }}
          >
            <h3 className="header-font text-white uppercase tracking-widest mb-3">
              Ready to Begin?
            </h3>
            <p className="code-font text-sm text-[#7BA3C0] mb-6">
              Jump straight into the simulator and learn by doing.
            </p>
            <button
              onClick={() => navigate("/game?mode=tutorial&lesson=1")}
              className="py-3 px-10 bg-primary text-black uppercase tracking-widest hover:bg-white transition-all code-font border border-primary"
              style={{ boxShadow: "0 0 20px rgba(0, 207, 255, 0.4)" }}
            >
              [ Launch Tutorial ]
            </button>
          </div>

          {/* FAQ */}
          <div className="pb-16">
            <h2 className="mb-6 uppercase tracking-widest text-[#A8D8FF] header-font text-sm pb-3 border-b border-[#A8D8FF]/15">
              FAQ
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-[#A8D8FF]/15 overflow-hidden bg-card/40 backdrop-blur-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors uppercase tracking-wide text-[#A8D8FF] code-font text-sm"
                  >
                    <span className="text-left">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openFaq === i && (
                    <motion.div
                      className="p-4 border-t border-[#A8D8FF]/15 bg-card/50 code-font text-sm"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-[#7BA3C0]">{faq.a}</p>
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
