import { supabase } from "./supabaseClient.js";
import { REVIEWS_FALLBACK } from "./config.js";

const SEGUNDOS_POR_TARJETA = 4; // controla la velocidad de la cinta

// paleta de colores para los avatares de iniciales, se elige uno por
// persona de forma determinística (mismo nombre = mismo color siempre)
const COLORES_AVATAR = ["#1e3a5f", "#8a6d1f", "#2d6a4f", "#7c3f61", "#3d5a80", "#6a4c93", "#a4522f"];

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
}

function colorPara(nombre) {
  const suma = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORES_AVATAR[suma % COLORES_AVATAR.length];
}

// La api key de Google nunca va acá. La edge function `google-reviews` la
// tiene como secret y devuelve el jsonb ya cacheado en `reviews_cache`.
// Mientras esa función no esté deployada, usamos REVIEWS_FALLBACK.
async function traerReviews() {
  try {
    const { data, error } = await supabase.functions.invoke("google-reviews");
    if (error || !data?.reviews?.length) return REVIEWS_FALLBACK;
    return data;
  } catch {
    return REVIEWS_FALLBACK;
  }
}

function tarjeta(r) {
  return `
    <blockquote class="review-item">
      <p>"${r.text}"</p>
      <footer>
        <span class="review-avatar" style="background:${colorPara(r.author_name)}">${iniciales(r.author_name)}</span>
        <span class="review-autor">${r.author_name} — ${"★".repeat(r.rating)}</span>
      </footer>
    </blockquote>`;
}

function armarCinta(container, { rating, total, reviews }) {
  // se duplica la lista una vez para que la animación pueda hacer loop
  // infinito sin que se note el corte (al llegar a -50% se ve igual que
  // al principio)
  const html = reviews.map(tarjeta).join("");
  const duracion = reviews.length * SEGUNDOS_POR_TARJETA;

  container.innerHTML = `
    <div class="reviews-header">
      <span class="rating">${rating.toFixed(1)} ★</span>
      <span class="total">${total} reseñas en Google</span>
    </div>
    <div class="marquee-reviews">
      <div class="marquee-track" style="animation-duration:${duracion}s">
        ${html}
        ${html}
      </div>
    </div>
  `;
}

export async function cargarReviewsTeaser(container) {
  const data = await traerReviews();
  if (!data) return null;
  armarCinta(container, { ...data, reviews: data.reviews.slice(0, 8) });
  return { rating: data.rating, total: data.total };
}

export async function cargarReviewsCompletas(container) {
  const data = await traerReviews();
  if (!data) {
    container.innerHTML = "<p>Todavía no hay reseñas cargadas.</p>";
    return null;
  }
  armarCinta(container, data);
  return { rating: data.rating, total: data.total };
}
