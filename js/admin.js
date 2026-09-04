import { supabase } from "./supabaseClient.js";

// el login solo pide contraseña; el email de la cuenta admin queda fijo acá
// adentro (igual sigue siendo un login real contra Supabase Auth, la base
// de datos exige estar autenticado para poder editar turnos/servicios/fotos)
const EMAIL_ADMIN = "ibarrajuan0806@gmail.com";

const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");

init();

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) mostrarPanel();
  else mostrarLogin();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) mostrarPanel();
    else mostrarLogin();
  });

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const password = document.getElementById("login-password").value;

    const { error } = await supabase.auth.signInWithPassword({ email: EMAIL_ADMIN, password });
    if (error) loginError.textContent = "Contraseña incorrecta.";
  });

  document.getElementById("btn-logout").addEventListener("click", () => supabase.auth.signOut());

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => cambiarTab(btn.dataset.tab));
  });

  document.getElementById("filtro-fecha-turnos").addEventListener("change", cargarTurnos);
  document.getElementById("btn-nuevo-turno").addEventListener("click", toggleFormTurnoManual);
  document.getElementById("btn-nuevo-servicio").addEventListener("click", agregarFilaServicioNuevo);
  document.getElementById("input-foto").addEventListener("change", subirFoto);
}

function mostrarLogin() {
  loginScreen.hidden = false;
  adminScreen.hidden = true;
}

function mostrarPanel() {
  loginScreen.hidden = true;
  adminScreen.hidden = false;
  cargarTurnos();
  cargarServicios();
  cargarFotos();
}

function cambiarTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("activo", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("activo", p.id === `tab-${tab}`));
}

// ---------- TURNOS ----------

const REGEX_PATENTE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
let boxIdDefault = null;

async function obtenerBoxDefault() {
  if (boxIdDefault) return boxIdDefault;
  const { data } = await supabase.from("boxes").select("id").eq("activo", true).limit(1);
  boxIdDefault = data?.[0]?.id ?? null;
  return boxIdDefault;
}

async function toggleFormTurnoManual() {
  const cont = document.getElementById("form-turno-manual");
  if (!cont.hidden) {
    cont.hidden = true;
    return;
  }

  const { data: servicios } = await supabase.from("servicios").select("id, nombre").eq("activo", true);

  cont.hidden = false;
  cont.innerHTML = `
    <div class="turno-manual-grid">
      <select id="tm-servicio">
        ${(servicios || []).map((s) => `<option value="${s.id}">${s.nombre}</option>`).join("")}
      </select>
      <input type="date" id="tm-fecha" />
      <input type="time" id="tm-hora" />
      <input type="text" id="tm-nombre" placeholder="Nombre del cliente" />
      <input type="tel" id="tm-telefono" placeholder="Teléfono" />
      <input type="text" id="tm-patente" placeholder="Patente" />
      <input type="text" id="tm-marca" placeholder="Marca / modelo" />
    </div>
    <button id="btn-guardar-turno-manual" class="btn-cta">Guardar turno</button>
    <p id="tm-mensaje"></p>
  `;

  document.getElementById("btn-guardar-turno-manual").addEventListener("click", guardarTurnoManual);
}

