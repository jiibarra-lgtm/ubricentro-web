import { NEGOCIO } from "./config.js";
import { getServicios, renderServicios } from "./servicios.js";
import { cargarReviewsTeaser } from "./reviews.js";
import { inyectarSchemaNegocio } from "./schema.js";
import { supabase } from "./supabaseClient.js";
import "./common.js";

// el h1 lleva la zona real del negocio, no queda un texto genérico
if (NEGOCIO.direccion) {
  document.getElementById("hero-h1").textContent += ` en ${NEGOCIO.direccion}`;
}

getServicios().then((servicios) => {
  // en la home solo mostramos los primeros 3, el resto vive en servicios.html
  renderServicios(servicios.slice(0, 3), document.getElementById("lista-servicios"));
});

cargarReviewsTeaser(document.getElementById("reviews-container")).then((resumen) => {
  inyectarSchemaNegocio(resumen || {});
});

supabase
  .from("fotos_galeria")
  .select("url, categoria")
  .order("orden")
  .limit(8)
  .then(({ data }) => {
    const contenedor = document.getElementById("lista-galeria");
    for (const foto of data || []) {
      const img = document.createElement("img");
      img.src = foto.url;
      img.loading = "lazy";
      img.alt = `${foto.categoria || "trabajo realizado"} en ${NEGOCIO.nombre}${
        NEGOCIO.direccion ? " — " + NEGOCIO.direccion : ""
      }`;
      contenedor.appendChild(img);
    }
  });
