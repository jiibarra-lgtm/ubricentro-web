import { supabase } from "./supabaseClient.js";
import { NEGOCIO } from "./config.js";

const params = new URLSearchParams(location.search);
const servicioIdPreseleccionado = params.get("servicio");

const $servicio = document.getElementById("servicio");
const $fecha = document.getElementById("fecha");
const $horarios = document.getElementById("horarios");
const $form = document.getElementById("form-turno");
const $mensaje = document.getElementById("mensaje");

let servicioSeleccionado = null;
let horaSeleccionada = null;
let boxIdDefault = null;

init();

async function init() {
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_min")
    .eq("activo", true);

  // por ahora un solo elevador/box; cuando haya más de uno, acá se arma
  // un selector y se deja de tomar siempre el primero
  const { data: boxes } = await supabase.from("boxes").select("id").eq("activo", true).limit(1);
  boxIdDefault = boxes?.[0]?.id ?? null;

  for (const s of servicios || []) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.dataset.duracion = s.duracion_min;
    opt.textContent = s.nombre;
    $servicio.appendChild(opt);
  }

  if (servicioIdPreseleccionado) $servicio.value = servicioIdPreseleccionado;

  const hoy = new Date().toISOString().split("T")[0];
  $fecha.min = hoy;
  $fecha.value = hoy;

  $servicio.addEventListener("change", cargarHorarios);
  $fecha.addEventListener("change", cargarHorarios);
  $form.addEventListener("submit", confirmarTurno);

  cargarHorarios();
}

async function cargarHorarios() {
  $horarios.innerHTML = "cargando...";
  horaSeleccionada = null;

  const servicioId = $servicio.value;
  const fecha = $fecha.value;
  if (!servicioId || !fecha) return;

  const duracion = Number($servicio.selectedOptions[0]?.dataset.duracion || NEGOCIO.duracionTurnoDefault);
  const diaSemana = new Date(fecha + "T00:00:00").getDay();

  const bloque = NEGOCIO.horarios.find((h) => diasIncluyen(h.dia, diaSemana));
  if (!bloque) {
    $horarios.innerHTML = `<p>No atendemos ese día.</p>`;
    return;
  }

  const { data: ocupados } = await supabase
    .from("turnos")
    .select("hora")
    .eq("fecha", fecha)
    .eq("box_id", boxIdDefault)
    .neq("estado", "cancelado");

  const horasOcupadas = new Set((ocupados || []).map((t) => t.hora));
  const disponibles = generarSlots(bloque.desde, bloque.hasta, duracion).filter(
    (h) => !horasOcupadas.has(h)
  );

  $horarios.innerHTML = "";
  if (!disponibles.length) {
    $horarios.innerHTML = `<p>No quedan horarios ese día, probá con otra fecha.</p>`;
    return;
  }

  for (const h of disponibles) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.textContent = h;
    btn.onclick = () => {
      document.querySelectorAll(".slot.selected").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      horaSeleccionada = h;
    };
    $horarios.appendChild(btn);
  }
}

