import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Trophy, Settings, Star, Zap, Gauge, LogIn, LogOut, X, Volume2, VolumeX, Music as MusicIcon, Music2 } from "lucide-react";
import { Difficulty, GameStats } from "../lib/gameContext";
import { signInWithGoogle, logout, getTopScores } from "../lib/firebase";
import { soundManager } from "../lib/sounds";

interface MenuProps {
  onStartGame: (game: 'juggling' | 'plates' | 'tightrope' | 'bigtop') => void;
  progress: GameStats;
  onSetDifficulty: (diff: Difficulty) => void;
  user: any;
  updateSettings: (settings: any) => void;
}

export default function CircusMenu({ onStartGame, progress, onSetDifficulty, user, updateSettings }: MenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadCategory, setLeadCategory] = useState<string>('bigtop');

  const toggleMusic = () => {
    updateSettings({ musicEnabled: !progress.musicEnabled });
  };

  const toggleSFX = () => {
    updateSettings({ soundEnabled: !progress.soundEnabled });
  };

  const fetchLeads = async (cat: string) => {
    setLeadCategory(cat);
    const data = await getTopScores(cat);
    setLeads(data);
    setShowLeads(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="flex gap-4">
          <button 
            onClick={toggleMusic}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white border border-white/20"
          >
            {progress.musicEnabled ? <Music2 className="w-6 h-6" /> : <MusicIcon className="w-6 h-6 opacity-40" />}
          </button>
          <button 
            onClick={toggleSFX}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white border border-white/20"
          >
            {progress.soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6 opacity-40" />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-white/10 p-2 pl-4 rounded-full border border-white/20 backdrop-blur-md">
              <span className="text-sm font-black text-white">{user.displayName}</span>
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-circus-gold" />
              <button 
                onClick={() => { logout(); soundManager.playSFX('click'); }}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { signInWithGoogle(); soundManager.playSFX('click'); }}
              className="flex items-center gap-2 bg-circus-gold text-circus-red px-6 py-3 rounded-full font-black text-sm hover:scale-105 transition-all shadow-xl"
            >
              <LogIn className="w-5 h-5" /> JOIN CIRCUS
            </button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="text-center z-10"
      >
        <h1 className="theme-big-title">
          CHARLIE'S
          <br />
          CIRCUS
        </h1>
        
        {/* Difficulty Selector */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="text-[10px] font-black uppercase text-circus-gold tracking-[0.3em]">SHOW DIFFICULTY</div>
          <div className="flex gap-2 justify-center bg-black/40 p-1.5 rounded-full border border-white/10">
            {(['easy', 'regular', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { onSetDifficulty(d); soundManager.playSFX('click'); }}
                className={`px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all 
                  ${progress.diff === d 
                    ? 'bg-circus-gold text-circus-red scale-105 shadow-lg' 
                    : 'bg-transparent text-white/40 hover:text-white'}`}
              >
                {d === 'easy' ? '👶 kids' : d}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        <GameCard
          title="Juggling Joy"
          level={progress.juggling.level}
          description="Keep the balls in the air!"
          icon={<Zap className="w-8 h-8" />}
          color="bg-circus-red"
          onClick={() => { onStartGame('juggling'); soundManager.playSFX('click'); }}
        />
        <GameCard
          title="Plate Spinner"
          level={progress.plates.level}
          description="Don't let them fall!"
          icon={<Star className="w-8 h-8" />}
          color="bg-zinc-800"
          onClick={() => { onStartGame('plates'); soundManager.playSFX('click'); }}
        />
        <GameCard
          title="Tightrope Walker"
          level={progress.tightrope.level}
          description="Master of balance!"
          icon={<Gauge className="w-8 h-8" />}
          color="bg-circus-gold"
          textColor="text-circus-red"
          onClick={() => { onStartGame('tightrope'); soundManager.playSFX('click'); }}
        />
        <GameCard
          title="Big Top Show"
          description="The Grand Finale!"
          icon={<Play className="w-8 h-8" />}
          color="bg-white"
          textColor="text-circus-red"
          isSpecial
          onClick={() => { onStartGame('bigtop'); soundManager.playSFX('click'); }}
        />
      </div>

      <div className="absolute bottom-12 flex flex-nowrap justify-center gap-6 md:gap-8 text-white/50 z-10 font-black text-[10px] md:text-xs tracking-widest bg-black/40 px-6 md:px-8 py-4 rounded-full border border-white/10 backdrop-blur-md">
        <button onClick={() => fetchLeads('bigtop')} className="flex items-center gap-2 hover:text-white transition-all group whitespace-nowrap">
          <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform text-circus-gold" /> leaderboard
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 hover:text-white transition-all group whitespace-nowrap">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" /> settings
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <Modal title="SETTINGS" onClose={() => setShowSettings(false)}>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-white">
                <span className="font-serif italic text-xl">Sound Effects</span>
                <button 
                  onClick={toggleSFX}
                  className={`w-16 h-8 rounded-full transition-all relative ${progress.soundEnabled ? 'bg-circus-gold' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${progress.soundEnabled ? 'left-9' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="font-serif italic text-xl">Music</span>
                <button 
                  onClick={toggleMusic}
                  className={`w-16 h-8 rounded-full transition-all relative ${progress.musicEnabled ? 'bg-circus-gold' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${progress.musicEnabled ? 'left-9' : 'left-1'}`} />
                </button>
              </div>
              <div className="pt-6 border-t border-white/10">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-circus-red text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showLeads && (
          <Modal title="LEADERBOARD" onClose={() => setShowLeads(false)}>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['bigtop', 'juggling', 'plates', 'tightrope'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => fetchLeads(cat)}
                    className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap
                      ${leadCategory === cat ? 'bg-circus-gold text-circus-red' : 'bg-white/10 text-white/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                {leads.length > 0 ? leads.map((l, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-4">
                         <span className="text-circus-gold font-black text-xl italic">{i + 1}</span>
                         <div className="flex flex-col">
                            <span className="text-white font-medium">{l.displayName}</span>
                            <span className="text-[9px] text-white/30 uppercase">{l.difficulty}</span>
                         </div>
                      </div>
                      <span className="text-circus-gold font-black">{l.score}</span>
                   </div>
                )) : (
                  <div className="text-center py-12 text-white/50 font-serif italic">No scores yet! Be the first!</div>
                )}
             </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Decorative Stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-circus-gold/20"
          initial={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            scale: 0
          }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        >
          ★
        </motion.div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.9 }}
        className="bg-circus-dark w-full max-w-md rounded-3xl border-8 border-circus-gold p-8 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-all"
        >
          <X className="w-8 h-8" />
        </button>
        <h2 className="theme-big-title text-3xl md:text-5xl mb-8 break-all">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function GameCard({ title, description, icon, color, textColor = "text-white", level, isSpecial, onClick }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${color} ${textColor} p-6 rounded-2xl shadow-xl border-4 border-circus-gold text-left w-64 group relative overflow-hidden h-48`}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-4 bg-black/10 p-2 rounded-lg w-fit group-hover:bg-black/20 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-2xl mb-1 leading-none">{title}</h3>
          {level && (
             <div className="text-[10px] font-black uppercase tracking-tighter bg-black/20 px-2 py-0.5 rounded w-fit mb-2">
               Level {level}
             </div>
          )}
          <p className="text-xs opacity-70 line-clamp-2">{description}</p>
        </div>
      </div>
      
      {isSpecial && (
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
           <Star className="w-32 h-32 fill-current" />
        </div>
      )}
    </motion.button>
  );
}
