import { supabase } from "./supabaseClient.js";

// La api key de Google nunca va acá. La edge function `google-reviews` la
// tiene como secret y devuelve el jsonb ya cacheado en `reviews_cache`.
async function traerReviews() {
  const { data, error } = await supabase.functions.invoke("google-reviews");
  if (error || !data?.reviews?.length) return null;
  return data;
}

function renderHeader(container, rating, total) {
  const header = document.createElement("div");
  header.className = "reviews-header";
  header.innerHTML = `
    <span class="rating">${rating.toFixed(1)} ★</span>
    <span class="total">${total} reseñas en Google</span>
  `;
  container.appendChild(header);
}

function renderItem(r) {
  const item = document.createElement("blockquote");
  item.className = "review-item";
  item.innerHTML = `
    <p>"${r.text}"</p>
    <footer>${r.author_name} — ${"★".repeat(r.rating)}</footer>
  `;
  return item;
}

export async function cargarReviewsTeaser(container) {
  const data = await traerReviews();
  if (!data) return null;

  container.innerHTML = "";
  renderHeader(container, data.rating, data.total);

  const list = document.createElement("div");
  list.className = "reviews-list";
  data.reviews.slice(0, 3).forEach((r) => list.appendChild(renderItem(r)));
  container.appendChild(list);

  return { rating: data.rating, total: data.total };
}

export async function cargarReviewsCompletas(container) {
  const data = await traerReviews();
  if (!data) {
    container.innerHTML = "<p>Todavía no hay reseñas cargadas.</p>";
    return null;
  }

  container.innerHTML = "";
  renderHeader(container, data.rating, data.total);

  const list = document.createElement("div");
  list.className = "reviews-list";
  data.reviews.forEach((r) => list.appendChild(renderItem(r)));
  container.appendChild(list);

  return { rating: data.rating, total: data.total };
}
