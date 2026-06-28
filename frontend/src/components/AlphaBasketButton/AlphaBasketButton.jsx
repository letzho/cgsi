import { useState } from 'react';
import { Briefcase, Download, Filter } from 'lucide-react';
import { fetchAlphaBasket } from '../../services/api';
import { useGamification } from '../../context/GamificationContext';
import { POINT_VALUES } from '../../utils/gamification';
import './AlphaBasketButton.css';

function exportToCSV(stocks) {
  const headers = [
    'Ticker',
    'Company',
    'Sector',
    'Country',
    'Baseline ESG',
    'CGS Momentum Score',
    'Momentum Rating',
    'Quadrant',
    'Action Signal',
  ];

  const rows = stocks.map((s) =>
    [
      s.ticker,
      s.company,
      s.sector,
      s.country,
      s.baselineEsgScore,
      s.cgsDynamicMomentumScore,
      s.momentumRating,
      s.quadrant,
      s.actionSignal,
    ].join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cgs-alpha-basket-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AlphaBasketButton({ onFilter, hiddenWinnersCount }) {
  const [loading, setLoading] = useState(false);
  const { earnPoints } = useGamification();

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await fetchAlphaBasket();
      exportToCSV(data.stocks);
      earnPoints(POINT_VALUES.exportBasket, 'Exported Alpha Basket');
    } catch {
      alert('Failed to export alpha basket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alpha-basket">
      <div className="alpha-basket__info">
        <div className="alpha-basket__title">
          <Briefcase size={18} />
          Monday Morning Alpha Basket
          <span className="alpha-basket__count">{hiddenWinnersCount} stocks</span>
        </div>
        <div className="alpha-basket__desc">
          High-conviction buy-list isolating Hidden Winners — low baseline ESG with accelerating momentum
        </div>
      </div>
      <div className="alpha-basket__actions">
        <button
          className="alpha-basket__btn alpha-basket__btn--primary"
          onClick={() => onFilter?.()}
        >
          <Filter size={16} />
          Filter Hidden Winners
        </button>
        <button
          className="alpha-basket__btn alpha-basket__btn--secondary"
          onClick={handleExport}
          disabled={loading || hiddenWinnersCount === 0}
        >
          <Download size={16} />
          {loading ? 'Exporting...' : 'Export Buy-List'}
        </button>
      </div>
    </div>
  );
}
