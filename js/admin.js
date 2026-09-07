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
  cargarAlertas();
}

function cambiarTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("activo", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("activo", p.id === `tab-${tab}`));
  if (tab === "clientes") buscarClientes();
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
  const modal = document.createElement("div");
  modal.className = "modal-completar-overlay";
  modal.innerHTML = `
    <div class="modal-completar-box">
      <h3>Completar service</h3>
      <label>Mecánico <input type="text" id="mc-mecanico" placeholder="Opcional" /></label>
      <label>Kilometraje actual <input type="number" id="mc-km" placeholder="Ej: 45000" /></label>
      <label>Tipo de combustible
        <select id="mc-combustible"><option value="nafta">Nafta</option><option value="gasoil">Gasoil</option></select>
      </label>
      <div class="mc-checks">
        <label><input type="checkbox" id="mc-aceite" checked /> Cambio de aceite</label>
        <label><input type="checkbox" id="mc-filtro-aceite" checked /> Filtro de aceite</label>
        <label><input type="checkbox" id="mc-filtro-aire" /> Filtro de aire</label>
        <label><input type="checkbox" id="mc-filtro-combustible" /> Filtro de combustible</label>
        <label><input type="checkbox" id="mc-filtro-ac" /> Filtro de aire acondicionado</label>
      </div>
      <label>Próximo service (km) <input type="number" id="mc-proximo" placeholder="Se calcula solo si lo dejás vacío (+10.000km)" /></label>
      <label>Recomendaciones para el cliente <input type="text" id="mc-recomendaciones" placeholder="Ej: revisar pastillas de freno en el próximo service" /></label>
      <div class="mc-botones">
        <button id="mc-cancelar" class="btn-secundario-admin">Cancelar</button>
        <button id="mc-guardar" class="btn-cta">Guardar y completar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#mc-cancelar").addEventListener("click", () => modal.remove());

  modal.querySelector("#mc-guardar").addEventListener("click", async () => {
    const mecanico = modal.querySelector("#mc-mecanico").value.trim() || null;
    const km = Number(modal.querySelector("#mc-km").value) || null;
    const tipo_combustible = modal.querySelector("#mc-combustible").value;
    const proximo_service_km = Number(modal.querySelector("#mc-proximo").value) || (km ? km + 10000 : null);

    const { error } = await supabase.from("turnos").update({ estado: "completado", mecanico }).eq("id", turnoId);
    if (error) { alert("No se pudo actualizar el turno."); return; }

    if (vehiculoId) {
      await supabase.from("historial_service").insert({
        vehiculo_id: vehiculoId,
        turno_id: turnoId,
        km,
        proximo_service_km,
        cambio_aceite: modal.querySelector("#mc-aceite").checked,
        filtro_aceite: modal.querySelector("#mc-filtro-aceite").checked,
        filtro_aire: modal.querySelector("#mc-filtro-aire").checked,
        filtro_combustible: modal.querySelector("#mc-filtro-combustible").checked,
        filtro_aire_acondicionado: modal.querySelector("#mc-filtro-ac").checked,
        tipo_combustible,
        recomendaciones: modal.querySelector("#mc-recomendaciones").value.trim() || null,
        detalle: mecanico ? `Atendido por ${mecanico}` : null,
      });
      if (km) {
        await supabase.from("vehiculos").update({ km_ultimo_service: km, tipo_combustible }).eq("id", vehiculoId);
      }
    }

    modal.remove();
    cargarTurnos();
  });
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
  cont.innerHTML = "Buscando...";

  let vehiculos, clientes;

  if (!termino) {
    // sin texto en el buscador: traer todos los clientes (los más nuevos primero)
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, notas")
      .order("created_at", { ascending: false })
      .limit(100);
    clientes = data;
    vehiculos = [];
  } else {
    const { data: v } = await supabase
      .from("vehiculos")
      .select("id, patente, marca, modelo, km_ultimo_service, cliente_id")
      .ilike("patente", `%${termino}%`);
    const { data: c } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, notas")
      .ilike("telefono", `%${termino}%`);
    vehiculos = v;
    clientes = c;
  }

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
          <button class="btn-ver-ficha" data-vehiculo="${v.id}">📋 Ver ficha completa</button>
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
    card.querySelectorAll(".btn-ver-ficha").forEach((b) =>
      b.addEventListener("click", () => abrirFichaVehiculo(b.dataset.vehiculo))
    );
    cont.appendChild(card);
  }
}

// ---------- FICHA DEL VEHÍCULO ----------

const NOMBRES_ITEMS_FICHA = {
  cambio_aceite: "Cambio de aceite",
  filtro_aceite: "Filtro de aceite",
  filtro_aire: "Filtro de aire",
  filtro_combustible: "Filtro de combustible",
  filtro_aire_acondicionado: "Filtro de aire acondicionado",
};

async function abrirFichaVehiculo(vehiculoId) {
  const { data: vehiculo } = await supabase
    .from("vehiculos")
    .select("id, patente, marca, modelo, anio, tipo_combustible, km_ultimo_service, cliente_id, clientes ( nombre, telefono )")
    .eq("id", vehiculoId)
    .single();

  const { data: historial } = await supabase
    .from("historial_service")
    .select("*")
    .eq("vehiculo_id", vehiculoId)
    .order("fecha", { ascending: false });

  const modal = document.createElement("div");
  modal.className = "ficha-overlay";
  modal.innerHTML = `
    <div class="ficha-box">
      <button class="ficha-cerrar" aria-label="Cerrar">✕</button>

      <div class="ficha-contenido" id="ficha-imprimible">
        <div class="ficha-header">
          <div>
            <h2>${vehiculo.marca || ""} ${vehiculo.modelo || ""} ${vehiculo.anio || ""}</h2>
            <span class="ficha-patente">${vehiculo.patente}</span>
          </div>
          <div class="ficha-cliente">
            <strong>${vehiculo.clientes?.nombre || "—"}</strong>
            <span>${vehiculo.clientes?.telefono || "—"}</span>
          </div>
        </div>

        <div class="ficha-stats">
          <div><span>Km actual</span><strong>${vehiculo.km_ultimo_service?.toLocaleString("es-AR") || "—"}</strong></div>
          <div><span>Combustible</span><strong>${vehiculo.tipo_combustible === "gasoil" ? "Gasoil" : "Nafta"}</strong></div>
          <div><span>Services registrados</span><strong>${historial?.length || 0}</strong></div>
          <div><span>Próximo service</span><strong>${historial?.[0]?.proximo_service_km?.toLocaleString("es-AR") || "—"} km</strong></div>
        </div>

        <h3>Historial completo</h3>
        <div class="ficha-timeline">
          ${
            historial?.length
              ? historial.map((h) => {
                  const items = Object.entries(NOMBRES_ITEMS_FICHA)
                    .filter(([campo]) => h[campo])
                    .map(([, nombre]) => nombre);
                  return `
                    <div class="ficha-evento">
                      <div class="ficha-evento-fecha">${new Date(h.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div class="ficha-evento-cuerpo">
                        <strong>${h.km ? h.km.toLocaleString("es-AR") + " km" : "Km no registrado"}</strong>
                        ${items.length ? `<ul>${items.map((i) => `<li>✅ ${i}</li>`).join("")}</ul>` : ""}
                        ${h.detalle ? `<p class="ficha-detalle">${h.detalle}</p>` : ""}
                      </div>
                    </div>`;
                }).join("")
              : `<p class="sin-historial">Todavía no hay services registrados para este vehículo.</p>`
          }
        </div>
      </div>

      <div class="ficha-acciones">
        <button id="btn-ficha-manual" class="btn-secundario-admin">+ Agregar entrada manual</button>
        <button id="btn-ficha-imprimir" class="btn-cta">🖨 Imprimir / PDF</button>
      </div>
      <div id="ficha-form-manual" hidden></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".ficha-cerrar").addEventListener("click", () => modal.remove());
  modal.querySelector("#btn-ficha-imprimir").addEventListener("click", () => imprimirFicha(modal));
  modal.querySelector("#btn-ficha-manual").addEventListener("click", () => toggleFormEntradaManual(modal, vehiculoId));
}

