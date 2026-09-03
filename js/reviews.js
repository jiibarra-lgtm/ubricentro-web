import { supabase } from "./supabaseClient.js";
import { REVIEWS_FALLBACK } from "./config.js";

const SEGUNDOS_AUTOROTACION = 5;

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

function armarCarrusel(container, { rating, total, reviews }) {
  container.innerHTML = `
    <div class="reviews-header">
      <span class="rating">${rating.toFixed(1)} ★</span>
      <span class="total">${total} reseñas en Google</span>
    </div>
    <div class="carrusel-reviews">
      <button class="carrusel-flecha carrusel-prev" aria-label="Anterior">‹</button>
      <div class="carrusel-track">
        ${reviews
          .map(
            (r) => `
          <blockquote class="review-item">
            <p>"${r.text}"</p>
            <footer>
              <span class="review-avatar" style="background:${colorPara(r.author_name)}">${iniciales(r.author_name)}</span>
              <span class="review-autor">${r.author_name} — ${"★".repeat(r.rating)}</span>
            </footer>
          </blockquote>`
          )
          .join("")}
      </div>
      <button class="carrusel-flecha carrusel-next" aria-label="Siguiente">›</button>
    </div>
    <div class="carrusel-dots">
      ${reviews.map((_, i) => `<button class="dot" data-i="${i}" aria-label="Reseña ${i + 1}"></button>`).join("")}
    </div>
  `;

  const track = container.querySelector(".carrusel-track");
  const dots = [...container.querySelectorAll(".dot")];
  let indice = 0;
  let timer = null;

  function mostrar(i) {
    indice = (i + reviews.length) % reviews.length;
    track.style.transform = `translateX(-${indice * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("activo", di === indice));
  }

  function autoRotar() {
    timer = setInterval(() => mostrar(indice + 1), SEGUNDOS_AUTOROTACION * 1000);
  }

  container.querySelector(".carrusel-prev").addEventListener("click", () => {
    mostrar(indice - 1);
    reiniciarTimer();
  });
  container.querySelector(".carrusel-next").addEventListener("click", () => {
    mostrar(indice + 1);
    reiniciarTimer();
  });
  dots.forEach((d) => d.addEventListener("click", () => {
    mostrar(Number(d.dataset.i));
    reiniciarTimer();
  }));

  function reiniciarTimer() {
    clearInterval(timer);
    autoRotar();
  }

  mostrar(0);
  autoRotar();
}

export async function cargarReviewsTeaser(container) {
  const data = await traerReviews();
  if (!data) return null;
  armarCarrusel(container, { ...data, reviews: data.reviews.slice(0, 5) });
  return { rating: data.rating, total: data.total };
}

export async function cargarReviewsCompletas(container) {
  const data = await traerReviews();
  if (!data) {
    container.innerHTML = "<p>Todavía no hay reseñas cargadas.</p>";
    return null;
  }
  armarCarrusel(container, data);
  return { rating: data.rating, total: data.total };
}
