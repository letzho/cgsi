export const STORAGE_KEY = 'cgs_gamification_v1';

export const POINT_VALUES = {
  dailyLogin: 25,
  quizCorrect: 20,
  quizPerfectBonus: 50,
  matrixMatch: 30,
  alphaHunt: 50,
  alphaHuntStreak: 25,
  firstHiddenWinner: 15,
  exportBasket: 10,
};

export const REWARDS = [
  {
    id: 'talk_standard',
    name: 'ASEAN ESG Investing Talk',
    description: 'General admission to CGS x Moomoo live investing seminar',
    cost: 500,
    icon: '🎫',
    tier: 'standard',
  },
  {
    id: 'talk_masterclass',
    name: 'ESG Masterclass Pass',
    description: '90-min deep dive with portfolio managers + Q&A',
    cost: 750,
    icon: '🎓',
    tier: 'premium',
  },
  {
    id: 'talk_vip',
    name: 'VIP Front Row + Networking',
    description: 'Front-row seat, cocktail networking, speaker meet & greet',
    cost: 1000,
    icon: '⭐',
    tier: 'vip',
  },
];

export const ACHIEVEMENTS = [
  { id: 'first_game', name: 'Game On!', desc: 'Play your first mini-game', check: (s) => s.gamesPlayed >= 1 },
  { id: 'point_100', name: 'Century Club', desc: 'Earn 100 CGS Points', check: (s) => s.totalEarned >= 100 },
  { id: 'point_500', name: 'Alpha Grinder', desc: 'Earn 500 CGS Points', check: (s) => s.totalEarned >= 500 },
  { id: 'ticket', name: 'Talk Ready', desc: 'Redeem an investing talk ticket', check: (s) => s.ticketsRedeemed >= 1 },
  { id: 'streak_3', name: 'On Fire', desc: '3-day login streak', check: (s) => s.streak >= 3 },
  { id: 'quiz_perfect', name: 'ESG Scholar', desc: 'Perfect ESG quiz score', check: (s) => s.perfectQuizzes >= 1 },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alex T.', points: 1240, avatar: '🦊' },
  { rank: 2, name: 'Priya M.', points: 980, avatar: '🐯' },
  { rank: 3, name: 'Wei L.', points: 875, avatar: '🐼' },
  { rank: 4, name: 'Sarah K.', points: 720, avatar: '🦁' },
  { rank: 5, name: 'James H.', points: 650, avatar: '🐮' },
];

export function defaultState() {
  return {
    points: 50,
    totalEarned: 50,
    streak: 1,
    lastLoginDate: null,
    gamesPlayed: 0,
    perfectQuizzes: 0,
    ticketsRedeemed: 0,
    redeemedRewards: [],
    history: [{ type: 'welcome', amount: 50, label: 'Welcome bonus!', at: Date.now() }],
    unlockedAchievements: [],
  };
}

export function loadGamificationState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function saveGamificationState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
