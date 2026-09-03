import { NEGOCIO } from "./config.js";

const SEGUNDOS_ANTES_DE_MOSTRAR = 3;
const CLAVE_SESSION = "popup-cotizacion-cerrado";

export function initPopupCotizacion() {
  // si ya lo cerró en esta visita, no lo volvemos a mostrar hasta que
  // cierre el navegador (sessionStorage se borra ahí)
  if (sessionStorage.getItem(CLAVE_SESSION)) return;

  const overlay = document.getElementById("popup-cotizacion");
  const btnCerrar = document.getElementById("popup-cerrar");
  const btnWhatsapp = document.getElementById("popup-whatsapp");
  if (!overlay) return;

  const mensaje = encodeURIComponent(
    "Hola! Quiero recibir una cotización por el cambio de aceite."
  );
  btnWhatsapp.href = `https://wa.me/${NEGOCIO.telefono}?text=${mensaje}`;

  setTimeout(() => {
    overlay.hidden = false;
  }, SEGUNDOS_ANTES_DE_MOSTRAR * 1000);

  function cerrar() {
    overlay.hidden = true;
    sessionStorage.setItem(CLAVE_SESSION, "1");
  }

  btnCerrar.addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrar(); // click afuera de la caja
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });

  // si el visitante ya va directo a reservar turno o a WhatsApp por su
  // cuenta, no tiene sentido interrumpirlo con el popup
  btnWhatsapp.addEventListener("click", () => sessionStorage.setItem(CLAVE_SESSION, "1"));
}
