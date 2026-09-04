import { supabase } from "./supabaseClient.js";

const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");

const MESES_INACTIVIDAD_ALERTA = 6; // umbral para la alerta de "hace tiempo no viene"

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
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) loginError.textContent = "Email o contraseña incorrectos.";
  });

  document.getElementById("btn-logout").addEventListener("click", () => supabase.auth.signOut());

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => cambiarTab(btn.dataset.tab));
  });

  document.getElementById("filtro-fecha-turnos").addEventListener("change", cargarTurnos);
  document.getElementById("btn-nuevo-turno").addEventListener("click", toggleFormTurnoManual);
  document.getElementById("btn-nuevo-servicio").addEventListener("click", agregarFilaServicioNuevo);
  document.getElementById("input-foto").addEventListener("change", subirFoto);
  document.getElementById("btn-exportar-csv").addEventListener("click", exportarTurnosCSV);
  document.getElementById("buscar-cliente").addEventListener("input", debounce(buscarClientes, 350));
  document.getElementById("btn-vista-lista").addEventListener("click", () => cambiarVistaTurnos("lista"));
  document.getElementById("btn-vista-semana").addEventListener("click", () => cambiarVistaTurnos("semana"));
  document.getElementById("btn-modo-oscuro").addEventListener("click", toggleModoOscuro);

  document.addEventListener("keydown", (e) => {
    if (e.key === "n" && document.getElementById("tab-turnos").classList.contains("activo") &&
        document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      toggleFormTurnoManual();
    }
  });

  if (localStorage.getItem("admin-modo-oscuro") === "1") activarModoOscuro();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function mostrarLogin() { loginScreen.hidden = false; adminScreen.hidden = true; }

function mostrarPanel() {
  loginScreen.hidden = true;
  adminScreen.hidden = false;
  cargarTurnos();
  cargarServicios();
  cargarPapelera();
  cargarFotos();
  cargarDashboard();
}

function cambiarTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("activo", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("activo", p.id === `tab-${tab}`));
}

// ---------- MODO OSCURO ----------

function toggleModoOscuro() {
  const activo = document.body.classList.toggle("modo-oscuro");
  localStorage.setItem("admin-modo-oscuro", activo ? "1" : "0");
}
function activarModoOscuro() { document.body.classList.add("modo-oscuro"); }

// ---------- TURNOS ----------

const REGEX_PATENTE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
let boxIdDefault = null;
let vistaTurnos = "lista";
let ultimosTurnosCargados = [];

async function obtenerBoxDefault() {
  if (boxIdDefault) return boxIdDefault;
  const { data } = await supabase.from("boxes").select("id").eq("activo", true).limit(1);
  boxIdDefault = data?.[0]?.id ?? null;
  return boxIdDefault;
}

function cambiarVistaTurnos(vista) {
  vistaTurnos = vista;
  document.getElementById("btn-vista-lista").classList.toggle("activo", vista === "lista");
  document.getElementById("btn-vista-semana").classList.toggle("activo", vista === "semana");
  document.getElementById("lista-turnos").hidden = vista !== "lista";
  document.getElementById("vista-semana").hidden = vista !== "semana";
  document.getElementById("filtro-fecha-turnos").style.display = vista === "lista" ? "" : "none";
  if (vista === "semana") renderVistaSemana(ultimosTurnosCargados);
}

