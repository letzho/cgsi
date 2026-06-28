import { Link } from 'react-router-dom';
import { Coins, Flame, Ticket } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { REWARDS } from '../../utils/gamification';
import './PointsHUD.css';

export default function PointsHUD() {
  const { state } = useGamification();
  const cheapest = Math.min(...REWARDS.map((r) => r.cost));
  const progress = Math.min(100, (state.points / cheapest) * 100);

  return (
    <div className="points-hud">
      <div className="points-hud__coin">
        <Coins size={16} className="points-hud__coin-icon" />
        <span className="points-hud__value">{state.points}</span>
        <span className="points-hud__label">CGS Pts</span>
      </div>

      {state.streak > 1 && (
        <div className="points-hud__streak">
          <Flame size={14} />
          <span>{state.streak}d</span>
        </div>
      )}

      <div className="points-hud__progress-wrap">
        <div className="points-hud__progress-bar">
          <div className="points-hud__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="points-hud__progress-text">
          {state.points >= cheapest ? 'Ready to redeem!' : `${cheapest - state.points} pts to talk ticket`}
        </span>
      </div>

      <Link to="/rewards" className="points-hud__ticket-btn">
        <Ticket size={14} />
        Rewards
      </Link>
    </div>
  );
}
