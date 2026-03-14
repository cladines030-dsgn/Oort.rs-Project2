import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function HeroPanel() {
  const [codeText, setCodeText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);

  const codeLines = [
    'function tick() {',
    '  ship.turnTowards(target);',
    '  ship.fire();',
    '}'
  ];

  useEffect(() => {
    const fullCode = codeLines.join('\n');
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < fullCode.length) {
        setCodeText(fullCode.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // Wait 2 seconds, then fade and restart
        setTimeout(() => {
          setCodeText('');
          setAnimationCycle(prev => prev + 1);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [animationCycle]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="w-full mb-12" style={{ height: '40vh' }}>
      <div className="h-full border border-primary neon-border overflow-hidden">
        <div className="h-full flex">
          {/* Left Half - Command Input */}
          <div className="w-1/2 bg-[#0A1020] p-6 flex flex-col border-r border-primary">
            <div className="text-xs uppercase tracking-wider text-primary mb-4 code-font">
              COMMAND INPUT
            </div>
            <div className="flex-1 relative">
              <pre className="code-font text-sm text-foreground">
                <code>
                  <span className="text-[#A8D8FF]">function</span> <span className="text-[#00CFFF]">tick</span>() {'{\n'}
                  <span className="text-[#A8D8FF]">  ship</span>.<span className="text-[#00CFFF]">turnTowards</span>(target);<span className="opacity-0">{codeText.includes('target') ? '' : 'x'}</span>{'\n'}
                  <span className="text-[#A8D8FF]">  ship</span>.<span className="text-[#00CFFF]">fire</span>();<span className="opacity-0">{codeText.includes('fire') ? '' : 'x'}</span>{'\n'}
                {'}'}
                </code>
                {showCursor && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />}
              </pre>
            </div>
          </div>

          {/* Right Half - Simulation View */}
          <div className="w-1/2 bg-black p-6 flex flex-col relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider text-primary mb-4 code-font">
              SIMULATION VIEW
            </div>
            
            {/* Grid background */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(0, 207, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 207, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />

            {/* Starfield */}
            {[...Array(30)].map((_, i) => (
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

            {/* Cruiser */}
            <motion.div
              className="absolute"
              style={{ top: '30%', left: '20%' }}
              animate={{
                x: [0, 50, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-primary">
                <polygon points="20,5 30,20 20,15 10,20" fill="currentColor" opacity="0.8" />
                <circle cx="20" cy="17" r="3" fill="#00CFFF" opacity="0.6" />
              </svg>
            </motion.div>

            {/* Missiles with trails */}
            <motion.div
              className="absolute"
              style={{ top: '40%', left: '25%' }}
              animate={{
                x: [0, 200],
                y: [0, -50],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear'
              }}
            >
              <div className="relative">
                <div className="w-2 h-2 bg-primary rounded-full" style={{
                  boxShadow: '0 0 10px #00CFFF'
                }} />
                {/* Trail */}
                <motion.div 
                  className="absolute top-0 right-2 h-0.5 bg-gradient-to-r from-primary to-transparent"
                  style={{ width: '30px' }}
                />
              </div>
            </motion.div>

            {/* Impact flash */}
            <motion.div
              className="absolute"
              style={{ top: '35%', right: '20%' }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2.5,
              }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-primary" style={{
                boxShadow: '0 0 20px #00CFFF'
              }} />
            </motion.div>

            {/* Radar sweep */}
            <motion.div
              className="absolute bottom-8 right-8 w-16 h-16 rounded-full border border-primary"
              style={{
                boxShadow: '0 0 10px rgba(0, 207, 255, 0.3)'
              }}
            >
              <motion.div
                className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-primary origin-left"
                style={{ transformOrigin: '0% 50%' }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Tagline */}
      <div className="text-center mt-4">
        <p className="code-font text-sm text-[#A8D8FF]">
          "Your code. Their destruction. 60 frames per second."
        </p>
      </div>
    </div>
  );
}