function generarSlots(desde, hasta, duracionMin) {
  const slots = [];
  let [h, m] = desde.split(":").map(Number);
  const [hFin, mFin] = hasta.split(":").map(Number);

  while (h < hFin || (h === hFin && m < mFin)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += duracionMin;
    while (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return slots;
}

function diasIncluyen(etiqueta, diaSemana) {
  // diaSemana: 0 domingo, 1 lunes ... 6 sábado
  const rangos = {
    "lunes a viernes": [1, 2, 3, 4, 5],
    "sábados": [6],
    "sábado": [6],
    "domingos": [0],
  };
  const clave = etiqueta.toLowerCase();
  const dias = rangos[clave];
  return dias ? dias.includes(diaSemana) : false;
}

const REGEX_PATENTE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

async function confirmarTurno(e) {
  e.preventDefault();
  if (!horaSeleccionada) {
    $mensaje.textContent = "Elegí un horario primero.";
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const patente = document.getElementById("patente").value.trim().toUpperCase().replace(/\s/g, "");
  const marca = document.getElementById("marca").value.trim();
  const aceptaTerminos = document.getElementById("acepta-terminos").checked;

  if (!REGEX_PATENTE.test(patente)) {
    $mensaje.textContent = "Revisá la patente, el formato no parece válido (ej: AB123CD o ABC123).";
    return;
  }

  if (!aceptaTerminos) {
    $mensaje.textContent = "Necesitamos que aceptes el tratamiento de tus datos para reservar.";
    return;
  }

  $mensaje.textContent = "Confirmando...";

  let { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefono", telefono)
    .maybeSingle();

  if (!cliente) {
    const { data: nuevoCliente, error: errCliente } = await supabase
      .from("clientes")
      .insert({ nombre, telefono })
      .select("id")
      .single();
    if (errCliente) return mostrarError(errCliente);
    cliente = nuevoCliente;
  }

  let { data: vehiculo } = await supabase
    .from("vehiculos")
    .select("id")
    .eq("patente", patente)
    .maybeSingle();

  if (!vehiculo) {
    const { data: nuevoVehiculo, error: errVehiculo } = await supabase
      .from("vehiculos")
      .insert({ cliente_id: cliente.id, patente, marca })
      .select("id")
      .single();
    if (errVehiculo) return mostrarError(errVehiculo);
    vehiculo = nuevoVehiculo;
  }

  const { data: turnoCreado, error: errTurno } = await supabase
    .from("turnos")
    .insert({
      cliente_id: cliente.id,
      vehiculo_id: vehiculo.id,
      servicio_id: $servicio.value,
      box_id: boxIdDefault,
      fecha: $fecha.value,
      hora: horaSeleccionada,
      estado: "pendiente",
    })
    .select("cancelacion_token")
    .single();

  if (errTurno) return mostrarError(errTurno);

  $mensaje.textContent = "";
  $form.reset();

  const linkCancelacion = `${location.origin}/cancelar.html?token=${turnoCreado.cancelacion_token}`;
  mostrarModalConfirmacion({
    fecha: $fecha.value,
    hora: horaSeleccionada,
    patente,
    linkCancelacion,
  });
}

function formatearFecha(fechaISO) {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const [y, m, d] = fechaISO.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return `${dias[fecha.getDay()]}, ${d} de ${fecha.toLocaleDateString("es-AR", { month: "long" })}`;
}

function mostrarModalConfirmacion({ fecha, hora, patente, linkCancelacion }) {
  const modal = document.getElementById("modal-confirmacion");
  document.getElementById("confirmacion-fecha").textContent = `${formatearFecha(fecha)} · ${hora} hs`;

  const mensajeWsp = encodeURIComponent(
    `Hola! Quiero confirmar mi turno del ${fecha} a las ${hora} para ${patente}.\n\nSi necesito cancelar o cambiar el turno: ${linkCancelacion}`
  );
  document.getElementById("confirmacion-whatsapp").href = `https://wa.me/${NEGOCIO.telefono}?text=${mensajeWsp}`;

  document.getElementById("confirmacion-mapa").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(NEGOCIO.nombre + " " + NEGOCIO.direccion)}`;

  const btnCompartir = document.getElementById("confirmacion-compartir");
  btnCompartir.onclick = async () => {
    const texto = `Turno en ${NEGOCIO.nombre} — ${formatearFecha(fecha)} a las ${hora} hs.`;
    if (navigator.share) {
      try { await navigator.share({ text: texto }); } catch { /* el usuario canceló, no pasa nada */ }
    } else {
      await navigator.clipboard.writeText(texto);
      btnCompartir.textContent = "Copiado ✓";
      setTimeout(() => (btnCompartir.textContent = "🔗 Compartir mi turno"), 2000);
    }
  };

  document.getElementById("confirmacion-cerrar").onclick = () => (modal.hidden = true);
  modal.hidden = false;
}

function mostrarError(error) {
  console.error(error);
  $mensaje.textContent = "Hubo un problema, probá de nuevo o escribinos por WhatsApp.";
}
