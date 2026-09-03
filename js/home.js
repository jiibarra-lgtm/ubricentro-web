import { NEGOCIO, FOTOS_FALLBACK, HERO_IMAGEN_FALLBACK } from "./config.js";
import { getServicios, renderServicios } from "./servicios.js";
import { cargarReviewsTeaser } from "./reviews.js";
import { inyectarSchemaNegocio } from "./schema.js";
import { supabase } from "./supabaseClient.js";
import "./common.js";

// el h1 lleva la zona real del negocio, no queda un texto genérico
if (NEGOCIO.direccion) {
  document.getElementById("hero-h1").textContent += ` en ${NEGOCIO.direccion}`;
}

document.querySelector(".hero").style.backgroundImage =
  `linear-gradient(135deg, rgba(30,58,95,0.88), rgba(18,35,58,0.88)), url('${HERO_IMAGEN_FALLBACK}')`;

getServicios().then((servicios) => {
  // en la home solo mostramos los primeros 3, el resto vive en servicios.html
  renderServicios(servicios.slice(0, 3), document.getElementById("lista-servicios"));
});

cargarReviewsTeaser(document.getElementById("reviews-container")).then((resumen) => {
  inyectarSchemaNegocio(resumen || {});
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
