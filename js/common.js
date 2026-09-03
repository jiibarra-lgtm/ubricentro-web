import { NEGOCIO } from "./config.js";

export function initLayout() {
  const wsp = document.getElementById("whatsapp-float");
  if (wsp) wsp.href = `https://wa.me/${NEGOCIO.telefono}`;

  const footerHorarios = document.getElementById("footer-horarios");
  if (footerHorarios) {
    footerHorarios.textContent = NEGOCIO.horarios
      .map((h) => `${h.dia}: ${h.desde} a ${h.hasta}`)
      .join(" · ");
  }
}

initLayout();
