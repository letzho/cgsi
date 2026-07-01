import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  loadFavorites,
  saveFavorites,
  createFavoriteList,
  getAllFavoriteTickers,
} from '../utils/favorites';
import FavoriteToast from '../components/FavoriteToast/FavoriteToast';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [lists, setLists] = useState(() => loadFavorites().lists);
  const [toast, setToast] = useState(null);

  const persist = useCallback((nextLists) => {
    setLists(nextLists);
    saveFavorites({ lists: nextLists });
  }, []);

  const showToast = useCallback((title, message) => {
    setToast({ title, message, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const createList = useCallback(
    (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return null;
      const list = createFavoriteList(trimmed);
      persist([list, ...lists]);
      return list;
    },
    [lists, persist]
  );

  const deleteList = useCallback(
    (listId) => {
      persist(lists.filter((l) => l.id !== listId));
    },
    [lists, persist]
  );

  const addTickerToList = useCallback(
    (listId, ticker, { silent = false } = {}) => {
      if (!ticker) return;
      const list = lists.find((l) => l.id === listId);
      if (!list || list.tickers.includes(ticker)) return;

      persist(
        lists.map((l) =>
          l.id === listId ? { ...l, tickers: [...l.tickers, ticker] } : l
        )
      );

      if (!silent) {
        showToast('Added to favourites', `${ticker} → ${list.name}`);
      }
    },
    [lists, persist, showToast]
  );

  const removeTickerFromList = useCallback(
    (listId, ticker) => {
      persist(
        lists.map((l) =>
          l.id === listId ? { ...l, tickers: l.tickers.filter((t) => t !== ticker) } : l
        )
      );
    },
    [lists, persist]
  );

  const isTickerFavorited = useCallback(
    (ticker) => lists.some((l) => l.tickers.includes(ticker)),
    [lists]
  );

  const getListById = useCallback((listId) => lists.find((l) => l.id === listId), [lists]);

  const favoriteTickerSet = useMemo(() => getAllFavoriteTickers(lists), [lists]);

  const value = useMemo(
    () => ({
      lists,
      favoriteTickerSet,
      createList,
      deleteList,
      addTickerToList,
      removeTickerFromList,
      isTickerFavorited,
      getListById,
      showToast,
    }),
    [
      lists,
      favoriteTickerSet,
      createList,
      deleteList,
      addTickerToList,
      removeTickerFromList,
      isTickerFavorited,
      getListById,
      showToast,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <FavoriteToast toast={toast} onDismiss={dismissToast} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
