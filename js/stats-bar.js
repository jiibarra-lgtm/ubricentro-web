export async function renderStatsBar(container, { rating, total } = {}) {
  container.innerHTML = `
    <div class="stat">
      <strong>${rating ? rating.toFixed(1) : "—"} ★</strong>
      <span>Calificación en Google</span>
    </div>
    <div class="stat">
      <strong>★ Reconocidos en el barrio</strong>
      <span>Por brindar un servicio brillante</span>
    </div>
  `;
}
