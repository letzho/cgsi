import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Brain, Target, Crosshair, Trophy } from 'lucide-react';
import { useStocks } from '../../hooks/useStocks';
import { useGamification } from '../../context/GamificationContext';
import { MOCK_LEADERBOARD, ACHIEVEMENTS } from '../../utils/gamification';
import ESGQuizGame from '../../components/games/ESGQuizGame/ESGQuizGame';
import MatrixMatchGame from '../../components/games/MatrixMatchGame/MatrixMatchGame';
import AlphaHuntGame from '../../components/games/AlphaHuntGame/AlphaHuntGame';
import './GameArena.css';

const GAMES = [
  {
    id: 'quiz',
    name: 'ESG Speed Quiz',
    desc: '5 rapid-fire ESG questions. Perfect score = bonus!',
    icon: Brain,
    reward: '20 pts/correct',
    color: '#7C5CFF',
  },
  {
    id: 'matrix',
    name: 'Matrix Matcher',
    desc: '45-second blitz — classify stocks into quadrants',
    icon: Target,
    reward: '30 pts/match',
    color: '#FF6900',
  },
  {
    id: 'alpha',
    name: 'Alpha Hunter',
    desc: 'Spot the Hidden Winner among decoys. Streak bonus!',
    icon: Crosshair,
    reward: '50 pts/find',
    color: '#00C076',
  },
];

export default function GameArena() {
  const { stocks, loading } = useStocks();
  const { state } = useGamification();
  const [activeGame, setActiveGame] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  const userRank = MOCK_LEADERBOARD.filter((e) => e.points > state.points).length + 1;
  const leaderboard = [
    ...MOCK_LEADERBOARD,
    { rank: userRank, name: 'You', points: state.points, avatar: '🐮', isUser: true },
  ].sort((a, b) => b.points - a.points);

  const resetGame = (id) => {
    setActiveGame(id);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="game-arena">
      <div className="game-arena__hero">
        <div className="game-arena__hero-content">
          <Gamepad2 size={28} />
          <div>
            <h1>CGS Game Arena</h1>
            <p>Play mini-games, earn CGS Points, unlock investing talk tickets</p>
          </div>
        </div>
        <Link to="/rewards" className="game-arena__cta">
          <Trophy size={16} />
          Redeem Rewards
        </Link>
      </div>

      <div className="game-arena__layout">
        <div className="game-arena__main">
          {!activeGame ? (
            <div className="game-arena__grid">
              {GAMES.map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    className="game-card"
                    style={{ '--accent': g.color }}
                    onClick={() => resetGame(g.id)}
                  >
                    <div className="game-card__icon">
                      <Icon size={28} />
                    </div>
                    <h3>{g.name}</h3>
                    <p>{g.desc}</p>
                    <span className="game-card__reward">{g.reward}</span>
                    <span className="game-card__play">Play Now →</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="game-arena__active">
              <button className="game-arena__back" onClick={() => setActiveGame(null)}>
                ← Back to Arena
              </button>
              <div className="game-arena__game-panel" key={gameKey}>
                {activeGame === 'quiz' && <ESGQuizGame />}
                {activeGame === 'matrix' && !loading && <MatrixMatchGame stocks={stocks} />}
                {activeGame === 'alpha' && !loading && <AlphaHuntGame stocks={stocks} />}
              </div>
            </div>
          )}
        </div>

        <aside className="game-arena__sidebar">
          <div className="leaderboard">
            <h3>🏅 Leaderboard</h3>
            {leaderboard.slice(0, 6).map((entry, i) => (
              <div
                key={entry.name}
                className={`leaderboard__row ${entry.isUser ? 'leaderboard__row--user' : ''}`}
              >
                <span className="leaderboard__rank">#{i + 1}</span>
                <span className="leaderboard__avatar">{entry.avatar}</span>
                <span className="leaderboard__name">{entry.name}</span>
                <span className="leaderboard__pts">{entry.points}</span>
              </div>
            ))}
          </div>

          <div className="achievements-panel">
            <h3>🎖️ Achievements</h3>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = state.unlockedAchievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`achievement-badge ${unlocked ? 'achievement-badge--unlocked' : ''}`}
                >
                  <span>{unlocked ? '✅' : '🔒'}</span>
                  <div>
                    <div className="achievement-badge__name">{a.name}</div>
                    <div className="achievement-badge__desc">{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
