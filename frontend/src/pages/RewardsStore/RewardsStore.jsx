import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Gamepad2, CheckCircle } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { REWARDS } from '../../utils/gamification';
import './RewardsStore.css';

export default function RewardsStore() {
  const { state, redeemReward } = useGamification();
  const [claimedCode, setClaimedCode] = useState(null);

  const handleRedeem = (reward) => {
    const { success, code } = redeemReward(reward);
    if (success) setClaimedCode(code);
  };

  return (
    <div className="rewards-store">
      <div className="rewards-store__hero">
        <div>
          <h1>🎫 Rewards Store</h1>
          <p>Redeem CGS Points for exclusive investing talk admission tickets</p>
        </div>
        <div className="rewards-store__balance">
          <span className="rewards-store__balance-label">Your Balance</span>
          <span className="rewards-store__balance-value">{state.points} pts</span>
        </div>
      </div>

      {state.points < 500 && (
        <div className="rewards-store__cta-banner">
          <Gamepad2 size={20} />
          <span>
            Need more points?{' '}
            <Link to="/arena">Play games in the Arena</Link> to earn CGS Points faster!
          </span>
        </div>
      )}

      <div className="rewards-store__grid">
        {REWARDS.map((reward) => {
          const canAfford = state.points >= reward.cost;
          const owned = state.redeemedRewards.filter((r) => r.id === reward.id).length;

          return (
            <div
              key={reward.id}
              className={`reward-card reward-card--${reward.tier} ${canAfford ? 'reward-card--affordable' : ''}`}
            >
              <div className="reward-card__icon">{reward.icon}</div>
              <h3>{reward.name}</h3>
              <p>{reward.description}</p>
              <div className="reward-card__cost">
                <Ticket size={14} />
                {reward.cost} CGS Points
              </div>
              {owned > 0 && (
                <div className="reward-card__owned">
                  <CheckCircle size={14} />
                  {owned} claimed
                </div>
              )}
              <button
                className="reward-card__btn"
                disabled={!canAfford}
                onClick={() => handleRedeem(reward)}
              >
                {canAfford ? 'Claim Ticket' : `Need ${reward.cost - state.points} more pts`}
              </button>
            </div>
          );
        })}
      </div>

      {state.redeemedRewards.length > 0 && (
        <div className="rewards-store__wallet">
          <h3>🎟️ My Ticket Wallet</h3>
          {state.redeemedRewards.map((r, i) => (
            <div key={i} className="ticket-item">
              <div className="ticket-item__left">
                <span className="ticket-item__icon">{r.icon}</span>
                <div>
                  <div className="ticket-item__name">{r.name}</div>
                  <div className="ticket-item__date">
                    {new Date(r.redeemedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="ticket-item__code">{r.code}</div>
            </div>
          ))}
        </div>
      )}

      {claimedCode && (
        <div className="rewards-store__modal" onClick={() => setClaimedCode(null)}>
          <div className="rewards-store__modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rewards-store__modal-confetti">🎉</div>
            <h2>Ticket Claimed!</h2>
            <p>Show this code at the CGS Investing Talk entrance:</p>
            <div className="rewards-store__modal-code">{claimedCode}</div>
            <button onClick={() => setClaimedCode(null)}>Awesome!</button>
          </div>
        </div>
      )}
    </div>
  );
}