function toggleFormEntradaManual(modal, vehiculoId) {
  const cont = modal.querySelector("#ficha-form-manual");
  if (!cont.hidden) { cont.hidden = true; return; }

  cont.hidden = false;
  cont.innerHTML = `
    <div class="ficha-form-grid">
      <input type="date" id="fm-fecha" />
      <input type="number" id="fm-km" placeholder="Kilometraje" />
      <select id="fm-combustible"><option value="nafta">Nafta</option><option value="gasoil">Gasoil</option></select>
    </div>
    <div class="mc-checks">
      <label><input type="checkbox" id="fm-aceite" /> Cambio de aceite</label>
      <label><input type="checkbox" id="fm-filtro-aceite" /> Filtro de aceite</label>
      <label><input type="checkbox" id="fm-filtro-aire" /> Filtro de aire</label>
      <label><input type="checkbox" id="fm-filtro-combustible" /> Filtro de combustible</label>
      <label><input type="checkbox" id="fm-filtro-ac" /> Filtro de aire acondicionado</label>
    </div>
    <input type="text" id="fm-detalle" placeholder="Detalle / notas (opcional)" style="width:100%; margin-top:0.6rem;" />
    <button id="fm-guardar" class="btn-cta" style="margin-top:0.6rem;">Guardar entrada</button>
  `;

  cont.querySelector("#fm-guardar").addEventListener("click", async () => {
    const fecha = cont.querySelector("#fm-fecha").value || new Date().toISOString().split("T")[0];
    const km = Number(cont.querySelector("#fm-km").value) || null;
    const tipo_combustible = cont.querySelector("#fm-combustible").value;

    await supabase.from("historial_service").insert({
      vehiculo_id: vehiculoId,
      fecha,
      km,
      tipo_combustible,
      cambio_aceite: cont.querySelector("#fm-aceite").checked,
      filtro_aceite: cont.querySelector("#fm-filtro-aceite").checked,
      filtro_aire: cont.querySelector("#fm-filtro-aire").checked,
      filtro_combustible: cont.querySelector("#fm-filtro-combustible").checked,
      filtro_aire_acondicionado: cont.querySelector("#fm-filtro-ac").checked,
      detalle: cont.querySelector("#fm-detalle").value.trim() || null,
    });
    if (km) await supabase.from("vehiculos").update({ km_ultimo_service: km, tipo_combustible }).eq("id", vehiculoId);

    document.querySelector(".ficha-overlay")?.remove();
    abrirFichaVehiculo(vehiculoId);
  });
}

