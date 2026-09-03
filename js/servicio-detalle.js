import { supabase } from "./supabaseClient.js";
import { NEGOCIO } from "./config.js";

const slug = location.pathname.split("/").pop();

const { data: servicio } = await supabase
  .from("servicios")
  .select("id, nombre, descripcion, duracion_min, precio")
  .eq("slug", slug)
  .eq("activo", true)
  .maybeSingle();

if (!servicio) {
  document.querySelector("main").innerHTML = `<p>No encontramos ese servicio. <a href="/index.html">Volver al inicio</a></p>`;
} else {
  const zona = NEGOCIO.direccion ? ` en ${NEGOCIO.direccion}` : "";

  document.getElementById("page-title").textContent = `${servicio.nombre}${zona} | ${NEGOCIO.nombre}`;
  document.getElementById("page-description").content =
    servicio.descripcion || `${servicio.nombre} en ${NEGOCIO.nombre}. Reservá tu turno online.`;
  document.getElementById("page-canonical").href = `https://TUDOMINIO.com.ar/servicios/${slug}`;

  document.getElementById("servicio-nombre").textContent = servicio.nombre;
  document.getElementById("breadcrumb-actual").textContent = servicio.nombre;
  document.getElementById("servicio-descripcion").textContent =
    servicio.descripcion || "Consultanos por WhatsApp para más detalles de este servicio.";
  document.getElementById("servicio-duracion").textContent = `Duración estimada: ${servicio.duracion_min} minutos`;
  document.getElementById("btn-reservar-servicio").href = `/turno.html?servicio=${servicio.id}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: servicio.nombre,
    description: servicio.descripcion,
    provider: { "@type": "AutoRepair", name: NEGOCIO.nombre },
  };
  document.getElementById("schema-service").textContent = JSON.stringify(schema);
}
