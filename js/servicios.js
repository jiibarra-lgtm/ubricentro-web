import { supabase } from "./supabaseClient.js";
import { SERVICIOS_FALLBACK } from "./config.js";

export async function getServicios() {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, slug, descripcion, duracion_min, precio")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("no se pudieron traer los servicios", error);
    return SERVICIOS_FALLBACK;
  }
  return data;
}

export function renderServicios(servicios, container) {
  container.innerHTML = "";

  if (!servicios.length) {
    container.innerHTML = `<p class="servicios-empty">Todavía no hay servicios cargados.</p>`;
    return;
  }

  for (const s of servicios) {
    const card = document.createElement("article");
    card.className = "servicio-card";
    card.innerHTML = `
      <h3>${s.nombre}</h3>
      ${s.descripcion ? `<p>${s.descripcion}</p>` : ""}
      <div class="servicio-footer">
        <span class="servicio-precio">${s.precio ? "$" + s.precio.toLocaleString("es-AR") : "Consultar"}</span>
        <a href="/servicios/${s.slug}" class="btn-reservar">Ver más</a>
      </div>
    `;
    container.appendChild(card);
  }
}
