import { NEGOCIO, FOTOS_FALLBACK, HERO_IMAGEN_FALLBACK } from "./config.js";
import { getServicios, renderServicios } from "./servicios.js";
import { cargarReviewsTeaser } from "./reviews.js";
import { inyectarSchemaNegocio } from "./schema.js";
import { renderStatsBar } from "./stats-bar.js";
import { renderMarcas } from "./marcas.js";
import { supabase } from "./supabaseClient.js";
import { initPopupCotizacion } from "./popup-cotizacion.js";
import { initBannerCampania } from "./banner-campania.js";
import "./common.js";

initPopupCotizacion();
initBannerCampania();
renderMarcas(document.getElementById("lista-marcas"), document.getElementById("lista-aditivos"));

// el h1 lleva la zona real del negocio, no queda un texto genérico
// el h1 ya menciona el barrio; acá solo completamos con la calle
// (se toma la primera parte de la dirección completa, antes de la coma)
const calle = NEGOCIO.direccion.split(",")[0];
document.getElementById("hero-h1").textContent += ` — ${calle}`;

document.querySelector(".hero").style.backgroundImage =
  `linear-gradient(135deg, rgba(30,58,95,0.45), rgba(18,35,58,0.5)), url('${HERO_IMAGEN_FALLBACK}')`;

getServicios().then((servicios) => {
  // en la home solo mostramos los primeros 3, el resto vive en servicios.html
  renderServicios(servicios.slice(0, 3), document.getElementById("lista-servicios"));
});

cargarReviewsTeaser(document.getElementById("reviews-container")).then((resumen) => {
  inyectarSchemaNegocio(resumen || {});
  renderStatsBar(document.getElementById("stats-bar"), resumen || {});
});

cargarGaleria();

async function cargarGaleria() {
  const contenedor = document.getElementById("lista-galeria");
  let fotos = FOTOS_FALLBACK;

  try {
    const { data, error } = await supabase
      .from("fotos_galeria")
      .select("url, categoria")
      .order("orden")
      .limit(8);
    if (!error && data?.length) fotos = data;
  } catch {
    // sin conexión a Supabase todavía, seguimos con el fallback
  }

  for (const foto of fotos) {
    const img = document.createElement("img");
    img.src = foto.url;
    img.loading = "lazy";
    img.alt = `${foto.categoria || "trabajo realizado"} en ${NEGOCIO.nombre}${
      NEGOCIO.direccion ? " — " + NEGOCIO.direccion : ""
    }`;
    contenedor.appendChild(img);
  }
}
