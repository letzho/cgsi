import './ESGDataSourceBadge.css';

/**
 * Shows whether ESGenome baseline data is live API or simulated (official 27-metric schema).
 */
export default function ESGDataSourceBadge({ live = false, compact = false, className = '' }) {
  const label = live ? 'Live ESGenome' : 'Baseline: simulated (no ESGenome API)';
  const title = live
    ? 'Connected to ESGenome API — live disclosure data'
    : 'Using SGX 27 Core Metrics schema with structured simulation until ESGenome API access is available';

  return (
    <span
      className={`esg-source-badge esg-source-badge--${live ? 'live' : 'simulated'} ${compact ? 'esg-source-badge--compact' : ''} ${className}`.trim()}
      title={title}
    >
      <span className="esg-source-badge__dot" aria-hidden />
      {label}
    </span>
  );
}

export function getESGBaselineLive(esgBaseline) {
  return Boolean(esgBaseline?.live || esgBaseline?.esgenome?.live || esgBaseline?.sgxFirst?.live);
}
