import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCcw, Wind } from "lucide-react";

import { soundManager } from "../lib/sounds";
import { submitScore } from "../lib/firebase";

interface Plate {
  id: number;
  rotation: number; // 0 to 100
  decay: number;
  color: string;
  x: number;
}

const COLORS = ["#ffc107", "#1976d2", "#d32f2f", "#4caf50", "#9c27b0"];

export default function PlateSpinningGame({ 
  onBack, 
  difficulty = 'regular', 
  onWinXP, 
  isBigTop,
  onGameOver,
  user,
  soundEnabled
}: { 
  onBack: () => void;
  difficulty?: string;
  onWinXP?: (xp: number) => void;
  isBigTop?: boolean;
  onGameOver?: (score: number) => void;
  user?: any;
  soundEnabled?: boolean;
}) {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const frameRef = useRef<number | null>(null);

  const decayMultiplier = difficulty === 'easy' ? 0.4 : difficulty === 'hard' ? 1.6 : 0.8;

  useEffect(() => {
    start();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const start = () => {
    setPlates([{
      id: Date.now(),
      rotation: 100,
      decay: 0.15 * decayMultiplier,
      color: COLORS[0],
      x: window.innerWidth / 2
    }]);
    setScore(0);
    setIsGameOverState(false);
  };

  const addPlate = () => {
    if (soundEnabled) soundManager.playSFX('click');
    setPlates(prev => {
      const maxPlates = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 10 : 6;
      if (prev.length >= maxPlates) return prev;
      const spacing = window.innerWidth / (prev.length + 2);
      const newPlate: Plate = {
        id: Math.random(),
        rotation: 100,
        decay: (0.12 + Math.random() * 0.15) * decayMultiplier,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x: spacing * (prev.length + 1)
      };
      
      // Redistribute existing plates for even spacing
      const updated = [...prev, newPlate].map((p, i, arr) => ({
        ...p,
        x: (window.innerWidth / (arr.length + 1)) * (i + 1)
      }));
      
      return updated;
    });
  };

  useEffect(() => {
    const threshold = difficulty === 'easy' ? 300 : 150;
    if (score > 0 && score % threshold === 0) {
      addPlate();
    }
  }, [score]);

  const update = () => {
    if (isGameOverState) return;

    let isLost = false;
    setPlates(prev => {
      const next = prev.map(p => {
        const nr = p.rotation - p.decay;
        if (nr <= 0) isLost = true;
        return { ...p, rotation: Math.max(0, nr) };
      });
      return next;
    });

    if (isLost) {
      handleGameOverInternal();
    } else {
      setScore(s => s + 1);
      frameRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isGameOverState]);

  const handleGameOverInternal = () => {
    setIsGameOverState(true);
    if (soundEnabled) soundManager.playSFX('crash');
    const finalScore = Math.floor(score / 10);
    if (finalScore > highScore) setHighScore(finalScore);
    if (onWinXP) onWinXP(finalScore);

    if (user && !isBigTop) {
      submitScore(user.uid, user.displayName, finalScore, 'plates', difficulty);
    }

    if (isBigTop && onGameOver) {
      setTimeout(() => onGameOver(finalScore), 1000);
    }
  };

  const spinPlate = (id: number) => {
    if (isGameOverState) return;
    if (soundEnabled) soundManager.playSFX('click');
    setPlates(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, rotation: Math.min(100, p.rotation + (difficulty === 'easy' ? 40 : 25)) };
      }
      return p;
    }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* UI */}
       <div className="absolute top-10 left-[140px] right-[140px] flex justify-between items-center z-[100] pointer-events-none">
        <button 
          onClick={onBack} 
          className="bg-circus-gold text-circus-red p-2 rounded-full hover:bg-white transition-colors border-2 border-circus-red pointer-events-auto shadow-xl"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <div className="text-right pointer-events-none">
          <span className="theme-stat-label">PLATE PRESTIGE</span>
          <span className="theme-stat-value text-white">{Math.floor(score / 10).toString().padStart(6, '0')}</span>
        </div>
      </div>

      <div className="absolute bottom-[40px] left-[140px] z-20">
         <div className="theme-instruction-card">
            <div className="text-[11px] uppercase tracking-[2px] text-circus-gold mb-2">ACTIVE ACT: PLATE SPINNING</div>
            <p className="text-sm line-height-1.4 text-zinc-400 max-w-[200px]">Don't let them wobble off! Click plates to spin them back up.</p>
         </div>
      </div>

      {/* Plates and Sticks */}
      <div className="absolute inset-0 flex items-end justify-center pb-32">
        {plates.map(plate => (
          <div key={plate.id} className="absolute" style={{ left: plate.x }}>
            {/* Stick */}
            <div className="absolute bottom-[-400px] left-[-4px] w-2 h-[450px] bg-amber-800 rounded-full shadow-lg" />
            
            {/* Plate */}
            <motion.div
              onPointerDown={() => spinPlate(plate.id)}
              className="relative cursor-pointer"
              style={{
                width: 200,
                height: 40,
                x: -100,
                y: -430
              }}
            >
              <div 
                className="w-full h-full rounded-full border-4 border-white/40 shadow-xl"
                style={{ 
                  backgroundColor: plate.color,
                  transform: `rotateX(60deg) rotateZ(${score * (plate.rotation / 20)}deg)`,
                  filter: plate.rotation < 30 ? `grayscale(${100 - plate.rotation * 3}%)` : 'none'
                }}
              >
                <div className="absolute inset-4 rounded-full border-2 border-white/20" />
                <div className="absolute inset-8 rounded-full border-2 border-white/20" />
                
                {/* Visual Wobble when low */}
                {plate.rotation < 40 && (
                   <motion.div 
                     animate={{ x: [-2, 2, -2], y: [-1, 1, -1] }}
                     transition={{ repeat: Infinity, duration: plate.rotation / 100 }}
                   />
                )}
              </div>

              {/* Status Indicator */}
              <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-32 h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-200 ${plate.rotation < 30 ? 'bg-circus-red' : 'bg-green-500'}`}
                  style={{ width: `${plate.rotation}%` }}
                />
              </div>
            </motion.div>
          </div>
        ))}
      </div>

       {/* Game Over Modal */}
       <AnimatePresence>
        {isGameOverState && !isBigTop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md"
          >
            <div className="bg-circus-dark p-12 rounded-3xl border-8 border-circus-red text-center shadow-2xl scale-125">
              <h2 className="theme-big-title text-circus-red mb-4">CRASH!</h2>
              <p className="font-serif italic text-2xl mb-8 text-zinc-400">
                A plate hit the ground!<br/>
                Final Score: {Math.floor(score / 10)}
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={onBack}
                  className="bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                >
                  Give Up
                </button>
                <button 
                  onClick={start}
                  className="bg-circus-red text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCcw className="w-5 h-5" /> RE-SPIN!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
