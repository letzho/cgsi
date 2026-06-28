import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { fetchAIStatus } from '../../services/api';
import './AIStatusBadge.css';

export default function AIStatusBadge({ compact = false }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchAIStatus()
      .then(setStatus)
      .catch(() => setStatus({ enabled: false }));
  }, []);

  if (!status) return null;

  if (status.enabled) {
    return (
      <span
        className={`ai-status ai-status--on ${compact ? 'ai-status--compact' : ''}`}
        title={`Generative AI: ${status.model}`}
      >
        <Sparkles size={compact ? 10 : 12} />
        {compact ? 'Gen AI ON' : `Generative AI · ${status.model}`}
      </span>
    );
  }

  return (
    <span
      className={`ai-status ai-status--off ${compact ? 'ai-status--compact' : ''}`}
      title={status.setupHint}
    >
      <AlertTriangle size={compact ? 10 : 12} />
      {compact ? 'Add API key' : 'Generative AI off — add OPENAI_API_KEY'}
    </span>
  );
}