async function toggleFormTurnoManual() {
  const cont = document.getElementById("form-turno-manual");
  if (!cont.hidden) { cont.hidden = true; return; }

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
      <input type="text" id="tm-mecanico" placeholder="Mecánico (opcional)" />
    </div>
    <button id="btn-guardar-turno-manual" class="btn-cta">Guardar turno</button>
    <p id="tm-mensaje"></p>
  `;
  document.getElementById("btn-guardar-turno-manual").addEventListener("click", guardarTurnoManual);
  document.getElementById("tm-nombre").focus();
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
  const mecanico = document.getElementById("tm-mecanico").value.trim() || null;

  if (!servicio_id || !fecha || !hora || !nombre || !telefono || !patente) {
    mensaje.textContent = "Completá todos los campos obligatorios.";
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
    const { data: nuevo, error } = await supabase.from("clientes").insert({ nombre, telefono }).select("id").single();
    if (error) return (mensaje.textContent = "Error al guardar el cliente: " + error.message);
    cliente = nuevo;
  }

  let { data: vehiculo } = await supabase.from("vehiculos").select("id").eq("patente", patente).maybeSingle();
  if (!vehiculo) {
    const { data: nuevo, error } = await supabase
      .from("vehiculos").insert({ cliente_id: cliente.id, patente, marca }).select("id").single();
    if (error) return (mensaje.textContent = "Error al guardar el vehículo: " + error.message);
    vehiculo = nuevo;
  }

  const { error: errTurno } = await supabase.from("turnos").insert({
    cliente_id: cliente.id, vehiculo_id: vehiculo.id, servicio_id, box_id,
    fecha, hora, estado: "confirmado", mecanico,
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
      id, fecha, hora, estado, mecanico,
      clientes ( nombre, telefono ),
      vehiculos ( id, patente, marca ),
      servicios ( nombre )
    `)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (fecha) query = query.eq("fecha", fecha);
  else query = query.gte("fecha", new Date().toISOString().split("T")[0]);

  const { data, error } = await query;

  if (error) { cont.textContent = "No se pudieron cargar los turnos."; return; }
  ultimosTurnosCargados = data || [];

  if (!data.length) { cont.textContent = "No hay turnos para mostrar."; return; }

  cont.innerHTML = "";
  for (const t of data) {
    const card = document.createElement("div");
    card.className = `turno-card ${t.estado}`;
    card.innerHTML = `
      <div class="turno-info">
        <strong>${t.fecha} · ${t.hora}</strong>
        <span>${t.clientes?.nombre || "—"} · ${t.clientes?.telefono || "—"} · ${t.vehiculos?.patente || "—"} ${t.vehiculos?.marca || ""}</span>
        <span>${t.servicios?.nombre || "Servicio eliminado"} — estado: ${t.estado}${t.mecanico ? " · mecánico: " + t.mecanico : ""}</span>
      </div>
      <div class="turno-acciones">
        ${t.estado === "pendiente" || t.estado === "confirmado" ? `
          <button class="btn-completar" data-id="${t.id}" data-vehiculo="${t.vehiculos?.id || ""}">Marcar completado</button>
          <button class="btn-cancelar-turno" data-id="${t.id}">Cancelar</button>
        ` : ""}
      </div>
    `;
    cont.appendChild(card);
  }

  cont.querySelectorAll(".btn-completar").forEach((b) =>
    b.addEventListener("click", () => completarTurno(b.dataset.id, b.dataset.vehiculo))
  );
  cont.querySelectorAll(".btn-cancelar-turno").forEach((b) =>
    b.addEventListener("click", () => cambiarEstadoTurno(b.dataset.id, "cancelado"))
  );

  if (vistaTurnos === "semana") renderVistaSemana(data);
}

async function cambiarEstadoTurno(id, estado) {
  const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
  if (error) alert("No se pudo actualizar el turno.");
  cargarTurnos();
}

async function completarTurno(turnoId, vehiculoId) {
  const mecanico = prompt("¿Quién atendió este turno? (opcional, dejar vacío si no aplica)") || null;
  const km = prompt("¿Kilometraje del auto al momento del service? (opcional)");

  const { error } = await supabase.from("turnos").update({ estado: "completado", mecanico }).eq("id", turnoId);
  if (error) return alert("No se pudo actualizar el turno.");

  if (vehiculoId) {
    await supabase.from("historial_service").insert({
      vehiculo_id: vehiculoId,
      turno_id: turnoId,
      km: km ? Number(km) : null,
      detalle: mecanico ? `Atendido por ${mecanico}` : null,
    });
    if (km) await supabase.from("vehiculos").update({ km_ultimo_service: Number(km) }).eq("id", vehiculoId);
  }

  cargarTurnos();
}

function renderVistaSemana(turnos) {
  const cont = document.getElementById("vista-semana");
  const hoy = new Date();
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d.toISOString().split("T")[0]);
  }

  cont.innerHTML = dias
    .map((fecha) => {
      const deEseDia = turnos.filter((t) => t.fecha === fecha);
      return `
        <div class="semana-columna">
          <h4>${new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })}</h4>
          ${deEseDia.length
            ? deEseDia.map((t) => `<div class="semana-item ${t.estado}">${t.hora} · ${t.clientes?.nombre || "—"}</div>`).join("")
            : `<p class="semana-vacio">Sin turnos</p>`}
        </div>`;
    })
    .join("");
}

