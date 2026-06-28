import { useEffect, useState } from 'react';
import './AchievementToast.css';

const CONFETTI_COLORS = ['#FF6900', '#00C076', '#FF4747', '#FFD700', '#7C5CFF'];

function Confetti() {
  return (
    <div className="confetti-burst" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            '--delay': `${i * 0.04}s`,
            '--x': `${(i % 8) * 12 - 40}px`,
            '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            '--rot': `${i * 47}deg`,
          }}
        />
      ))}
    </div>
  );
}

export default function AchievementToast({ toast, achievement, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const data = achievement
    ? { title: 'Achievement Unlocked!', message: achievement, type: 'achievement' }
    : toast;

  useEffect(() => {
    if (!data) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <div className={`achievement-toast ${visible ? 'achievement-toast--visible' : ''}`}>
      {(data.type === 'achievement' || data.type === 'ticket') && <Confetti />}
      <div className={`achievement-toast__card achievement-toast__card--${data.type}`}>
        <div className="achievement-toast__icon">
          {data.type === 'ticket' ? '🎫' : data.type === 'achievement' ? '🏆' : '⚡'}
        </div>
        <div>
          <div className="achievement-toast__title">{data.title}</div>
          <div className="achievement-toast__message">{data.message}</div>
        </div>
      </div>
    </div>
  );
}
