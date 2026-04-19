import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { soundManager } from "../lib/sounds";
import { submitScore } from "../lib/firebase";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const COLORS = ["#ffc107", "#1976d2", "#d32f2f", "#4caf50", "#9c27b0"];

export default function JugglingGame({ 
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
  const [balls, setBalls] = useState<Ball[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // EASIER CONSTANTS
  const diffMultiplier = difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 1.2 : 0.6;
  const GRAVITY = 0.4 * diffMultiplier;
  const BOUNCE_STRENGTH = -10;
  const BALL_SIZE = difficulty === 'easy' ? 80 : 60; // Bigger balls in easy

  useEffect(() => {
    startGame();
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  const startGame = () => {
    const initialBalls = [
      {
        id: Date.now(),
        x: window.innerWidth / 2,
        y: 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 0,
        color: COLORS[0]
      }
    ];
    setBalls(initialBalls);
    setScore(0);
    setIsGameOverState(false);
  };

  const spawnBall = () => {
    const maxBalls = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 8 : 5;
    if (balls.length >= maxBalls) return;

    const newBall: Ball = {
      id: Math.random(),
      x: Math.random() * (window.innerWidth - 100) + 50,
      y: 100,
      vx: (Math.random() - 0.5) * 5,
      vy: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    setBalls(prev => [...prev, newBall]);
  };

  useEffect(() => {
    // Spawn more balls as score increases
    const spawnThreshold = difficulty === 'easy' ? 20 : 10;
    if (score > 0 && score % spawnThreshold === 0 && balls.length < Math.floor(score / spawnThreshold) + 1) {
      spawnBall();
    }
  }, [score]);

  const update = () => {
    if (isGameOverState) return;

    let isLost = false;
    setBalls(prevBalls => {
      const nextBalls = prevBalls.map(ball => {
        let { x, y, vx, vy } = ball;
        vy += GRAVITY;
        x += vx;
        y += vy;

        if (x < BALL_SIZE / 2 || x > window.innerWidth - BALL_SIZE / 2) {
          vx *= -0.8;
          x = x < BALL_SIZE / 2 ? BALL_SIZE / 2 : window.innerWidth - BALL_SIZE / 2;
        }
        return { ...ball, x, y, vx, vy };
      });

      if (nextBalls.some(b => b.y > window.innerHeight)) {
        isLost = true;
        return prevBalls;
      }
      return nextBalls;
    });

    if (isLost) {
      handleGameOverInternal();
    } else {
      gameLoopRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isGameOverState]);

  const handleGameOverInternal = () => {
    setIsGameOverState(true);
    if (soundEnabled) soundManager.playSFX('crash');
    if (score > highScore) setHighScore(score);
    if (onWinXP) onWinXP(score * 2);

    if (user && !isBigTop) {
      submitScore(user.uid, user.displayName, score, 'juggling', difficulty);
    }

    if (isBigTop && onGameOver) {
      setTimeout(() => onGameOver(score), 1000);
    }
  };

  const handleBallClick = (id: number) => {
    if (isGameOverState) return;
    if (soundEnabled) soundManager.playSFX('bounce');
    
    setBalls(prev => prev.map(ball => {
      if (ball.id === id) {
        setScore(s => s + 1);
        return {
          ...ball,
          vy: BOUNCE_STRENGTH - (Math.random() * 2),
          vx: ball.vx + (Math.random() - 0.5) * 8
        };
      }
      return ball;
    }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden cursor-crosshair">
      {/* Header UI */}
      <div className="absolute top-10 left-[140px] right-[140px] flex justify-between items-center z-[100] pointer-events-none">
        <button 
          onClick={onBack}
          className="bg-circus-gold text-circus-red p-2 rounded-full hover:bg-white transition-colors border-2 border-circus-red pointer-events-auto shadow-xl"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <div className="text-right pointer-events-none">
          <span className="theme-stat-label">PRESTIGE SCORE</span>
          <span className="theme-stat-value text-white">{score.toString().padStart(6, '0')}</span>
        </div>
      </div>

      <div className="absolute bottom-[40px] left-[140px] z-20">
         <div className="theme-instruction-card">
            <div className="text-[11px] uppercase tracking-[2px] text-circus-gold mb-2">ACTIVE ACT: JUGGLING</div>
            <p className="text-sm line-height-1.4 text-zinc-400 max-w-[200px]">Keep the balls in the air! Tap them to bounce.</p>
         </div>
      </div>

      {/* Game Area */}
      {balls.map(ball => (
        <motion.div
          key={ball.id}
          onPointerDown={() => handleBallClick(ball.id)}
          className="absolute rounded-full shadow-lg border-2 border-white/20 select-none touch-none"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            backgroundColor: ball.color,
            left: ball.x - BALL_SIZE / 2,
            top: ball.y - BALL_SIZE / 2,
          }}
          initial={false}
          animate={{
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.1 }}
        >
          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/40" />
        </motion.div>
      ))}

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOverState && !isBigTop && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-circus-dark p-12 rounded-3xl border-8 border-circus-gold text-center shadow-2xl">
              <h2 className="theme-big-title text-6xl mb-4">GAME OVER!</h2>
              <div className="font-serif italic text-3xl text-zinc-400 mb-8">
                Your score: {score}
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 bg-white text-circus-red px-6 py-3 rounded-xl font-bold hover:bg-circus-gold hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" /> Main Menu
                </button>
                <button 
                  onClick={startGame}
                  className="flex items-center gap-2 bg-circus-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-circus-gold transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" /> Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isGameOverState && score === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-4xl font-display text-white opacity-50"
          >
            TAP BALLS TO JUGGLE!
          </motion.div>
        </div>
      )}
    </div>
  );
}
