import './ESGComparisonSelector.css';

import { ESG_COMPARISON_PROVIDERS } from '../../utils/constants';

export function getStoredComparisonProvider() {
  try {
    const stored = localStorage.getItem('cgsi_esg_comparison_provider');
    if (stored && ESG_COMPARISON_PROVIDERS.some((p) => p.id === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'msci';
}

export function formatProviderScore(crossRef, providerId) {
  if (!crossRef) return '—';
  const entry = crossRef[providerId];
  if (!entry) return '—';

  if (providerId === 'msci') {
    return `${entry.letterRating} (${entry.score})`;
  }
  if (providerId === 'sustainalytics') {
    return `${entry.riskScore} risk · ${entry.category}`;
  }
  return `${entry.score}/100`;
}

export default function ESGComparisonSelector({ value, onChange, compact = false }) {
  return (
    <div className={`esg-comparison ${compact ? 'esg-comparison--compact' : ''}`}>
      <div className="esg-comparison__label">
        Highlight provider on matrix
      </div>
      <div className="esg-comparison__options" role="radiogroup" aria-label="ESG comparison provider">
        {ESG_COMPARISON_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            role="radio"
            aria-checked={value === provider.id}
            className={`esg-comparison__option ${value === provider.id ? 'esg-comparison__option--active' : ''}`}
            onClick={() => onChange(provider.id)}
            title={provider.description}
          >
            <span className="esg-comparison__option-name">{provider.name}</span>
            <span className="esg-comparison__option-scale">{provider.scale}</span>
            {!compact && (
              <span className="esg-comparison__option-desc">{provider.description}</span>
            )}
            {provider.lowerIsBetter && (
              <span className="esg-comparison__option-note">↓ lower is better</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
