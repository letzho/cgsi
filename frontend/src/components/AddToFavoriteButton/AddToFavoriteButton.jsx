import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Plus } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import './AddToFavoriteButton.css';

export default function AddToFavoriteButton({ ticker }) {
  const { lists, createList, addTickerToList, isTickerFavorited, showToast } = useFavorites();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const favorited = isTickerFavorited(ticker);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 220;
    let left = rect.right - menuW;
    if (left < 8) left = 8;
    let top = rect.bottom + 6;
    if (top + 200 > window.innerHeight) {
      top = rect.top - 200;
    }
    setMenuPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      const inBtn = btnRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAdd = (listId) => {
    addTickerToList(listId, ticker);
    setOpen(false);
  };

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    const list = createList(newName);
    if (list) {
      addTickerToList(list.id, ticker, { silent: true });
      showToast('List created', `${ticker} added to "${list.name}"`);
      setNewName('');
      setOpen(false);
    }
  };

  const menu = open ? (
    <div
      ref={menuRef}
      className="add-fav__menu add-fav__menu--portal"
      style={{ top: menuPos.top, left: menuPos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="add-fav__menu-title">Add to list</div>
      {lists.length === 0 ? (
        <p className="add-fav__empty">Create your first list:</p>
      ) : (
        lists.map((list) => (
          <button
            key={list.id}
            type="button"
            className="add-fav__option"
            onClick={() => handleAdd(list.id)}
            disabled={list.tickers.includes(ticker)}
          >
            {list.name}
            {list.tickers.includes(ticker) && ' ✓'}
          </button>
        ))
      )}
      <form className="add-fav__new" onSubmit={handleCreateAndAdd}>
        <input
          type="text"
          placeholder="New list name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
        />
        <button type="submit" disabled={!newName.trim()}>
          <Plus size={14} />
        </button>
      </form>
    </div>
  ) : null;

  return (
    <div className="add-fav">
      <button
        ref={btnRef}
        type="button"
        className={`add-fav__btn ${favorited ? 'add-fav__btn--on' : ''}`}
        title={favorited ? 'In favourites' : 'Add to favourites'}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Star size={14} fill={favorited ? '#FF6900' : 'none'} color={favorited ? '#FF6900' : '#94a3b8'} />
      </button>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </div>
  );
}
