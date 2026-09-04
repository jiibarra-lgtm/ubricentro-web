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

  initFaviconAnimado();
}

function initFaviconAnimado() {
  const emojis = ["🛢️", "🚗"];
  const SEGUNDOS_POR_CAMBIO = 1;
  let i = 0;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  function dibujar() {
    ctx.clearRect(0, 0, 64, 64);
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojis[i], 32, 36);
    link.href = canvas.toDataURL("image/png");
    i = (i + 1) % emojis.length;
  }

  dibujar();
  setInterval(dibujar, SEGUNDOS_POR_CAMBIO * 1000);
}

initLayout();
