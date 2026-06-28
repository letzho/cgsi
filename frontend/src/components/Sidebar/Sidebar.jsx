import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Grid3x3, Search, MessageSquare, FileText, Gamepad2, Gift } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';
import { useGamification } from '../../context/GamificationContext';
import './Sidebar.css';

const ICON_MAP = { LayoutDashboard, Grid3x3, Search, MessageSquare, FileText, Gamepad2, Gift };

export default function Sidebar({ isOpen, onClose }) {
  const { state } = useGamification();

  return (
    <>
      <div
        className={`sidebar__overlay ${isOpen ? 'sidebar__overlay--visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <img src="/assets/cgs-logo.png" alt="CGS International" />
          <div className="sidebar__brand">
            <div className="sidebar__brand-title">ESG Momentum Engine 2.0</div>
            <div className="sidebar__brand-sub">Powered by CGS × Moomoo</div>
          </div>
        </div>

        <div className="sidebar__points-card">
          <div className="sidebar__points-label">CGS Points</div>
          <div className="sidebar__points-value">{state.points}</div>
          {state.streak > 1 && (
            <div className="sidebar__streak">🔥 {state.streak}-day streak</div>
          )}
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <span className="sidebar__badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__status">
            <span className="sidebar__status-dot" />
            Tri-Agent Pipeline Live
          </div>
        </div>
      </aside>
    </>
  );
}
