import { NEGOCIO } from "./config.js";

function renderLista(container, items) {
  if (!container) return;
  if (!items?.length) {
    container.style.display = "none";
    return;
  }
  container.innerHTML = items.map((m) => `<span class="marca-badge">${m}</span>`).join("");
}

export function renderMarcas(containerMarcas, containerAditivos) {
  renderLista(containerMarcas, NEGOCIO.marcas);
  renderLista(containerAditivos, NEGOCIO.aditivos);
}
