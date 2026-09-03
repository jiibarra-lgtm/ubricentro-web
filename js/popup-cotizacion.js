import { NEGOCIO } from "./config.js";

const CLAVE_SESSION = "popup-cotizacion-cerrado";
const IMAGEN_POPUP = "https://klqlmmnwzouwznfpbvfm.supabase.co/storage/v1/object/public/galeria/441c70a2-d28d-4e96-9f96-63f7d97d6fc6.png";

export function initPopupCotizacion() {
  // si ya lo cerró en esta visita, no lo volvemos a mostrar hasta que
  // cierre el navegador (sessionStorage se borra ahí)
  if (sessionStorage.getItem(CLAVE_SESSION)) return;

  const overlay = document.getElementById("popup-cotizacion");
  const btnCerrar = document.getElementById("popup-cerrar");
  const btnWhatsapp = document.getElementById("popup-whatsapp");
  const foto = document.getElementById("popup-foto");
  if (!overlay) return;

  if (foto) foto.style.backgroundImage = `url('${IMAGEN_POPUP}')`;

  const mensaje = encodeURIComponent(
    "Hola! Quiero recibir una cotización por el cambio de aceite."
  );
  btnWhatsapp.href = `https://wa.me/${NEGOCIO.telefono}?text=${mensaje}`;

  overlay.hidden = false;

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
