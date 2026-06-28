import { useState, useMemo } from 'react';
import { useGamification } from '../../../context/GamificationContext';
import { POINT_VALUES } from '../../../utils/gamification';
import './AlphaHuntGame.css';

export default function AlphaHuntGame({ stocks, onComplete }) {
  const { earnPoints } = useGamification();
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState(null);
  const [finished, setFinished] = useState(false);
  const [totalPts, setTotalPts] = useState(0);

  const hiddenWinners = useMemo(
    () => stocks.filter((s) => s.quadrantId === 'hidden_winners'),
    [stocks]
  );

  const rounds = useMemo(() => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      const target = hiddenWinners[Math.floor(Math.random() * hiddenWinners.length)] || stocks[0];
      const decoys = stocks
        .filter((s) => s.ticker !== target.ticker)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [target, ...decoys].sort(() => Math.random() - 0.5);
      result.push({ target, options });
    }
    return result;
  }, [stocks, hiddenWinners]);

  const current = rounds[round];

  const handlePick = (stock) => {
    if (picked || finished || !current) return;
    setPicked(stock.ticker);
    const correct = stock.ticker === current.target.ticker;

    let pts = 0;
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      pts = POINT_VALUES.alphaHunt + (newStreak > 1 ? POINT_VALUES.alphaHuntStreak : 0);
    } else {
      setStreak(0);
    }

    setTotalPts((t) => t + pts);

    setTimeout(() => {
      if (round + 1 >= rounds.length) {
        const finalPts = totalPts + pts;
        if (finalPts > 0) {
          earnPoints(finalPts, `Alpha Hunter: found hidden winners!`, { gamePlayed: true });
        }
        setFinished(true);
        onComplete?.(finalPts);
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 1200);
  };

  if (!current && !finished) return <p>Loading...</p>;

  if (finished) {
    return (
      <div className="alpha-hunt alpha-hunt--done">
        <div className="alpha-hunt__trophy">🏆</div>
        <h3>Alpha Hunter Complete!</h3>
        <p>Total earned: +{totalPts} CGS Points</p>
      </div>
    );
  }

  return (
    <div className="alpha-hunt">
      <div className="alpha-hunt__header">
        <span>Round {round + 1}/3</span>
        {streak > 0 && <span className="alpha-hunt__streak">🔥 {streak} streak</span>}
      </div>

      <div className="alpha-hunt__mission">
        <span className="alpha-hunt__badge">MISSION</span>
        <h3>Spot the Hidden Winner!</h3>
        <p>Find the stock with low baseline ESG but surging momentum</p>
      </div>

      <div className="alpha-hunt__options">
        {current.options.map((stock) => {
          let cls = 'alpha-hunt__card';
          if (picked) {
            if (stock.ticker === current.target.ticker) cls += ' alpha-hunt__card--winner';
            else if (stock.ticker === picked) cls += ' alpha-hunt__card--wrong';
          }
          return (
            <button key={stock.ticker} className={cls} onClick={() => handlePick(stock)}>
              <div className="alpha-hunt__card-ticker">{stock.ticker}</div>
              <div className="alpha-hunt__card-name">{stock.company}</div>
              <div className="alpha-hunt__card-stats">
                <span>ESG {stock.baselineEsgScore}</span>
                <span>Mo {stock.cgsDynamicMomentumScore}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="alpha-hunt__hint">+{POINT_VALUES.alphaHunt} pts per correct pick</div>
    </div>
  );
}
