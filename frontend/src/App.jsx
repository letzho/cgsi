import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GamificationProvider } from './context/GamificationContext';
import AppLayout from './components/AppLayout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import MatrixAnalytics from './pages/MatrixAnalytics/MatrixAnalytics';
import PortfolioScreener from './pages/PortfolioScreener/PortfolioScreener';
import GameArena from './pages/GameArena/GameArena';
import RewardsStore from './pages/RewardsStore/RewardsStore';
import InvestorForum from './pages/InvestorForum/InvestorForum';
import ESGReportAnalyzer from './pages/ESGReportAnalyzer/ESGReportAnalyzer';

export default function App() {
  return (
    <GamificationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matrix" element={<MatrixAnalytics />} />
            <Route path="/screener" element={<PortfolioScreener />} />
            <Route path="/forum" element={<InvestorForum />} />
            <Route path="/reports" element={<ESGReportAnalyzer />} />
            <Route path="/arena" element={<GameArena />} />
            <Route path="/rewards" element={<RewardsStore />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GamificationProvider>
  );
}
