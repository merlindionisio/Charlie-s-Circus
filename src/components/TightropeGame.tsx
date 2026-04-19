import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCcw, MoveLeft, MoveRight } from "lucide-react";
import { soundManager } from "../lib/sounds";
import { submitScore } from "../lib/firebase";

export default function TightropeGame({ 
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
  const [balance, setBalance] = useState(0); // -100 to 100
  const [score, setScore] = useState(0);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [wind, setWind] = useState(0);
  const frameRef = useRef<number | null>(null);

  // MUCH EASIER BALANCE FOR KIDS BUT ENSURE LOSS IS POSSIBLE
  const diffMultiplier = difficulty === 'easy' ? 0.35 : difficulty === 'hard' ? 1.5 : 0.8;

  useEffect(() => {
    start();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const start = () => {
    setBalance(0);
    setScore(0);
    setIsGameOverState(false);
    setWind((Math.random() - 0.5) * 6 * diffMultiplier);
  };

  const update = () => {
    if (isGameOverState) return;

    setBalance(prev => {
      // Base drift even in easy mode
      const drift = (wind > 0 ? 0.15 : -0.15) * diffMultiplier;
      const nextBalance = prev + wind * 0.2 + drift;
      const gravity = prev * 0.08 * diffMultiplier;
      const finalBalance = nextBalance + gravity;

      if (Math.abs(finalBalance) > 100) {
        // Use a small timeout to avoid state-update-during-render
        setTimeout(() => handleGameOverInternal(), 0);
        return finalBalance > 0 ? 100 : -100;
      }
      return finalBalance;
    });

    if (!isGameOverState) {
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
    if (onWinXP) onWinXP(finalScore);

    if (user && !isBigTop) {
      submitScore(user.uid, user.displayName, finalScore, 'tightrope', difficulty);
    }

    if (isBigTop && onGameOver) {
      setTimeout(() => onGameOver(finalScore), 1000);
    }
  };

  const compensate = (dir: 'left' | 'right') => {
    if (isGameOverState) return;
    if (soundEnabled) soundManager.playSFX('click');
    setBalance(prev => {
      const force = dir === 'left' ? -8 : 8;
      return prev + force;
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') compensate('left');
      if (e.key === 'ArrowRight') compensate('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none flex flex-col items-center">
       {/* Background */}
       <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
         <div className="w-full h-1 bg-black border-t-2 border-dashed border-black" />
       </div>

       {/* UI */}
       <div className="absolute top-10 left-[140px] right-[140px] flex justify-between items-center z-[100] pointer-events-none">
        <button 
          onClick={onBack} 
          className="bg-circus-gold text-circus-red p-2 rounded-full hover:bg-white transition-colors border-2 border-circus-red pointer-events-auto shadow-xl"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <div className="text-right pointer-events-none">
          <span className="theme-stat-label">BALANCE SCORE</span>
          <span className="theme-stat-value text-white">{Math.floor(score / 10).toString().padStart(6, '0')}</span>
        </div>
      </div>

      <div className="absolute bottom-[40px] left-[140px] z-20">
         <div className="theme-instruction-card">
            <div className="text-[11px] uppercase tracking-[2px] text-circus-gold mb-2">ACTIVE ACT: TIGHTROPE</div>
            <p className="text-sm line-height-1.4 text-zinc-400 max-w-[200px]">Hold [Left/Right] arrows or tap buttons to balance against the wind.</p>
         </div>
      </div>

      {/* Wind Indicator */}
      <div className="absolute top-24 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
         <span className="text-xs font-bold uppercase">Wind</span>
         <div className="w-20 h-2 bg-black/20 rounded-full relative">
            <div 
              className="absolute top-0 h-full bg-circus-blue transition-all"
              style={{ 
                left: wind > 0 ? '50%' : `${50 + wind * 5}%`,
                width: `${Math.abs(wind) * 5}%`
              }}
            />
         </div>
      </div>

      {/* The Clown / Tightrope Walker */}
      <div className="mt-[20vh] flex flex-col items-center">
         <motion.div 
            animate={{ 
              rotate: balance / 2,
              y: [0, 5, 0]
            }}
            transition={{ y: { repeat: Infinity, duration: 2 } }}
            className="relative"
         >
            {/* Simple Clown Shape */}
            <div className="w-16 h-24 bg-circus-red rounded-t-full border-4 border-circus-gold relative shadow-xl">
               <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-pink-200 rounded-full border-2 border-circus-red">
                  <div className="absolute top-2 left-2 w-1 h-1 bg-black rounded-full" />
                  <div className="absolute top-2 right-2 w-1 h-1 bg-black rounded-full" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full" />
               </div>
               
               {/* Balancing Pole */}
               <div className="absolute bottom-4 left-[-150px] w-[316px] h-3 bg-amber-900 border-2 border-circus-gold rounded-full" />
            </div>
         </motion.div>
      </div>

      {/* Balance Bar UI */}
      <div className="absolute bottom-32 w-80 h-12 bg-white/20 rounded-full border-4 border-circus-gold/30 p-1 flex items-center px-4">
         <div className="w-full h-4 bg-black/10 rounded-full relative">
            <motion.div 
               animate={{ left: `${50 + (balance / 2)}%` }}
               className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-circus-gold rounded-full shadow-lg border-2 border-white"
            />
            {/* Danger Zones */}
            <div className="absolute left-0 top-0 h-full w-4 bg-red-500/30 rounded-l-full" />
            <div className="absolute right-0 top-0 h-full w-4 bg-red-500/30 rounded-r-full" />
         </div>
      </div>

      {/* Touch Controls */}
      <div className="absolute bottom-8 flex gap-8">
        <button 
          onPointerDown={() => compensate('left')}
          className="w-24 h-24 bg-circus-blue rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl border-4 border-white"
        >
          <MoveLeft className="w-10 h-10" />
        </button>
        <button 
          onPointerDown={() => compensate('right')}
          className="w-24 h-24 bg-circus-blue rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl border-4 border-white"
        >
          <MoveRight className="w-10 h-10" />
        </button>
      </div>

       <AnimatePresence>
        {isGameOverState && !isBigTop && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-circus-dark p-12 rounded-3xl border-8 border-circus-gold text-center shadow-2xl">
              <h2 className="theme-big-title text-white mb-4">WHOOPS!</h2>
              <p className="font-serif italic text-2xl text-zinc-400 mb-8">
                You lost your balance!<br/>
                Score: {Math.floor(score / 10)}
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={onBack}
                  className="bg-white text-circus-blue px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Give Up
                </button>
                <button 
                  onClick={start}
                  className="bg-circus-gold text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2"
                >
                  <RefreshCcw className="w-5 h-5" /> RE-BALANCE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