function exportarTurnosCSV() {
  if (!ultimosTurnosCargados.length) return alert("No hay turnos cargados para exportar.");

  const filas = [["Fecha", "Hora", "Cliente", "Teléfono", "Patente", "Marca", "Servicio", "Estado", "Mecánico"]];
  for (const t of ultimosTurnosCargados) {
    filas.push([
      t.fecha, t.hora, t.clientes?.nombre || "", t.clientes?.telefono || "",
      t.vehiculos?.patente || "", t.vehiculos?.marca || "", t.servicios?.nombre || "",
      t.estado, t.mecanico || "",
    ]);
  }
  const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `turnos-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- CLIENTES ----------

async function buscarClientes() {
  const termino = document.getElementById("buscar-cliente").value.trim();
  const cont = document.getElementById("resultado-clientes");
  if (!termino) { cont.innerHTML = ""; return; }

  cont.innerHTML = "Buscando...";

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, patente, marca, modelo, km_ultimo_service, cliente_id")
    .ilike("patente", `%${termino}%`);

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, notas")
    .ilike("telefono", `%${termino}%`);

  const clienteIds = new Set([...(clientes || []).map((c) => c.id), ...(vehiculos || []).map((v) => v.cliente_id)]);

  if (!clienteIds.size) { cont.innerHTML = "<p>No se encontraron resultados.</p>"; return; }

  cont.innerHTML = "";
  for (const id of clienteIds) {
    const cliente = clientes?.find((c) => c.id === id) || (await supabase.from("clientes").select("id, nombre, telefono, notas").eq("id", id).single()).data;
    const { data: vehiculosCliente } = await supabase.from("vehiculos").select("id, patente, marca, modelo, km_ultimo_service").eq("cliente_id", id);

    const card = document.createElement("div");
    card.className = "cliente-card";

    let vehiculosHtml = "";
    for (const v of vehiculosCliente || []) {
      const { data: historial } = await supabase
        .from("historial_service").select("fecha, km, detalle").eq("vehiculo_id", v.id).order("fecha", { ascending: false });

      const ultimaFecha = historial?.[0]?.fecha;
      const mesesDesde = ultimaFecha ? Math.floor((Date.now() - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24 * 30)) : null;
      const alerta = mesesDesde !== null && mesesDesde >= MESES_INACTIVIDAD_ALERTA
        ? `<span class="alerta-inactivo">⚠ hace ${mesesDesde} meses que no viene con este auto</span>` : "";

      vehiculosHtml += `
        <div class="vehiculo-box">
          <strong>${v.patente}</strong> ${v.marca || ""} ${v.modelo || ""} ${v.km_ultimo_service ? `· ${v.km_ultimo_service.toLocaleString("es-AR")} km` : ""}
          ${alerta}
          ${historial?.length ? `<ul class="historial-lista">${historial.map((h) => `<li>${h.fecha}${h.km ? " · " + h.km + " km" : ""}${h.detalle ? " · " + h.detalle : ""}</li>`).join("")}</ul>` : `<p class="sin-historial">Sin services registrados todavía.</p>`}
        </div>`;
    }

    card.innerHTML = `
      <div class="cliente-header">
        <strong>${cliente?.nombre || "—"}</strong>
        <span>${cliente?.telefono || "—"}</span>
      </div>
      <textarea class="cliente-notas" placeholder="Notas internas...">${cliente?.notas || ""}</textarea>
      ${vehiculosHtml}
    `;
    card.querySelector(".cliente-notas").addEventListener("change", async (e) => {
      await supabase.from("clientes").update({ notas: e.target.value }).eq("id", id);
    });
    cont.appendChild(card);
  }
}

// ---------- SERVICIOS ----------

async function cargarServicios() {
  const cont = document.getElementById("lista-servicios-admin");
  cont.textContent = "Cargando...";

  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, slug, descripcion, duracion_min, precio, activo, orden, eliminado")
    .or("eliminado.is.null,eliminado.eq.false")
    .order("orden", { ascending: true });

  if (error) { cont.textContent = "No se pudieron cargar los servicios."; return; }

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
  row.querySelector(".btn-borrar-servicio")?.addEventListener("click", () => borrarServicio(s, row));
  return row;
}

function agregarFilaServicioNuevo() {
  document.getElementById("lista-servicios-admin").appendChild(filaServicio());
}

function slugify(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function guardarServicio(row, original) {
  const nombre = row.querySelector(".f-nombre").value.trim();
  const precio = Number(row.querySelector(".f-precio").value) || null;
  const duracion_min = Number(row.querySelector(".f-duracion").value) || 30;
  const activo = row.querySelector(".f-activo").checked;
  if (!nombre) return alert("Falta el nombre del servicio.");

  const payload = { nombre, precio, duracion_min, activo, slug: original.slug || slugify(nombre) };

  if (original.id && original.precio !== precio) {
    await supabase.from("precios_historial").insert({
      servicio_id: original.id, nombre_servicio: nombre,
      precio_anterior: original.precio, precio_nuevo: precio,
    });
  }

  const query = original.id
    ? supabase.from("servicios").update(payload).eq("id", original.id)
    : supabase.from("servicios").insert(payload);

  const { error } = await query;
  if (error) return alert("No se pudo guardar: " + error.message);
  cargarServicios();
}

async function borrarServicio(s, row) {
  if (!confirm("¿Mandar este servicio a la papelera?")) return;
  const { error } = await supabase.from("servicios").update({ eliminado: true, eliminado_at: new Date().toISOString() }).eq("id", s.id);
  if (error) return alert("No se pudo borrar.");
  row.remove();
  cargarPapelera();
}

// ---------- PAPELERA ----------

async function cargarPapelera() {
  const cont = document.getElementById("lista-papelera");
  cont.textContent = "Cargando...";

  const { data, error } = await supabase
    .from("servicios").select("id, nombre, precio, eliminado_at").eq("eliminado", true).order("eliminado_at", { ascending: false });

  if (error) { cont.textContent = "No se pudo cargar la papelera."; return; }
  if (!data.length) { cont.innerHTML = "<p>La papelera está vacía.</p>"; return; }

  cont.innerHTML = "";
  for (const s of data) {
    const row = document.createElement("div");
    row.className = "servicio-row papelera-row";
    row.innerHTML = `
      <span>${s.nombre}</span>
      <span>${s.precio ? "$" + s.precio.toLocaleString("es-AR") : "—"}</span>
      <span style="font-size:0.8rem; color:#888;">borrado: ${new Date(s.eliminado_at).toLocaleDateString("es-AR")}</span>
      <button class="btn-guardar-servicio">Restaurar</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      await supabase.from("servicios").update({ eliminado: false, eliminado_at: null }).eq("id", s.id);
      cargarPapelera();
      cargarServicios();
    });
    cont.appendChild(row);
  }
}

