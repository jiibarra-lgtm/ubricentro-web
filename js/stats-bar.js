import { supabase } from "./supabaseClient.js";
import { NEGOCIO } from "./config.js";

const CAMBIOS_FALLBACK = 850; // DATO DE PRUEBA — se pisa solo apenas haya filas reales en historial_service

export async function renderStatsBar(container, { rating, total } = {}) {
  let cambiosRealizados = CAMBIOS_FALLBACK;

  try {
    const { count, error } = await supabase
      .from("historial_service")
      .select("*", { count: "exact", head: true });
    if (!error && count) cambiosRealizados = count;
  } catch {
    // sin Supabase todavía, seguimos con el fallback
  }

  container.innerHTML = `
    <div class="stat">
      <strong>${cambiosRealizados.toLocaleString("es-AR")}</strong>
      <span>Cambios de aceite y mantenimientos realizados</span>
    </div>
    <div class="stat">
      <strong>${rating ? rating.toFixed(1) : "—"} ★</strong>
      <span>Calificación en Google</span>
    </div>
    <div class="stat">
      <strong>✓ Empresa verificada</strong>
      <span>+${NEGOCIO.aniosEnMercado} años en el mercado</span>
    </div>
  `;
}