function imprimirFicha(modal) {
  const contenido = modal.querySelector("#ficha-imprimible").innerHTML;
  const ventana = window.open("", "_blank");
  ventana.document.write(`
    <html><head><title>Ficha del vehículo</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 2rem; color: #1c1c1c; }
      h2 { color: #1e3a5f; margin-bottom: 0.2rem; }
      .ficha-patente { background:#1e3a5f; color:white; padding:2px 10px; border-radius:6px; font-weight:bold; }
      .ficha-header { display:flex; justify-content:space-between; margin-bottom:1rem; }
      .ficha-stats { display:flex; gap:1.5rem; margin-bottom:1.5rem; }
      .ficha-stats div { text-align:center; }
      .ficha-stats span { display:block; font-size:0.8rem; color:#666; }
      .ficha-evento { display:flex; gap:1rem; margin-bottom:1rem; border-bottom:1px solid #ddd; padding-bottom:0.8rem; }
      .ficha-evento-fecha { width:100px; font-weight:bold; color:#1e3a5f; }
      ul { margin: 0.3rem 0; padding-left: 1.2rem; }
    </style>
    </head><body>${contenido}</body></html>
  `);
  ventana.document.close();
  ventana.print();
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

  // clientes a los que conviene recordarles el service
  const pendientes = await cargarRecordatoriosPendientes();
  const contPendientes = document.getElementById("recordatorios-pendientes");
  if (contPendientes) {
    if (!pendientes.length) {
      contPendientes.innerHTML = "<p>Nadie pendiente de recordatorio por ahora.</p>";
    } else {
      contPendientes.innerHTML = pendientes.map((h) => {
        const tel = h.vehiculos?.clientes?.telefono?.replace(/\D/g, "");
        const msj = encodeURIComponent(
          `Hola ${h.vehiculos?.clientes?.nombre || ""}! Te escribimos de Lubricentro MP para recordarte que ya pasó un tiempo desde tu último service en tu ${h.vehiculos?.marca || ""}. ¿Querés que te reservemos un turno?`
        );
        return `
          <div class="recordatorio-fila">
            <span>${h.vehiculos?.patente || "—"} · ${h.vehiculos?.clientes?.nombre || "—"} · último service: ${h.fecha}</span>
            <a href="https://wa.me/${tel}?text=${msj}" target="_blank" class="btn-secundario-admin">Recordar por WhatsApp</a>
          </div>`;
      }).join("");
    }
  }
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

// ---------- ALERTAS ----------

const DEFINICION_ALERTAS = [
  { campo: "alerta_vencido_km", label: "Alerta si el próximo service está vencido por kilometraje" },
  { campo: "alerta_vencido_tiempo", label: "Alerta si está vencido por tiempo (recordatorio periódico)" },
  { campo: "alerta_vtv", label: "Alerta de VTV/RTO próxima a vencer" },
  { campo: "alerta_patron_visitas", label: "Alerta si cambió el patrón de visitas del cliente" },
  { campo: "alerta_bateria", label: "Alerta de batería por vida útil estimada" },
  { campo: "alerta_neumaticos", label: "Alerta de neumáticos por antigüedad" },
  { campo: "alerta_km_erroneo", label: "Alerta si se carga un km menor al de la visita anterior (posible error)" },
  { campo: "alerta_datos_faltantes", label: "Alerta de datos faltantes en la ficha (año, VIN, etc.)" },
  { campo: "alerta_filtro_nunca_cambiado", label: "Alerta si nunca se cambió cierto filtro" },
  { campo: "semaforo_activo", label: "Mostrar semáforo de estado (verde/amarillo/rojo) en las fichas" },
];

async function cargarAlertas() {
  const cont = document.getElementById("form-alertas");
  cont.textContent = "Cargando...";

  const { data: config, error } = await supabase.from("config_alertas").select("*").eq("id", 1).single();
  if (error) { cont.textContent = "No se pudo cargar la configuración."; return; }

  cont.innerHTML = `
    <div class="alerta-destacada">
      <label>
        <strong>Recordatorio periódico de service</strong><br/>
        Recordar cada
        <input type="number" id="al-meses" value="${config.meses_recordatorio}" min="1" max="24" style="width:60px" />
        meses si el auto no volvió
      </label>
    </div>
    <div class="lista-alertas">
      ${DEFINICION_ALERTAS.filter((a) => a.campo !== "alerta_vencido_tiempo").map((a) => `
        <label class="alerta-toggle">
          <input type="checkbox" data-campo="${a.campo}" ${config[a.campo] ? "checked" : ""} />
          ${a.label}
        </label>
      `).join("")}
    </div>
    <button id="btn-guardar-alertas" class="btn-cta" style="margin-top:1rem;">Guardar configuración</button>
    <p id="alertas-status"></p>
  `;

  document.getElementById("btn-guardar-alertas").addEventListener("click", async () => {
    const payload = { meses_recordatorio: Number(document.getElementById("al-meses").value) || 3 };
    cont.querySelectorAll("input[data-campo]").forEach((input) => {
      payload[input.dataset.campo] = input.checked;
    });
    const { error } = await supabase.from("config_alertas").update(payload).eq("id", 1);
    document.getElementById("alertas-status").textContent = error ? "Error al guardar." : "Guardado ✓";
  });
}

// ---------- LISTA DE RECORDATORIOS PENDIENTES ----------

async function cargarRecordatoriosPendientes() {
  const { data: config } = await supabase.from("config_alertas").select("meses_recordatorio, alerta_vencido_tiempo").eq("id", 1).single();
  if (!config?.alerta_vencido_tiempo) return [];

  const limite = new Date();
  limite.setMonth(limite.getMonth() - config.meses_recordatorio);

  const { data } = await supabase
    .from("historial_service")
    .select("vehiculo_id, fecha, vehiculos ( patente, marca, modelo, clientes ( nombre, telefono ) )")
    .order("fecha", { ascending: false });

  const porVehiculo = new Map();
  for (const h of data || []) {
    if (!porVehiculo.has(h.vehiculo_id)) porVehiculo.set(h.vehiculo_id, h);
  }

  return [...porVehiculo.values()].filter((h) => new Date(h.fecha) < limite);
}
