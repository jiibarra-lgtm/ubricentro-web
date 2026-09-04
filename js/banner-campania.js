import { NEGOCIO } from "./config.js";

const CLAVE_SESSION = "banner-campania-cerrado";

export function initBannerCampania() {
  if (sessionStorage.getItem(CLAVE_SESSION)) return;

  const banner = document.getElementById("banner-campania");
  if (!banner) return;

  const mensaje = encodeURIComponent("Hola! Quiero hacer un chequeo antes de viajar de vacaciones.");
  banner.querySelector("a.banner-cta").href = `turno.html`;
  banner.querySelector("a.banner-wsp").href = `https://wa.me/${NEGOCIO.telefono}?text=${mensaje}`;

  banner.hidden = false;

  banner.querySelector(".banner-cerrar").addEventListener("click", () => {
    banner.hidden = true;
    sessionStorage.setItem(CLAVE_SESSION, "1");
  });
}
