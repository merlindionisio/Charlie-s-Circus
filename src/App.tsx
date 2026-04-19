/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import CircusMenu from "./components/CircusMenu";
import JugglingGame from "./components/JugglingGame";
import PlateSpinningGame from "./components/PlateSpinningGame";
import TightropeGame from "./components/TightropeGame";
import BigTopMode from "./components/BigTopMode";
import { useCircusProgress } from "./lib/gameContext";
import { AnimatePresence, motion } from "motion/react";
import { soundManager } from "./lib/sounds";

type GameState = "MENU" | "JUGGLING" | "PLATES" | "TIGHTROPE" | "BIG_TOP";

export default function App() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const { stats, addXP, setDifficulty, user, loading, updateSettings } = useCircusProgress();

  useEffect(() => {
    if (stats.musicEnabled) {
      soundManager.playMusic();
    } else {
      soundManager.stopMusic();
    }
  }, [stats.musicEnabled]);

  const handleStartGame = (game: 'juggling' | 'plates' | 'tightrope' | 'bigtop') => {
    if (game === 'juggling') setGameState("JUGGLING");
    if (game === 'plates') setGameState("PLATES");
    if (game === 'tightrope') setGameState("TIGHTROPE");
    if (game === 'bigtop') setGameState("BIG_TOP");
  };

  const handleBackToMenu = () => {
    setGameState("MENU");
  };

  if (loading) {
    return (
      <div className="theme-viewport flex items-center justify-center">
        <div className="theme-big-title text-4xl animate-pulse italic">CURTAINS RISING...</div>
      </div>
    );
  }

  return (
    <div className="theme-viewport font-sans relative">
      <div className="theme-curtain theme-curtain-left" />
      <div className="theme-curtain theme-curtain-right" />
      <div className="theme-spotlight" />
      <div className="theme-floor" />
      
      <div className="relative z-20 w-full h-full">
        <AnimatePresence mode="wait">
          {gameState === "MENU" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <CircusMenu 
                onStartGame={handleStartGame} 
                progress={stats} 
                onSetDifficulty={setDifficulty}
                user={user}
                updateSettings={updateSettings}
              />
            </motion.div>
          )}

          {gameState === "JUGGLING" && (
            <motion.div
              key="juggling"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full h-full"
            >
              <JugglingGame 
                onBack={handleBackToMenu} 
                difficulty={stats.diff}
                onWinXP={(xp) => addXP('juggling', xp)}
                user={user}
                soundEnabled={stats.soundEnabled}
              />
            </motion.div>
          )}

          {gameState === "PLATES" && (
            <motion.div
              key="plates"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full h-full"
            >
              <PlateSpinningGame 
                onBack={handleBackToMenu} 
                difficulty={stats.diff}
                onWinXP={(xp) => addXP('plates', xp)}
                user={user}
                soundEnabled={stats.soundEnabled}
              />
            </motion.div>
          )}

          {gameState === "TIGHTROPE" && (
            <motion.div
              key="tightrope"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full h-full"
            >
              <TightropeGame 
                onBack={handleBackToMenu} 
                difficulty={stats.diff}
                onWinXP={(xp) => addXP('tightrope', xp)}
                user={user}
                soundEnabled={stats.soundEnabled}
              />
            </motion.div>
          )}

          {gameState === "BIG_TOP" && (
            <motion.div
              key="bigtop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="w-full h-full"
            >
              <BigTopMode onBack={handleBackToMenu} stats={stats} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

