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
  console.log(data);
  return data;
}

getPopularMovies();
