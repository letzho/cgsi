import { useState, useEffect, useMemo } from 'react';
import { useGamification } from '../../../context/GamificationContext';
import { POINT_VALUES } from '../../../utils/gamification';
import './MatrixMatchGame.css';

const QUADRANT_LABELS = {
  hidden_winners: 'Hidden Winners',
  future_leaders: 'Future Leaders',
  value_traps: 'Value Traps',
  overrated_leaders: 'Overrated Leaders',
};

export default function MatrixMatchGame({ stocks, onComplete }) {
  const { earnPoints } = useGamification();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const rounds = useMemo(
    () => stocks.sort(() => Math.random() - 0.5).slice(0, 5),
    [stocks]
  );

  const current = rounds[round];

  useEffect(() => {
    if (finished || !current) return;
    const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(t);
  }, [finished, current]);

  useEffect(() => {
    if (timeLeft <= 0 && !finished) endGame(score);
  }, [timeLeft]);

  const endGame = (finalScore) => {
    setFinished(true);
    const pts = finalScore * POINT_VALUES.matrixMatch;
    if (pts > 0) {
      earnPoints(pts, `Matrix Match: ${finalScore} correct`, { gamePlayed: true });
    }
    onComplete?.(pts);
  };

  const handlePick = (quadrantId) => {
    if (feedback || finished) return;
    const correct = quadrantId === current.quadrantId;
    setFeedback(correct ? 'correct' : 'wrong');

    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= rounds.length) {
        endGame(newScore);
      } else {
        setRound((r) => r + 1);
      }
    }, 800);
  };

  if (!current && !finished) return <p>Loading stocks...</p>;

  if (finished) {
    return (
      <div className="matrix-game matrix-game--done">
        <div className="matrix-game__emoji">🎯</div>
        <h3>Time's Up!</h3>
        <p>
          {score}/{rounds.length} correct matches
        </p>
        <p className="matrix-game__pts">+{score * POINT_VALUES.matrixMatch} CGS Points earned</p>
      </div>
    );
  }

  return (
    <div className={`matrix-game ${feedback ? `matrix-game--${feedback}` : ''}`}>
      <div className="matrix-game__header">
        <span className="matrix-game__timer">{timeLeft}s</span>
        <span className="matrix-game__round">
          Round {round + 1}/{rounds.length}
        </span>
        <span className="matrix-game__score">Score: {score}</span>
      </div>

      <div className="matrix-game__stock-card">
        <div className="matrix-game__ticker">{current.ticker}</div>
        <div className="matrix-game__company">{current.company}</div>
        <div className="matrix-game__hints">
          <span>ESG: {current.baselineEsgScore}</span>
          <span>Momentum: {current.cgsDynamicMomentumScore}</span>
        </div>
      </div>

      <p className="matrix-game__prompt">Which quadrant does this stock belong to?</p>

      <div className="matrix-game__grid">
        {Object.entries(QUADRANT_LABELS).map(([id, label]) => (
          <button key={id} className="matrix-game__quadrant-btn" onClick={() => handlePick(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
