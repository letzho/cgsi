export const FAVORITES_STORAGE_KEY = 'cgsi_favorites_v1';

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return { lists: [] };
    const parsed = JSON.parse(raw);
    return { lists: Array.isArray(parsed.lists) ? parsed.lists : [] };
  } catch {
    return { lists: [] };
  }
}

export function saveFavorites(data) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data));
}

export function createFavoriteList(name) {
  return {
    id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    tickers: [],
    createdAt: new Date().toISOString(),
  };
}

export function getAllFavoriteTickers(lists) {
  const set = new Set();
  lists.forEach((list) => list.tickers.forEach((t) => set.add(t)));
  return set;
}