// ---------- FOTOS ----------

async function cargarFotos() {
  const cont = document.getElementById("grid-fotos-admin");
  cont.textContent = "Cargando...";

  const { data, error } = await supabase.from("fotos_galeria").select("id, url, categoria, orden").order("orden", { ascending: true });
  if (error) { cont.textContent = "No se pudieron cargar las fotos."; return; }

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
  if (errUpload) { status.textContent = "Error al subir: " + errUpload.message; return; }

  const { data: urlData } = supabase.storage.from("galeria").getPublicUrl(nombreArchivo);
  const { error: errInsert } = await supabase.from("fotos_galeria").insert({ url: urlData.publicUrl, categoria: "", orden: 99 });
  if (errInsert) { status.textContent = "Se subió la foto pero no se pudo registrar: " + errInsert.message; return; }

  status.textContent = "Foto subida ✓";
  e.target.value = "";
  cargarFotos();
}

async function borrarFoto(foto, card) {
  if (!confirm("¿Borrar esta foto?")) return;
  const nombreArchivo = foto.url.split("/").pop();
  await supabase.storage.from("galeria").remove([nombreArchivo]);
  await supabase.from("fotos_galeria").delete().eq("id", foto.id);
  card.remove();
}

// ---------- DASHBOARD ----------

async function cargarDashboard() {
  const resumen = document.getElementById("dashboard-resumen");
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesStr = inicioMes.toISOString().split("T")[0];

  const { data: turnosMes } = await supabase
    .from("turnos")
    .select("id, hora, estado, servicio_id, servicios ( nombre, precio )")
    .gte("fecha", inicioMesStr);

  const completados = (turnosMes || []).filter((t) => t.estado === "completado");
  const ingresos = completados.reduce((acc, t) => acc + (t.servicios?.precio || 0), 0);

  resumen.innerHTML = `
    <div class="stat-dashboard"><strong>${turnosMes?.length || 0}</strong><span>Turnos este mes</span></div>
    <div class="stat-dashboard"><strong>${completados.length}</strong><span>Completados</span></div>
    <div class="stat-dashboard"><strong>$${ingresos.toLocaleString("es-AR")}</strong><span>Ingresos estimados</span></div>
  `;

  // gráfico de servicios más pedidos
  const conteoServicios = {};
  for (const t of turnosMes || []) {
    const nombre = t.servicios?.nombre || "—";
    conteoServicios[nombre] = (conteoServicios[nombre] || 0) + 1;
  }
  renderBarras(document.getElementById("grafico-servicios"), conteoServicios);

  // gráfico de ocupación por franja horaria
  const conteoHorarios = {};
  for (const t of turnosMes || []) {
    const franja = t.hora?.slice(0, 2) + ":00";
    conteoHorarios[franja] = (conteoHorarios[franja] || 0) + 1;
  }
  renderBarras(document.getElementById("grafico-horarios"), conteoHorarios);
}

function renderBarras(container, datos) {
  const entradas = Object.entries(datos).sort((a, b) => b[1] - a[1]);
  if (!entradas.length) { container.innerHTML = "<p>Sin datos todavía.</p>"; return; }
  const max = Math.max(...entradas.map((e) => e[1]));
  container.innerHTML = entradas
    .map(([label, valor]) => `
      <div class="barra-fila">
        <span class="barra-label">${label}</span>
        <div class="barra-track"><div class="barra-fill" style="width:${(valor / max) * 100}%"></div></div>
        <span class="barra-valor">${valor}</span>
      </div>`)
    .join("");
}
