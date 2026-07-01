import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, Plus, FolderOpen, X, Grid3x3 } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import './FavoritesPanel.css';

export default function FavoritesPanel({
  stocks,
  activeListId,
  onSelectList,
  onClearListFilter,
}) {
  const navigate = useNavigate();
  const { lists, createList, deleteList, removeTickerFromList } = useFavorites();
  const [newListName, setNewListName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    const list = createList(newListName);
    if (list) {
      setNewListName('');
      setShowCreate(false);
      onSelectList?.(list.id);
    }
  };

  const stockMap = Object.fromEntries(stocks.map((s) => [s.ticker, s]));

  return (
    <div className="favorites-panel">
      <div className="favorites-panel__header">
        <div>
          <h3>
            <Star size={18} fill="#FF6900" color="#FF6900" />
            My Favourites
          </h3>
          <p>Create named lists and track equities from the screener</p>
        </div>
        <button
          type="button"
          className="favorites-panel__create-btn"
          onClick={() => setShowCreate((v) => !v)}
        >
          <Plus size={16} />
          New list
        </button>
      </div>

      {showCreate && (
        <form className="favorites-panel__create-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="List name e.g. ASEAN ESG Picks"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            maxLength={40}
            required
          />
          <button type="submit">Create</button>
          <button type="button" className="favorites-panel__cancel" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
        </form>
      )}

      {lists.length === 0 ? (
        <div className="favorites-panel__empty">
          <FolderOpen size={28} color="#cbd5e1" />
          <p>No favourite lists yet. Create one, then star stocks in the screener.</p>
        </div>
      ) : (
        <div className="favorites-panel__lists">
          {lists.map((list) => {
            const isActive = activeListId === list.id;
            return (
              <div
                key={list.id}
                className={`favorites-panel__list-card ${isActive ? 'favorites-panel__list-card--active' : ''}`}
              >
                <div className="favorites-panel__list-top">
                  <button
                    type="button"
                    className="favorites-panel__list-name"
                    onClick={() => (isActive ? onClearListFilter?.() : onSelectList?.(list.id))}
                  >
                    {list.name}
                    <span className="favorites-panel__count">{list.tickers.length}</span>
                  </button>
                  <button
                    type="button"
                    className="favorites-panel__delete"
                    onClick={() => deleteList(list.id)}
                    title="Delete list"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {list.tickers.length > 0 ? (
                  <ul className="favorites-panel__tickers">
                    {list.tickers.map((ticker) => {
                      const stock = stockMap[ticker];
                      return (
                        <li key={ticker}>
                          <span>
                            <strong>{ticker}</strong>
                            {stock && (
                              <span className="favorites-panel__company">
                                {stock.company} · Mom {stock.cgsDynamicMomentumScore}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTickerFromList(list.id, ticker)}
                            aria-label="Remove"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="favorites-panel__hint">Star stocks in the table below to add them here.</p>
                )}
                {list.tickers.length > 0 && (
                  <button
                    type="button"
                    className="favorites-panel__matrix-btn"
                    onClick={() => navigate(`/matrix?list=${encodeURIComponent(list.id)}`)}
                  >
                    <Grid3x3 size={14} />
                    Compare on Momentum Matrix
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
