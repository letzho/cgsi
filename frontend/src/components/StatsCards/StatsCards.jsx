import './StatsCards.css';

export default function StatsCards({ stocks }) {
  const hiddenWinners = stocks.filter((s) => s.quadrantId === 'hidden_winners').length;
  const buySignals = stocks.filter((s) => s.actionSignal === 'Buy').length;
  const avgMomentum =
    stocks.length > 0
      ? (
          stocks.reduce((sum, s) => sum + s.cgsDynamicMomentumScore, 0) / stocks.length
        ).toFixed(1)
      : 0;

  const cards = [
    { label: 'ASEAN Universe', value: stocks.length, sub: 'Equities monitored' },
    { label: 'Hidden Winners', value: hiddenWinners, sub: 'Alpha generation targets' },
    { label: 'Buy Signals', value: buySignals, sub: 'High-conviction longs' },
    { label: 'Avg Momentum', value: avgMomentum, sub: 'CGS Dynamic Score' },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card) => (
        <div key={card.label} className="stats-cards__card">
          <div className="stats-cards__label">{card.label}</div>
          <div className="stats-cards__value">{card.value}</div>
          <div className="stats-cards__sub">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
