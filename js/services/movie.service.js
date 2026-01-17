import { API_CONFIG } from "../config/api.config.js";

export async function getPopularMovies() {
  const response = await fetch(`${API_CONFIG.BASE_URL}/movie/popular`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log("Popular Movies Data:", data);
  return data;
}

export function createMovieCard(movie, index) {
  const cardClasses = [
    "card-magenta",
    "card-cyan",
    "card-magenta",
    "card-cyan",
  ];
  const labels = ["New Season", "Trending", "Original", "Anime"];
  const labelClasses = [
    "label-magenta",
    "label-cyan",
    "label-magenta",
    "label-cyan",
  ];

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO5kCepNdhZvDKJtmPAIWnloSdTal7N1CQaA&s";

  return `
    <div class="content-card ${cardClasses[index]}">
      <div
        class="card-image"
        style="background-image: url('${imageUrl}');"
      ></div>
      <div class="card-gradient"></div>
      <div class="card-info">
        <span class="card-label ${labelClasses[index]}">${labels[index]}</span>
        <span class="card-title">${movie.title || movie.name}</span>
      </div>
    </div>
  `;
}

export function renderMovies(movies) {
  const contentGrid = document.getElementById("contentGrid");
  if (!contentGrid) return;

  const movieCards = movies
    .slice(0, 4)
    .map((movie, index) => createMovieCard(movie, index))
    .join("");

  contentGrid.innerHTML = movieCards;
}

// Initialize cards with popular movies
async function initializeCards() {
  try {
    const data = await getPopularMovies();
    const movies = data.results?.slice(6, 10) || [];
    renderMovies(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
}

// Auto-initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCards);
} else {
  initializeCards();
}
