import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, Star, Heart, Music, ArrowLeft } from 'lucide-react';
import JugglingGame from './JugglingGame';
import PlateSpinningGame from './PlateSpinningGame';
import TightropeGame from './TightropeGame';
import { GameStats } from '../lib/gameContext';
import { submitScore } from '../lib/firebase';
import { soundManager } from '../lib/sounds';

interface BigTopProps {
  onBack: () => void;
  stats: GameStats;
  user: any;
}

type ShowState = 'INTRO' | 'ACT_1' | 'ACT_2' | 'ACT_3' | 'FINALE';

export default function BigTopMode({ onBack, stats, user }: BigTopProps) {
  const [showState, setShowState] = useState<ShowState>('INTRO');
  const [scores, setScores] = useState({ act1: 0, act2: 0, act3: 0 });

  const handleActComplete = (score: number) => {
    if (stats.soundEnabled) soundManager.playSFX('yay');
    if (showState === 'ACT_1') {
      setScores(prev => ({ ...prev, act1: score }));
      setShowState('ACT_2');
    } else if (showState === 'ACT_2') {
      setScores(prev => ({ ...prev, act2: score }));
      setShowState('ACT_3');
    } else if (showState === 'ACT_3') {
      setScores(prev => ({ ...prev, act3: score }));
      setShowState('FINALE');
    }
  };

  const calculateFinalScore = () => {
    const base = scores.act1 + scores.act2 + scores.act3;
    const variety = new Set([scores.act1 > 0, scores.act2 > 0, scores.act3 > 0]).size;
    return base * variety;
  };

  useEffect(() => {
    if (showState === 'FINALE') {
      if (stats.soundEnabled) soundManager.playSFX('yay');
      if (user) {
        submitScore(user.uid, user.displayName, calculateFinalScore(), 'bigtop', stats.diff);
      }
    }
  }, [showState]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-circus-dark">
      <AnimatePresence mode="wait">
        {showState === 'INTRO' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center p-8 bg-circus-red relative"
          >
            <div className="absolute top-8 left-[140px] z-[100]">
              <button 
                onClick={() => { onBack(); soundManager.playSFX('click'); }}
                className="bg-white/20 p-4 rounded-full hover:bg-circus-gold hover:text-circus-red transition-all border-2 border-white/40 text-white shadow-2xl flex items-center gap-2 px-8 font-black uppercase tracking-widest text-sm pointer-events-auto cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6" /> Back to Menu
              </button>
            </div>
            <motion.h2 
              animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="theme-big-title text-9xl mb-8"
            >
              SHOWTIME!
            </motion.h2>
            <p className="font-serif italic text-3xl mb-12 text-circus-gold">
              Complete all three acts to earn the Grand Prize!
            </p>
            <button 
              onClick={() => { setShowState('ACT_1'); soundManager.playSFX('click'); }}
              className="bg-circus-gold text-circus-red px-12 py-6 rounded-full font-black text-2xl hover:scale-110 transition-transform shadow-2xl flex items-center gap-4"
            >
              START THE SHOW <ArrowRight />
            </button>
          </motion.div>
        )}

        {showState === 'ACT_1' && (
          <motion.div key="act1" className="w-full h-full">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-circus-gold text-circus-red px-4 py-1 rounded-full font-bold">ACT 1: JUGGLING</div>
            <JugglingGame 
              onBack={() => {}} // Disabled back during show
              difficulty={stats.diff}
              onWinXP={() => {}} 
              isBigTop
              onGameOver={(s) => handleActComplete(s)}
            />
          </motion.div>
        )}

        {showState === 'ACT_2' && (
          <motion.div key="act2" className="w-full h-full">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-circus-gold text-circus-red px-4 py-1 rounded-full font-bold">ACT 2: PLATES</div>
            <PlateSpinningGame 
              onBack={() => {}} 
              difficulty={stats.diff}
              onWinXP={() => {}} 
              isBigTop
              onGameOver={(s) => handleActComplete(s)}
            />
          </motion.div>
        )}

        {showState === 'ACT_3' && (
          <motion.div key="act3" className="w-full h-full">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-circus-gold text-circus-red px-4 py-1 rounded-full font-bold">ACT 3: TIGHTROPE</div>
            <TightropeGame 
              onBack={() => {}} 
              difficulty={stats.diff}
              onWinXP={() => {}} 
              isBigTop
              onGameOver={(s) => handleActComplete(s)}
            />
          </motion.div>
        )}

        {showState === 'FINALE' && (
          <motion.div 
            key="finale"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center h-full p-12 text-center"
          >
            <div className="bg-circus-gold p-1 border-8 border-circus-red rotate-2 mb-12 shadow-2xl">
              <div className="bg-white p-8">
                 <h2 className="theme-big-title text-circus-red text-6xl mb-4">THE REVIEWS ARE IN!</h2>
                 <div className="flex justify-center gap-2 mb-8">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-12 h-12 ${i < calculateFinalScore() / 100 ? 'fill-circus-gold text-circus-red' : 'text-zinc-200'}`} />
                   ))}
                 </div>
                 
                 <div className="grid grid-cols-3 gap-8 mb-12">
                   <div className="text-center">
                     <div className="text-[10px] font-black uppercase text-zinc-400">Juggling</div>
                     <div className="text-4xl text-circus-red">{scores.act1}</div>
                   </div>
                   <div className="text-center">
                     <div className="text-[10px] font-black uppercase text-zinc-400">Plates</div>
                     <div className="text-4xl text-circus-red">{scores.act2}</div>
                   </div>
                   <div className="text-center">
                     <div className="text-[10px] font-black uppercase text-zinc-400">Tightrope</div>
                     <div className="text-4xl text-circus-red">{scores.act3}</div>
                   </div>
                 </div>

                 <div className="border-t-4 border-dashed border-zinc-100 pt-8 relative overflow-hidden">
                    <span className="theme-stat-label">GRAND PERFORMANCE SCORE</span>
                    <span className="theme-stat-value text-circus-red">{calculateFinalScore()}</span>
                    
                    {/* Audience Micro-animations */}
                    <div className="absolute inset-0 pointer-events-none">
                       {[...Array(10)].map((_, i) => (
                         <motion.div
                           key={i}
                           initial={{ y: 50, opacity: 0 }}
                           animate={{ y: -100, opacity: [0, 1, 0] }}
                           transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                           className="absolute text-circus-gold"
                           style={{ left: `${Math.random() * 100}%` }}
                         >
                            👏
                         </motion.div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            <button 
              onClick={onBack}
              className="bg-circus-red text-white px-12 py-4 rounded-full font-black text-xl hover:bg-circus-dark transition-colors"
            >
              RETURN TO BACKSTAGE
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
