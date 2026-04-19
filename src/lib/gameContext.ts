import { useState, useEffect } from 'react';
import { auth, db, saveUserProgress } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type Difficulty = 'easy' | 'regular' | 'hard';

export interface SkillProgress {
  level: number;
  xp: number;
  unlockedTricks: string[];
}

export interface GameStats {
  diff: Difficulty;
  juggling: SkillProgress;
  plates: SkillProgress;
  tightrope: SkillProgress;
  totalPerformanceScore: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const INITIAL_SKILL = { level: 1, xp: 0, unlockedTricks: [] };

export const useCircusProgress = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('circus_stats');
    if (saved) return JSON.parse(saved);
    return {
      diff: 'easy', // Default to easy for kids
      juggling: { ...INITIAL_SKILL },
      plates: { ...INITIAL_SKILL },
      tightrope: { ...INITIAL_SKILL },
      totalPerformanceScore: 0,
      soundEnabled: true,
      musicEnabled: true
    };
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setStats(prev => ({ ...prev, ...userDoc.data().stats }));
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('circus_stats', JSON.stringify(stats));
    if (user) {
      saveUserProgress(user, stats);
    }
  }, [stats, user]);

  const addXP = (skill: keyof Omit<GameStats, 'diff' | 'totalPerformanceScore' | 'soundEnabled' | 'musicEnabled'>, amount: number) => {
    setStats(prev => {
      // @ts-ignore
      const current = prev[skill];
      const newXP = current.xp + amount;
      const xpToNext = current.level * 100;
      
      let newLevel = current.level;
      if (newXP >= xpToNext) {
        newLevel += 1;
      }

      return {
        ...prev,
        [skill]: {
          ...current,
          xp: newLevel > current.level ? newXP - xpToNext : newXP,
          level: newLevel
        }
      };
    });
  };

  const setDifficulty = (diff: Difficulty) => {
    setStats(prev => ({ ...prev, diff }));
  };

  const updateSettings = (settings: Partial<Pick<GameStats, 'soundEnabled' | 'musicEnabled'>>) => {
    setStats(prev => ({ ...prev, ...settings }));
  };

  return { stats, addXP, setDifficulty, user, loading, updateSettings };
};
