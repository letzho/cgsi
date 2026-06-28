import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import AchievementToast from '../AchievementToast/AchievementToast';
import { useGamification } from '../../context/GamificationContext';
import { fetchIndices } from '../../services/api';
import { NAV_ITEMS } from '../../utils/constants';
import { ACHIEVEMENTS as ACH_LIST } from '../../utils/gamification';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [indices, setIndices] = useState([]);
  const location = useLocation();
  const { toast, dismissToast, pendingAchievements, popAchievement } = useGamification();

  const pageTitle =
    NAV_ITEMS.find((item) =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    )?.label || 'Dashboard';

  useEffect(() => {
    const load = () => {
      fetchIndices()
        .then((data) => setIndices(data.indices))
        .catch(() => setIndices([]));
    };
    load();
    const interval = setInterval(load, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const achievementToast =
    pendingAchievements.length > 0
      ? ACH_LIST.find((a) => a.id === pendingAchievements[0])?.name
      : null;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-layout__main">
        <TopBar
          title={pageTitle}
          indices={indices}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>

      <AchievementToast
        toast={toast}
        achievement={achievementToast}
        onDismiss={() => {
          if (pendingAchievements.length > 0) popAchievement();
          dismissToast();
        }}
      />
    </div>
  );
}