async function guardarTurnoManual() {
  const mensaje = document.getElementById("tm-mensaje");
  const servicio_id = document.getElementById("tm-servicio").value;
  const fecha = document.getElementById("tm-fecha").value;
  const hora = document.getElementById("tm-hora").value;
  const nombre = document.getElementById("tm-nombre").value.trim();
  const telefono = document.getElementById("tm-telefono").value.trim();
  const patente = document.getElementById("tm-patente").value.trim().toUpperCase().replace(/\s/g, "");
  const marca = document.getElementById("tm-marca").value.trim();

  if (!servicio_id || !fecha || !hora || !nombre || !telefono || !patente) {
    mensaje.textContent = "Completá todos los campos obligatorios (marca es opcional).";
    return;
  }
  if (!REGEX_PATENTE.test(patente)) {
    mensaje.textContent = "La patente no tiene un formato válido (ej: AB123CD o ABC123).";
    return;
  }

  mensaje.textContent = "Guardando...";
  const box_id = await obtenerBoxDefault();

  let { data: cliente } = await supabase.from("clientes").select("id").eq("telefono", telefono).maybeSingle();
  if (!cliente) {
    const { data: nuevo, error } = await supabase
      .from("clientes")
      .insert({ nombre, telefono })
      .select("id")
      .single();
    if (error) return (mensaje.textContent = "Error al guardar el cliente: " + error.message);
    cliente = nuevo;
  }

  let { data: vehiculo } = await supabase.from("vehiculos").select("id").eq("patente", patente).maybeSingle();
  if (!vehiculo) {
    const { data: nuevo, error } = await supabase
      .from("vehiculos")
      .insert({ cliente_id: cliente.id, patente, marca })
      .select("id")
      .single();
    if (error) return (mensaje.textContent = "Error al guardar el vehículo: " + error.message);
    vehiculo = nuevo;
  }

  const { error: errTurno } = await supabase.from("turnos").insert({
    cliente_id: cliente.id,
    vehiculo_id: vehiculo.id,
    servicio_id,
    box_id,
    fecha,
    hora,
    estado: "confirmado",
  });

  if (errTurno) {
    mensaje.textContent = errTurno.message.includes("duplicate")
      ? "Ya hay un turno en ese horario, elegí otro."
      : "No se pudo guardar: " + errTurno.message;
    return;
  }

  mensaje.textContent = "Turno cargado ✓";
  document.getElementById("form-turno-manual").hidden = true;
  cargarTurnos();
}

async function cargarTurnos() {
  const cont = document.getElementById("lista-turnos");
  cont.textContent = "Cargando...";

  const fecha = document.getElementById("filtro-fecha-turnos").value;

  let query = supabase
    .from("turnos")
    .select(`
      id, fecha, hora, estado,
      clientes ( nombre, telefono ),
      vehiculos ( patente, marca ),
      servicios ( nombre )
    `)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (fecha) query = query.eq("fecha", fecha);
  else query = query.gte("fecha", new Date().toISOString().split("T")[0]);

  const { data, error } = await query;

  if (error) {
    cont.textContent = "No se pudieron cargar los turnos.";
    return;
  }
  if (!data.length) {
    cont.textContent = "No hay turnos para mostrar.";
    return;
  }

  cont.innerHTML = "";
  for (const t of data) {
    const card = document.createElement("div");
    card.className = `turno-card ${t.estado}`;
    card.innerHTML = `
      <div class="turno-info">
        <strong>${t.fecha} · ${t.hora}</strong>
        <span>${t.clientes?.nombre || "—"} · ${t.clientes?.telefono || "—"} · ${t.vehiculos?.patente || "—"} ${t.vehiculos?.marca || ""}</span>
        <span>${t.servicios?.nombre || "Servicio eliminado"} — estado: ${t.estado}</span>
      </div>
      <div class="turno-acciones">
        ${t.estado === "pendiente" || t.estado === "confirmado" ? `
          <button class="btn-completar" data-id="${t.id}">Marcar completado</button>
          <button class="btn-cancelar-turno" data-id="${t.id}">Cancelar</button>
        ` : ""}
      </div>
    `;
    cont.appendChild(card);
  }

  cont.querySelectorAll(".btn-completar").forEach((b) =>
    b.addEventListener("click", () => cambiarEstadoTurno(b.dataset.id, "completado"))
  );
  cont.querySelectorAll(".btn-cancelar-turno").forEach((b) =>
    b.addEventListener("click", () => cambiarEstadoTurno(b.dataset.id, "cancelado"))
  );
}

async function cambiarEstadoTurno(id, estado) {
  const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
  if (error) alert("No se pudo actualizar el turno.");
  cargarTurnos();
}

// ---------- SERVICIOS ----------

async function cargarServicios() {
  const cont = document.getElementById("lista-servicios-admin");
  cont.textContent = "Cargando...";

  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, slug, descripcion, duracion_min, precio, activo, orden")
    .order("orden", { ascending: true });

  if (error) {
    cont.textContent = "No se pudieron cargar los servicios.";
    return;
  }

  cont.innerHTML = "";
  data.forEach((s) => cont.appendChild(filaServicio(s)));
}

