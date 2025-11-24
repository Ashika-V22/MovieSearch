// js/watchlist.js
const KEY = "mv_watchlist_v1";

/** Store a movie object (id, title, poster_path, year) */
export function addToWatchlist(movie) {
  const list = getWatchlist();
  if (!list.find(m => m.id === movie.id)) {
    list.push(movie);
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

export function removeFromWatchlist(id) {
  let list = getWatchlist();
  list = list.filter(m => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}
