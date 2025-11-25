const suggestionsList = document.getElementById("suggestionsList");
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (!query) { suggestionsList.innerHTML = ""; return; }
  const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=236ea648`);
  const data = await res.json();
  suggestionsList.innerHTML = "";
  if (data.Search) {
    data.Search.slice(0,5).forEach(movie => {
      const li = document.createElement("li");
      li.textContent = movie.Title;
      li.addEventListener("click", () => {
        searchInput.value = movie.Title;
        suggestionsList.innerHTML = "";
      });
      suggestionsList.appendChild(li);
    });
  }
});
