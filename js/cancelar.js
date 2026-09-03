import { supabase } from "./supabaseClient.js";

const token = new URLSearchParams(location.search).get("token");
const $estado = document.getElementById("estado");
const $btn = document.getElementById("btn-cancelar");

if (!token) {
  $estado.textContent = "Este link no es válido.";
} else {
  buscarTurno();
}

async function buscarTurno() {
  const { data: turno } = await supabase
    .from("turnos")
    .select("fecha, hora, estado")
    .eq("cancelacion_token", token)
    .maybeSingle();

  if (!turno) {
    $estado.textContent = "No encontramos ese turno, puede que ya haya sido cancelado.";
    return;
  }

  if (turno.estado === "cancelado") {
    $estado.textContent = "Este turno ya estaba cancelado.";
    return;
  }

  $estado.textContent = `Turno para el ${turno.fecha} a las ${turno.hora}.`;
  $btn.style.display = "inline-block";
  $btn.onclick = cancelar;
}

async function cancelar() {
  $btn.disabled = true;
  const { error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("cancelacion_token", token);

  $estado.textContent = error
    ? "No se pudo cancelar, escribinos por WhatsApp directamente."
    : "Turno cancelado. ¡Gracias por avisar!";
  $btn.style.display = "none";
}
