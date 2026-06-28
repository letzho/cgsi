import { Menu } from 'lucide-react';
import PointsHUD from '../PointsHUD/PointsHUD';
import './TopBar.css';

export default function TopBar({ title, indices, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <span className="topbar__title">{title}</span>
      </div>

      <div className="topbar__indices">
        {indices.map((idx) => (
          <div key={idx.name} className="topbar__index">
            <span className="topbar__index-name">{idx.name}</span>
            <span className="topbar__index-value">
              {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`topbar__index-change ${
                idx.change >= 0 ? 'topbar__index-change--up' : 'topbar__index-change--down'
              }`}
            >
              {idx.change >= 0 ? '+' : ''}
              {(idx.changePct * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <PointsHUD />
    </header>
  );
}
