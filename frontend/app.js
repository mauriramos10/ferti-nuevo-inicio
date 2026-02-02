const API_URL = "http://127.0.0.1:8000";
document.getElementById("apiUrlLabel").innerText = API_URL;

async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Error ${res.status}`);
  }
  return res.json();
}

function escapeHtml(s) {
  return (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function refrescar() {
  const cols = await api("/colaboradores");
  const eqs = await api("/equipos");

  document.getElementById("listaColaboradores").innerHTML =
    cols.map(c => `• <b>${escapeHtml(c.nombre)}</b> — ${escapeHtml(c.telefono)} (ID: ${c.id})`).join("<br>");

  document.getElementById("listaEquipos").innerHTML =
    eqs.map(e => `• <b>${escapeHtml(e.codigo)}</b> [${e.tipo}] — ${e.estatus} — ${escapeHtml(e.ubicacion_unidad)} (ID: ${e.id})`).join("<br>");

  const selCol = document.getElementById("o_colaborador");
  selCol.innerHTML = cols.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)} (${escapeHtml(c.telefono)})</option>`).join("");

  const selUM = document.getElementById("o_unidad_movil");
  const ums = eqs.filter(e => e.tipo === "unidad_movil");
  selUM.innerHTML = ums.map(e => `<option value="${e.id}">${escapeHtml(e.codigo)} — ${escapeHtml(e.ubicacion_unidad)}</option>`).join("");
}

document.getElementById("btnRefrescar").addEventListener("click", refrescar);

document.getElementById("btnCrearColaborador").addEventListener("click", async () => {
  const payload = {
    codigo: document.getElementById("c_codigo").value || null,
    nombre: document.getElementById("c_nombre").value,
    puesto: document.getElementById("c_puesto").value || null,
    telefono: document.getElementById("c_telefono").value,
    activo: true
  };
  await api("/colaboradores", { method: "POST", body: JSON.stringify(payload) });
  await refrescar();
  alert("Colaborador guardado");
});

document.getElementById("btnCrearEquipo").addEventListener("click", async () => {
  const payload = {
    codigo: document.getElementById("e_codigo").value,
    tipo: document.getElementById("e_tipo").value,
    descripcion: document.getElementById("e_desc").value || null,
    estatus: document.getElementById("e_estatus").value,
    ubicacion_unidad: document.getElementById("e_unidad").value,
    ubicacion_sector: document.getElementById("e_sector").value || null,
    ubicacion_lote: document.getElementById("e_lote").value || null,
    ubicacion_referencia: document.getElementById("e_ref").value || null,
    responsable_id: null
  };
  await api("/equipos", { method: "POST", body: JSON.stringify(payload) });
  await refrescar();
  alert("Equipo guardado");
});

document.getElementById("btnCrearOrden").addEventListener("click", async () => {
  const msg = document.getElementById("ordenMsg");
  msg.innerHTML = "";
  try {
    const equiposRaw = document.getElementById("o_equipos").value.trim();
    const equipos_ids = equiposRaw
      ? equiposRaw.split(",").map(x => parseInt(x.trim(), 10)).filter(n => Number.isFinite(n))
      : [];

    const payload = {
      tipo: "asistencia",
      estado: "abierta",
      prioridad: "media",
      descripcion: document.getElementById("o_desc").value,

      ubicacion_unidad: document.getElementById("o_unidad").value,
      ubicacion_sector: document.getElementById("o_sector").value || null,
      ubicacion_lote: document.getElementById("o_lote").value || null,
      ubicacion_referencia: document.getElementById("o_ref").value || null,

      unidad_movil_id: parseInt(document.getElementById("o_unidad_movil").value, 10),
      asignado_colaborador_id: parseInt(document.getElementById("o_colaborador").value, 10),

      fecha_programada: null,
      fecha_inicio: null,
      fecha_cierre: null,

      equipos_ids
    };

    const orden = await api("/ordenes", { method: "POST", body: JSON.stringify(payload) });
    msg.innerHTML = `<div class="alert alert-success">Orden creada (ID: ${orden.id}).</div>`;
  } catch (e) {
    msg.innerHTML = `<div class="alert alert-danger">Error: ${escapeHtml(e.message)}</div>`;
  }
});

refrescar();
