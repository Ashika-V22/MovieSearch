// ==========================
// BASIC CONFIG
// ==========================
const API_KEY = "236ea648";
const BASE_URL = "https://www.omdbapi.com/";

// ==========================
// DOM ELEMENTS
// ==========================
const trendingRow = document.getElementById("trendingRow");
const popularRow = document.getElementById("popularRow");
const topRatedRow = document.getElementById("topRatedRow");
const movieContainer = document.getElementById("movieContainer");
const loader = document.getElementById("loader");

const btnTrending = document.getElementById("btn-trending");
const btnPopular = document.getElementById("btn-popular");
const btnTopRated = document.getElementById("btn-toprated");
const btnWatchlist = document.getElementById("btn-watchlist");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsList = document.getElementById("suggestionsList");
const micBtn = document.getElementById("micBtn");

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalBody = document.getElementById("modalBody");
const addWatchlist = document.getElementById("addWatchlist");

// ==========================
// GLOBALS
// ==========================
let currentMovie = null;
let moviesList = [];   // Holds ALL fetched full-details movies for global filtering

// ==========================
// BUTTON EVENT LISTENERS
// ==========================
btnTrending.addEventListener("click", () => switchRow("trending"));
btnPopular.addEventListener("click", () => switchRow("popular"));
btnTopRated.addEventListener("click", () => switchRow("topRated"));
btnWatchlist.addEventListener("click", showWatchlist);

searchBtn.addEventListener("click", () => searchMovies(searchInput.value));
searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchMovies(searchInput.value);
});
searchInput.addEventListener("input", showSuggestions);

closeModal.addEventListener("click", () => modal.classList.add("hidden"));
addWatchlist.addEventListener("click", toggleWatchlist);

micBtn.addEventListener("click", startVoiceSearch);

// ==========================
// SWITCH ROW DISPLAY
// ==========================
function switchRow(row) {
    trendingRow.classList.add("hidden");
    popularRow.classList.add("hidden");
    topRatedRow.classList.add("hidden");

    btnTrending.classList.remove("active");
    btnPopular.classList.remove("active");
    btnTopRated.classList.remove("active");

    if (row === "trending") {
        trendingRow.classList.remove("hidden");
        btnTrending.classList.add("active");
    } 
    else if (row === "popular") {
        popularRow.classList.remove("hidden");
        btnPopular.classList.add("active");
    } 
    else if (row === "topRated") {
        topRatedRow.classList.remove("hidden");
        btnTopRated.classList.add("active");
    }
}

// ==========================
// DISPLAY MOVIE CARDS
// ==========================
function displayMovies(movies, container, horizontal = true) {
    container.innerHTML = "";
    movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card");
        card.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'assets/logo.png'}">
            <p>${movie.Title} (${movie.Year})</p>
        `;
        card.addEventListener("click", () => openModal(movie));
        container.appendChild(card);
    });

    container.style.display = horizontal ? "flex" : "grid";
}

// ==========================
// FETCH MOVIES + FULL DETAILS
// ==========================
async function fetchMovies(search = "Avengers", container = trendingRow) {
    loader.classList.remove("hidden");
    try {
        const res = await fetch(`${BASE_URL}?s=${search}&apikey=${API_KEY}`);
        const data = await res.json();
        loader.classList.add("hidden");

        if (data.Response === "True") {
            // Fetch full details
            const fullMovies = await Promise.all(
                data.Search.map(async m => {
                    const info = await fetch(`${BASE_URL}?i=${m.imdbID}&apikey=${API_KEY}`);
                    return await info.json();
                })
            );

            // Prevent duplicates in global list
            fullMovies.forEach(m => {
                if (!moviesList.some(x => x.imdbID === m.imdbID)) {
                    moviesList.push(m);
                }
            });

            displayMovies(fullMovies, container);
        } else {
            container.innerHTML = "<p>No movies found</p>";
        }
    } catch (e) {
        console.error(e);
        loader.classList.add("hidden");
        container.innerHTML = "<p>Error fetching data</p>";
    }
}

// ==========================
// OPEN MODAL
// ==========================
async function openModal(movie) {
    currentMovie = movie;
    modal.classList.remove("hidden");

    try {
        const res = await fetch(`${BASE_URL}?i=${movie.imdbID}&apikey=${API_KEY}`);
        const data = await res.json();

        modalBody.innerHTML = `
            <h2>${data.Title}</h2>
            <img src="${data.Poster !== 'N/A' ? data.Poster : 'assets/logo.png'}">
            <p><strong>Genre:</strong> ${data.Genre}</p>
            <p><strong>Director:</strong> ${data.Director}</p>
            <p><strong>Runtime:</strong> ${data.Runtime}</p>
            <p><strong>Plot:</strong> ${data.Plot}</p>
            <p><strong>IMDB Rating:</strong> ${data.imdbRating}</p>
        `;

        // Trailer button
        const trailerBtn = document.createElement("button");
        trailerBtn.innerText = "Watch Trailer";
        trailerBtn.classList.add("trailer-btn");
        trailerBtn.onclick = () => {
            const trailerURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.Title + " trailer")}`;
            window.open(trailerURL, "_blank");
        };
        modalBody.appendChild(trailerBtn);

        // Watchlist button
        updateWatchlistButton(data.imdbID);

    } catch (e) {
        console.error(e);
    }
}