function filaServicio(s = {}) {
  const row = document.createElement("div");
  row.className = "servicio-row";
  row.dataset.id = s.id || "";
  row.innerHTML = `
    <input class="f-nombre" placeholder="Nombre" value="${s.nombre || ""}" />
    <input class="f-precio" type="number" placeholder="Precio" value="${s.precio ?? ""}" />
    <input class="f-duracion" type="number" placeholder="Minutos" value="${s.duracion_min ?? 30}" />
    <label class="toggle-activo">
      <input type="checkbox" class="f-activo" ${s.activo !== false ? "checked" : ""} /> activo
    </label>
    <div style="display:flex; gap:0.4rem;">
      <button class="btn-guardar-servicio">Guardar</button>
      ${s.id ? `<button class="btn-borrar-servicio">Borrar</button>` : ""}
    </div>
  `;

  row.querySelector(".btn-guardar-servicio").addEventListener("click", () => guardarServicio(row, s));
  row.querySelector(".btn-borrar-servicio")?.addEventListener("click", () => borrarServicio(s.id, row));

  return row;
}

function agregarFilaServicioNuevo() {
  document.getElementById("lista-servicios-admin").appendChild(filaServicio());
}

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function guardarServicio(row, original) {
  const nombre = row.querySelector(".f-nombre").value.trim();
  const precio = Number(row.querySelector(".f-precio").value) || null;
  const duracion_min = Number(row.querySelector(".f-duracion").value) || 30;
  const activo = row.querySelector(".f-activo").checked;

  if (!nombre) return alert("Falta el nombre del servicio.");

  const payload = {
    nombre,
    precio,
    duracion_min,
    activo,
    slug: original.slug || slugify(nombre),
  };

  const query = original.id
    ? supabase.from("servicios").update(payload).eq("id", original.id)
    : supabase.from("servicios").insert(payload);

  const { error } = await query;
  if (error) return alert("No se pudo guardar: " + error.message);
  cargarServicios();
}

async function borrarServicio(id, row) {
  if (!confirm("¿Seguro que querés borrar este servicio?")) return;
  const { error } = await supabase.from("servicios").delete().eq("id", id);
  if (error) return alert("No se pudo borrar.");
  row.remove();
}

// ---------- FOTOS ----------

async function cargarFotos() {
  const cont = document.getElementById("grid-fotos-admin");
  cont.textContent = "Cargando...";

  const { data, error } = await supabase
    .from("fotos_galeria")
    .select("id, url, categoria, orden")
    .order("orden", { ascending: true });

  if (error) {
    cont.textContent = "No se pudieron cargar las fotos.";
    return;
  }

  cont.innerHTML = "";
  for (const f of data) {
    const card = document.createElement("div");
    card.className = "foto-card-admin";
    card.innerHTML = `
      <img src="${f.url}" alt="${f.categoria || ""}" />
      <input value="${f.categoria || ""}" placeholder="Categoría" />
      <button class="btn-borrar-foto" title="Borrar">✕</button>
    `;
    card.querySelector("input").addEventListener("change", async (e) => {
      await supabase.from("fotos_galeria").update({ categoria: e.target.value }).eq("id", f.id);
    });
    card.querySelector(".btn-borrar-foto").addEventListener("click", () => borrarFoto(f, card));
    cont.appendChild(card);
  }
}

async function subirFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const status = document.getElementById("foto-status");
  status.textContent = "Subiendo...";

  const nombreArchivo = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  const { error: errUpload } = await supabase.storage.from("galeria").upload(nombreArchivo, file);
  if (errUpload) {
    status.textContent = "Error al subir: " + errUpload.message;
    return;
  }

  const { data: urlData } = supabase.storage.from("galeria").getPublicUrl(nombreArchivo);

  const { error: errInsert } = await supabase
    .from("fotos_galeria")
    .insert({ url: urlData.publicUrl, categoria: "", orden: 99 });

  if (errInsert) {
    status.textContent = "Se subió la foto pero no se pudo registrar: " + errInsert.message;
    return;
  }

  status.textContent = "Foto subida ✓";
  e.target.value = "";
  cargarFotos();
}

async function borrarFoto(foto, card) {
  if (!confirm("¿Borrar esta foto?")) return;

  // el nombre del archivo en el bucket es la última parte de la url pública
  const nombreArchivo = foto.url.split("/").pop();
  await supabase.storage.from("galeria").remove([nombreArchivo]);
  await supabase.from("fotos_galeria").delete().eq("id", foto.id);
  card.remove();
}
