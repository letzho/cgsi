import { Link } from 'react-router-dom';
import { Sparkles, Gamepad2, Zap } from 'lucide-react';
import './HeroBanner.css';

export default function HeroBanner({ hiddenWinners = 0 }) {
  return (
    <div className="hero-banner">
      <div className="hero-banner__glow" />
      <div className="hero-banner__content">
        <div className="hero-banner__badge">
          <Sparkles size={12} />
          Live Verita Finance
        </div>
        <h2 className="hero-banner__title">
          Discover ASEAN Alpha <span className="hero-banner__highlight">Before the Market</span>
        </h2>
        <p className="hero-banner__sub">
          {hiddenWinners} Hidden Winners detected today · Real-time ESG momentum signals
        </p>
        <div className="hero-banner__actions">
          <Link to="/arena" className="hero-banner__btn hero-banner__btn--primary">
            <Gamepad2 size={16} />
            Play & Earn Points
          </Link>
          <Link to="/rewards" className="hero-banner__btn hero-banner__btn--ghost">
            <Zap size={16} />
            Win Talk Tickets
          </Link>
        </div>
      </div>
      <div className="hero-banner__pulse">
        <div className="hero-banner__ring" />
        <div className="hero-banner__ring hero-banner__ring--delay" />
        <span className="hero-banner__emoji">🐮</span>
      </div>
    </div>
  );
}