function updateWatchlistButton(id) {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const exists = watchlist.some(m => m.imdbID === id);
    addWatchlist.textContent = exists ? "Remove from Watchlist" : "Add to Watchlist";
}

// ==========================
// WATCHLIST
// ==========================
function toggleWatchlist() {
    if (!currentMovie) return;

    let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const index = watchlist.findIndex(m => m.imdbID === currentMovie.imdbID);

    if (index > -1) {
        watchlist.splice(index, 1);
        addWatchlist.textContent = "Add to Watchlist";
    } else {
        watchlist.push(currentMovie);
        addWatchlist.textContent = "Remove from Watchlist";
    }

    localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

function showWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");

    trendingRow.classList.add("hidden");
    popularRow.classList.add("hidden");
    topRatedRow.classList.add("hidden");

    if (watchlist.length === 0) {
        movieContainer.innerHTML = "<p>No movies in watchlist</p>";
    } else {
        displayMovies(watchlist, movieContainer, false);
    }
}

// ==========================
// SEARCH SUGGESTIONS
// ==========================
async function showSuggestions() {
    const q = searchInput.value.trim();
    suggestionsList.innerHTML = "";
    if (!q) return;

    try {
        const res = await fetch(`${BASE_URL}?s=${q}&apikey=${API_KEY}`);
        const data = await res.json();

        if (data.Search) {
            data.Search.slice(0, 5).forEach(movie => {
                const li = document.createElement("li");
                li.innerHTML = movie.Title;
                li.onclick = () => {
                    searchInput.value = movie.Title;
                    suggestionsList.innerHTML = "";
                    searchMovies(movie.Title);
                };
                suggestionsList.appendChild(li);
            });
        }

    } catch (e) { console.error(e); }
}

// ==========================
// SEARCH
// ==========================
async function searchMovies(query) {
    if (!query) return;

    try {
        const res = await fetch(`${BASE_URL}?s=${query}&apikey=${API_KEY}`);
        const data = await res.json();

        if (data.Search) {
            displayMovies(data.Search, movieContainer, false);
        } else {
            movieContainer.innerHTML = "<p>No results found</p>";
        }
    } catch (e) {
        console.error(e);
        movieContainer.innerHTML = "<p>Error fetching data</p>";
    }
}

// ==========================
// VOICE SEARCH
// ==========================
function startVoiceSearch() {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Voice search not supported on this browser");
        return;
    }

    const rec = new webkitSpeechRecognition();
    rec.lang = "en-US";
    rec.start();
    rec.onresult = e => {
        const text = e.results[0][0].transcript;
        searchInput.value = text;
        searchMovies(text);
    };
}

// ==========================
// GENRE FILTERS
// ==========================
const genreButtons = document.querySelectorAll(".genre-btn");

genreButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        genreButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const genre = btn.dataset.genre;

        const filtered = moviesList.filter(movie => {
            if (genre === "All") return true;
            return movie.Genre && movie.Genre.includes(genre);
        });

        displayMovies(filtered, movieContainer, false);
    });
});

// ==========================
// INITIAL FETCH
// ==========================
fetchMovies("Avengers", trendingRow);
fetchMovies("Batman", popularRow);
fetchMovies("Inception", topRatedRow);
