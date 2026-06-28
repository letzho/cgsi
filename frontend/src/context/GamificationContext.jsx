import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loadGamificationState,
  saveGamificationState,
  defaultState,
  POINT_VALUES,
  ACHIEVEMENTS,
  todayKey,
} from '../utils/gamification';

const GamificationContext = createContext(null);

function applyAchievements(prev, next) {
  const unlocked = [...next.unlockedAchievements];
  ACHIEVEMENTS.forEach((a) => {
    if (!unlocked.includes(a.id) && a.check(next)) {
      unlocked.push(a.id);
    }
  });
  return { ...next, unlockedAchievements: unlocked };
}

export function GamificationProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [toast, setToast] = useState(null);
  const [pendingAchievements, setPendingAchievements] = useState([]);

  useEffect(() => {
    const loaded = loadGamificationState();
    const today = todayKey();

    if (loaded.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = loaded.lastLoginDate === yesterday.toISOString().slice(0, 10);
      const newStreak = wasYesterday ? loaded.streak + 1 : 1;
      const bonus = POINT_VALUES.dailyLogin + (newStreak >= 3 ? 15 : 0);

      let updated = applyAchievements(loaded, {
        ...loaded,
        points: loaded.points + bonus,
        totalEarned: loaded.totalEarned + bonus,
        streak: newStreak,
        lastLoginDate: today,
        history: [
          { type: 'daily', amount: bonus, label: `Day ${newStreak} login bonus`, at: Date.now() },
          ...loaded.history.slice(0, 19),
        ],
      });

      const newAchievements = updated.unlockedAchievements.filter(
        (id) => !loaded.unlockedAchievements.includes(id)
      );

      setState(updated);
      saveGamificationState(updated);
      setToast({
        title: `+${bonus} CGS Points!`,
        message: newStreak >= 3 ? `${newStreak}-day streak — keep it going!` : 'Daily login reward',
        type: 'points',
      });
      if (newAchievements.length) setPendingAchievements(newAchievements);
    } else {
      setState(loaded);
    }
  }, []);

  const earnPoints = useCallback((amount, label, meta = {}) => {
    setState((prev) => {
      let next = {
        ...prev,
        points: prev.points + amount,
        totalEarned: prev.totalEarned + amount,
        gamesPlayed: meta.gamePlayed ? prev.gamesPlayed + 1 : prev.gamesPlayed,
        perfectQuizzes: meta.perfectQuiz ? prev.perfectQuizzes + 1 : prev.perfectQuizzes,
        history: [{ type: 'earn', amount, label, at: Date.now() }, ...prev.history.slice(0, 19)],
      };
      const before = prev.unlockedAchievements.length;
      next = applyAchievements(prev, next);
      saveGamificationState(next);

      if (next.unlockedAchievements.length > before) {
        const newly = next.unlockedAchievements.filter((id) => !prev.unlockedAchievements.includes(id));
        setPendingAchievements((p) => [...p, ...newly]);
      }
      return next;
    });
    setToast({ title: `+${amount} CGS Points!`, message: label, type: 'points' });
  }, []);

  const redeemReward = useCallback((reward) => {
    let result = { success: false, code: null };

    setState((prev) => {
      if (prev.points < reward.cost) return prev;

      const code = `CGS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      result = { success: true, code };

      let next = {
        ...prev,
        points: prev.points - reward.cost,
        ticketsRedeemed: prev.ticketsRedeemed + 1,
        redeemedRewards: [
          ...prev.redeemedRewards,
          { ...reward, redeemedAt: Date.now(), code },
        ],
        history: [
          { type: 'redeem', amount: -reward.cost, label: reward.name, at: Date.now() },
          ...prev.history.slice(0, 19),
        ],
      };
      const before = prev.unlockedAchievements.length;
      next = applyAchievements(prev, next);
      saveGamificationState(next);

      if (next.unlockedAchievements.length > before) {
        const newly = next.unlockedAchievements.filter((id) => !prev.unlockedAchievements.includes(id));
        setPendingAchievements((p) => [...p, ...newly]);
      }
      return next;
    });

    if (result.success) {
      setToast({
        title: 'Ticket Claimed!',
        message: `${reward.name} — check your wallet below`,
        type: 'ticket',
      });
    }
    return result;
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const popAchievement = useCallback(() => {
    setPendingAchievements((p) => p.slice(1));
  }, []);

  return (
    <GamificationContext.Provider
      value={{ state, earnPoints, redeemReward, toast, dismissToast, pendingAchievements, popAchievement }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
