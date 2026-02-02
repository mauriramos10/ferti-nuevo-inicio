/* Ferti · Mantenimiento Móvil
   - 100% estático (GitHub Pages)
   - Guarda datos en localStorage (funciona offline si el navegador lo permite)
*/

const STORAGE_KEY = "ferti_mm_data_v1";
const DEFAULT_DATA = {"version": 1, "vehicles": [{"id": "10051856", "denominacion": "Camión Hino 2023"}, {"id": "10051598", "denominacion": "Camión Hino 2020"}, {"id": "10051704", "denominacion": "CAMION HINO 5.25 TON"}], "staff": [{"ficha": "131357", "nombre": "RONY OMAR RAMOS LARA", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "146814", "nombre": "ESVIN DANIEL PEREZ LARIOS", "especialidad": "ELECTRICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "149015", "nombre": "SERGIO DAVID ALFARO BARILLAS", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "136583", "nombre": "ABELARDO TURCIOS GONZALEZ", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "142319", "nombre": "LUIS DAVID COLAJ YUCA", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "149621", "nombre": "GERMAN DANIEL COC RODRIGUEZ", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "150745", "nombre": "JOSUE DANILO GARCIA MORALES", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "152166", "nombre": "HERBETH ESTUARDO PEREZ PEREZ", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "134603", "nombre": "YELTSIN YOVANI LOPEZ GOMEZ", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "143062", "nombre": "LESTER GEOVANI HERNANDEZ ALEGRIA", "especialidad": "ELECTRICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "139390", "nombre": "FELIX RENE GALINDO AJIC", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "143100", "nombre": "EDWIN MIZAEL RODRIGUEZ CHINGO", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "119306", "nombre": "HERIBERTO DE LEON NICOLAS", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "144223", "nombre": "KEVIN ROSENDO CUTZAL SIGUENZA", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "152570", "nombre": "BRYAN ESAU GARCIA", "especialidad": "SOLDADOR", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "101854", "nombre": "ROMAN NARCISO CHAVEZ GONZALEZ", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}, {"ficha": "149021", "nombre": "LEIDY YULIANA VICENTE MAZARIEGOS", "especialidad": "MECANICO", "telefono": "", "turno": "dia", "vehiculoId": ""}], "tasks": []};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(DEFAULT_DATA);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return structuredClone(DEFAULT_DATA);
    if (!parsed.vehicles) parsed.vehicles = [];
    if (!parsed.staff) parsed.staff = [];
    if (!parsed.tasks) parsed.tasks = [];
    return parsed;
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let state = {
  data: loadData(),
  staffShiftFilter: "todos",
  staffSearch: "",
  taskFilterPerson: "",
  taskFilterVehicle: "",
  taskFilterStatus: "abiertas",
};

function vehicleLabel(id) {
  const v = state.data.vehicles.find(x => x.id === id);
  return v ? `${v.id} · ${v.denominacion}` : "—";
}

function staffLabel(ficha) {
  const s = state.data.staff.find(x => x.ficha === ficha);
  return s ? `${s.nombre} (${s.ficha})` : "—";
}

function normalize(str) {
  return (str || "").toString().trim().toLowerCase();
}

function render() {
  renderVehicles();
  renderStaff();
  renderTaskFilters();
  renderTasks();
}

function renderVehicles() {
  const tbody = $("#vehiclesTbody");
  tbody.innerHTML = "";
  state.data.vehicles
    .slice()
    .sort((a,b) => a.id.localeCompare(b.id))
    .forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${escapeHtml(v.id)}</b></td>
        <td>${escapeHtml(v.denominacion)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn--ghost" data-action="editVehicle" data-id="${escapeAttr(v.id)}">Editar</button>
          <button class="btn btn--danger" data-action="delVehicle" data-id="${escapeAttr(v.id)}">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

function renderStaff() {
  const tbody = $("#staffTbody");
  tbody.innerHTML = "";

  const search = normalize(state.staffSearch);
  const shift = state.staffShiftFilter;

  const filtered = state.data.staff.filter(s => {
    const shiftOk = (shift === "todos") || (s.turno === shift);
    const hay = normalize(`${s.ficha} ${s.nombre} ${s.especialidad} ${s.telefono}`);
    const searchOk = !search || hay.includes(search);
    return shiftOk && searchOk;
  });

  filtered
    .slice()
    .sort((a,b) => a.nombre.localeCompare(b.nombre))
    .forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${escapeHtml(s.ficha)}</b></td>
        <td>${escapeHtml(s.nombre)}</td>
        <td><span class="pill">${escapeHtml(s.especialidad)}</span></td>
        <td>${escapeHtml(s.telefono || "")}</td>
        <td><span class="pill pill--muted">${s.turno === "noche" ? "Noche" : "Día"}</span></td>
        <td>${escapeHtml(vehicleLabel(s.vehiculoId))}</td>
        <td style="white-space:nowrap">
          <button class="btn btn--ghost" data-action="editStaff" data-ficha="${escapeAttr(s.ficha)}">Editar</button>
          <button class="btn btn--danger" data-action="delStaff" data-ficha="${escapeAttr(s.ficha)}">Borrar</button>
        </td>
      `;
      tr.addEventListener("click", (e) => {
        // evitar que el click en botones duplique
        if (e.target && e.target.closest("button")) return;
        openEditStaffModal(s.ficha);
      });
      tbody.appendChild(tr);
    });
}

function renderTaskFilters() {
  // Personas
  const selP = $("#taskFilterPerson");
  const curP = state.taskFilterPerson;
  selP.innerHTML = `<option value="">Todas las personas</option>` + state.data.staff
    .slice()
    .sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .map(s => `<option value="${escapeAttr(s.ficha)}">${escapeHtml(s.nombre)} (${escapeHtml(s.ficha)})</option>`)
    .join("");
  selP.value = curP;

  // Vehículos
  const selV = $("#taskFilterVehicle");
  const curV = state.taskFilterVehicle;
  selV.innerHTML = `<option value="">Todas las unidades</option>` + state.data.vehicles
    .slice()
    .sort((a,b)=>a.id.localeCompare(b.id))
    .map(v => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.id)} · ${escapeHtml(v.denominacion)}</option>`)
    .join("");
  selV.value = curV;
}

function renderTasks() {
  const list = $("#tasksList");
  list.innerHTML = "";

  const status = state.taskFilterStatus;
  let tasks = state.data.tasks.slice();

  if (state.taskFilterPerson) {
    tasks = tasks.filter(t => t.asignadoFicha === state.taskFilterPerson);
  }
  if (state.taskFilterVehicle) {
    tasks = tasks.filter(t => t.vehiculoId === state.taskFilterVehicle);
  }
  if (status === "abiertas") {
    tasks = tasks.filter(t => !t.completada);
  } else if (status === "cerradas") {
    tasks = tasks.filter(t => t.completada);
  }

  tasks.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || ""));

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.textContent = "No hay tareas para este filtro.";
    list.appendChild(empty);
    return;
  }

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task";
    const badge = t.completada ? `<span class="badge badge--done">Cerrada</span>` : `<span class="badge badge--open">Abierta</span>`;
    const due = t.fecha_limite ? ` · Límite: ${escapeHtml(t.fecha_limite)}` : "";
    div.innerHTML = `
      <div class="task__top">
        <div>
          <div class="task__title">${escapeHtml(t.titulo || "Tarea")} ${badge}</div>
          <div class="task__meta">
            <span>Asignado: <b>${escapeHtml(staffLabel(t.asignadoFicha))}</b></span>
            <span>Unidad: <b>${escapeHtml(vehicleLabel(t.vehiculoId))}</b></span>
            <span>${escapeHtml((t.turno || "dia") === "noche" ? "Turno noche" : "Turno día")}${due}</span>
          </div>
        </div>
      </div>
      <div class="small" style="margin-top:8px;white-space:pre-wrap">${escapeHtml(t.detalle || "")}</div>
      <div class="task__actions">
        <button class="btn btn--ghost" data-action="editTask" data-id="${escapeAttr(t.id)}">Editar</button>
        <button class="btn ${t.completada ? "btn--primary" : "btn--ok"}" data-action="toggleTask" data-id="${escapeAttr(t.id)}">
          ${t.completada ? "Reabrir" : "Marcar hecha"}
        </button>
        <button class="btn btn--danger" data-action="delTask" data-id="${escapeAttr(t.id)}">Borrar</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// ----------------- Modal helpers -----------------
function openModal(title, bodyHtml, footerHtml) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHtml;
  $("#modalFooter").innerHTML = footerHtml;
  $("#modal").classList.add("is-open");
  $("#modal").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("#modal").classList.remove("is-open");
  $("#modal").setAttribute("aria-hidden", "true");
}

$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", closeModal);

// ----------------- Escaping -----------------
function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`","&#096;");
}

// ----------------- Actions: Staff -----------------
function openEditStaffModal(ficha) {
  const s = state.data.staff.find(x => x.ficha === ficha);
  if (!s) return;

  const vehiclesOptions = `<option value="">(Sin asignar)</option>` + state.data.vehicles
    .slice().sort((a,b)=>a.id.localeCompare(b.id))
    .map(v => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.id)} · ${escapeHtml(v.denominacion)}</option>`)
    .join("");

  const body = `
    <div class="field">
      <label>Ficha</label>
      <input id="m_ficha" value="${escapeAttr(s.ficha)}" disabled />
    </div>
    <div class="field">
      <label>Nombre</label>
      <input id="m_nombre" value="${escapeAttr(s.nombre)}" />
    </div>
    <div class="field">
      <label>Especialidad</label>
      <input id="m_especialidad" value="${escapeAttr(s.especialidad)}" />
    </div>
    <div class="field">
      <label>Teléfono</label>
      <input id="m_telefono" value="${escapeAttr(s.telefono || "")}" placeholder="Ej: 5555-5555" />
    </div>
    <div class="field">
      <label>Turno</label>
      <select id="m_turno">
        <option value="dia">Día</option>
        <option value="noche">Noche</option>
      </select>
    </div>
    <div class="field">
      <label>Unidad móvil asignada</label>
      <select id="m_vehiculo">
        ${vehiclesOptions}
      </select>
    </div>
  `;
  const footer = `
    <button class="btn btn--primary" id="m_save">Guardar</button>
  `;
  openModal("Editar personal", body, footer);

  $("#m_turno").value = s.turno || "dia";
  $("#m_vehiculo").value = s.vehiculoId || "";

  $("#m_save").addEventListener("click", () => {
    s.nombre = $("#m_nombre").value.trim() || s.nombre;
    s.especialidad = $("#m_especialidad").value.trim() || s.especialidad;
    s.telefono = $("#m_telefono").value.trim();
    s.turno = $("#m_turno").value;
    s.vehiculoId = $("#m_vehiculo").value;
    saveData(state.data);
    closeModal();
    render();
  });
}

function openAddStaffModal() {
  const vehiclesOptions = `<option value="">(Sin asignar)</option>` + state.data.vehicles
    .slice().sort((a,b)=>a.id.localeCompare(b.id))
    .map(v => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.id)} · ${escapeHtml(v.denominacion)}</option>`)
    .join("");

  const body = `
    <div class="field">
      <label>Ficha (única)</label>
      <input id="a_ficha" placeholder="Ej: 123456" />
    </div>
    <div class="field">
      <label>Nombre</label>
      <input id="a_nombre" placeholder="Nombre completo" />
    </div>
    <div class="field">
      <label>Especialidad</label>
      <input id="a_especialidad" placeholder="MECANICO / ELECTRICO / SOLDADOR…" />
    </div>
    <div class="field">
      <label>Teléfono</label>
      <input id="a_telefono" placeholder="Ej: 5555-5555" />
    </div>
    <div class="field">
      <label>Turno</label>
      <select id="a_turno">
        <option value="dia">Día</option>
        <option value="noche">Noche</option>
      </select>
    </div>
    <div class="field">
      <label>Unidad móvil asignada</label>
      <select id="a_vehiculo">
        ${vehiclesOptions}
      </select>
    </div>
    <div class="small">Se guarda en este teléfono (localStorage).</div>
  `;
  const footer = `<button class="btn btn--primary" id="a_save">Agregar</button>`;
  openModal("Agregar personal", body, footer);

  $("#a_save").addEventListener("click", () => {
    const ficha = $("#a_ficha").value.trim();
    const nombre = $("#a_nombre").value.trim();
    if (!ficha || !nombre) {
      alert("Ficha y nombre son obligatorios.");
      return;
    }
    if (state.data.staff.some(x => x.ficha === ficha)) {
      alert("Esa ficha ya existe.");
      return;
    }
    state.data.staff.push({
      ficha,
      nombre,
      especialidad: $("#a_especialidad").value.trim() || "",
      telefono: $("#a_telefono").value.trim() || "",
      turno: $("#a_turno").value,
      vehiculoId: $("#a_vehiculo").value || ""
    });
    saveData(state.data);
    closeModal();
    render();
  });
}

// ----------------- Actions: Vehicle -----------------
function openAddVehicleModal() {
  const body = `
    <div class="field">
      <label>Equipo (código único)</label>
      <input id="v_id" placeholder="Ej: 10051856" />
    </div>
    <div class="field">
      <label>Denominación</label>
      <input id="v_den" placeholder="Ej: Camión Hino 2023" />
    </div>
  `;
  const footer = `<button class="btn btn--primary" id="v_save">Agregar</button>`;
  openModal("Agregar unidad móvil", body, footer);

  $("#v_save").addEventListener("click", () => {
    const id = $("#v_id").value.trim();
    const den = $("#v_den").value.trim();
    if (!id || !den) {
      alert("Equipo y denominación son obligatorios.");
      return;
    }
    if (state.data.vehicles.some(x => x.id === id)) {
      alert("Ese equipo ya existe.");
      return;
    }
    state.data.vehicles.push({id, denominacion: den});
    saveData(state.data);
    closeModal();
    render();
  });
}

function openEditVehicleModal(id) {
  const v = state.data.vehicles.find(x => x.id === id);
  if (!v) return;

  const body = `
    <div class="field">
      <label>Equipo</label>
      <input value="${escapeAttr(v.id)}" disabled />
    </div>
    <div class="field">
      <label>Denominación</label>
      <input id="v_den" value="${escapeAttr(v.denominacion)}" />
    </div>
  `;
  const footer = `<button class="btn btn--primary" id="v_save">Guardar</button>`;
  openModal("Editar unidad móvil", body, footer);

  $("#v_save").addEventListener("click", () => {
    v.denominacion = $("#v_den").value.trim() || v.denominacion;
    saveData(state.data);
    closeModal();
    render();
  });
}

// ----------------- Actions: Tasks -----------------
function openAddTaskModal() {
  const peopleOptions = `<option value="">(Selecciona)</option>` + state.data.staff
    .slice().sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .map(s => `<option value="${escapeAttr(s.ficha)}">${escapeHtml(s.nombre)} (${escapeHtml(s.ficha)})</option>`)
    .join("");

  const vehiclesOptions = `<option value="">(Sin unidad)</option>` + state.data.vehicles
    .slice().sort((a,b)=>a.id.localeCompare(b.id))
    .map(v => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.id)} · ${escapeHtml(v.denominacion)}</option>`)
    .join("");

  const body = `
    <div class="field">
      <label>Título</label>
      <input id="t_titulo" placeholder="Ej: Revisar frenos" />
    </div>
    <div class="field">
      <label>Detalle / Observaciones</label>
      <textarea id="t_detalle" placeholder="Describe la tarea…"></textarea>
    </div>
    <div class="field">
      <label>Asignar a</label>
      <select id="t_persona">${peopleOptions}</select>
    </div>
    <div class="field">
      <label>Unidad móvil</label>
      <select id="t_vehiculo">${vehiclesOptions}</select>
    </div>
    <div class="field">
      <label>Turno</label>
      <select id="t_turno">
        <option value="dia">Día</option>
        <option value="noche">Noche</option>
      </select>
    </div>
    <div class="field">
      <label>Fecha límite (opcional)</label>
      <input id="t_limite" type="date" />
    </div>
  `;
  const footer = `<button class="btn btn--primary" id="t_save">Crear</button>`;
  openModal("Nueva tarea", body, footer);

  // defaults from filters
  if (state.taskFilterPerson) $("#t_persona").value = state.taskFilterPerson;
  if (state.taskFilterVehicle) $("#t_vehiculo").value = state.taskFilterVehicle;

  $("#t_save").addEventListener("click", () => {
    const titulo = $("#t_titulo").value.trim();
    const asignadoFicha = $("#t_persona").value;
    if (!titulo) {
      alert("El título es obligatorio.");
      return;
    }
    if (!asignadoFicha) {
      alert("Selecciona a quién asignar la tarea.");
      return;
    }

    state.data.tasks.push({
      id: uid("task"),
      titulo,
      detalle: $("#t_detalle").value.trim(),
      asignadoFicha,
      vehiculoId: $("#t_vehiculo").value || "",
      turno: $("#t_turno").value,
      fecha_limite: $("#t_limite").value || "",
      completada: false,
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    saveData(state.data);
    closeModal();
    render();
  });
}

function openEditTaskModal(taskId) {
  const t = state.data.tasks.find(x => x.id === taskId);
  if (!t) return;

  const peopleOptions = `<option value="">(Selecciona)</option>` + state.data.staff
    .slice().sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .map(s => `<option value="${escapeAttr(s.ficha)}">${escapeHtml(s.nombre)} (${escapeHtml(s.ficha)})</option>`)
    .join("");

  const vehiclesOptions = `<option value="">(Sin unidad)</option>` + state.data.vehicles
    .slice().sort((a,b)=>a.id.localeCompare(b.id))
    .map(v => `<option value="${escapeAttr(v.id)}">${escapeHtml(v.id)} · ${escapeHtml(v.denominacion)}</option>`)
    .join("");

  const body = `
    <div class="field">
      <label>Título</label>
      <input id="t_titulo" value="${escapeAttr(t.titulo)}" />
    </div>
    <div class="field">
      <label>Detalle / Observaciones</label>
      <textarea id="t_detalle">${escapeHtml(t.detalle || "")}</textarea>
    </div>
    <div class="field">
      <label>Asignar a</label>
      <select id="t_persona">${peopleOptions}</select>
    </div>
    <div class="field">
      <label>Unidad móvil</label>
      <select id="t_vehiculo">${vehiclesOptions}</select>
    </div>
    <div class="field">
      <label>Turno</label>
      <select id="t_turno">
        <option value="dia">Día</option>
        <option value="noche">Noche</option>
      </select>
    </div>
    <div class="field">
      <label>Fecha límite (opcional)</label>
      <input id="t_limite" type="date" />
    </div>
    <div class="small">Estado actual: <b>${t.completada ? "Cerrada" : "Abierta"}</b></div>
  `;
  const footer = `<button class="btn btn--primary" id="t_save">Guardar</button>`;
  openModal("Editar tarea", body, footer);

  $("#t_persona").value = t.asignadoFicha || "";
  $("#t_vehiculo").value = t.vehiculoId || "";
  $("#t_turno").value = t.turno || "dia";
  $("#t_limite").value = t.fecha_limite || "";

  $("#t_save").addEventListener("click", () => {
    const titulo = $("#t_titulo").value.trim();
    const asignadoFicha = $("#t_persona").value;
    if (!titulo) {
      alert("El título es obligatorio.");
      return;
    }
    if (!asignadoFicha) {
      alert("Selecciona a quién asignar la tarea.");
      return;
    }
    t.titulo = titulo;
    t.detalle = $("#t_detalle").value.trim();
    t.asignadoFicha = asignadoFicha;
    t.vehiculoId = $("#t_vehiculo").value || "";
    t.turno = $("#t_turno").value;
    t.fecha_limite = $("#t_limite").value || "";
    t.updated_at = nowISO();
    saveData(state.data);
    closeModal();
    render();
  });
}

function toggleTask(taskId) {
  const t = state.data.tasks.find(x => x.id === taskId);
  if (!t) return;
  t.completada = !t.completada;
  t.updated_at = nowISO();
  saveData(state.data);
  render();
}

// ----------------- Delete helpers -----------------
function deleteStaff(ficha) {
  const s = state.data.staff.find(x => x.ficha === ficha);
  if (!s) return;
  if (!confirm(`¿Borrar a ${s.nombre} (${s.ficha})?`)) return;

  // Desasignar tareas
  state.data.tasks.forEach(t => {
    if (t.asignadoFicha === ficha) t.asignadoFicha = "";
  });
  state.data.staff = state.data.staff.filter(x => x.ficha !== ficha);

  saveData(state.data);
  render();
}

function deleteVehicle(id) {
  const v = state.data.vehicles.find(x => x.id === id);
  if (!v) return;
  if (!confirm(`¿Borrar la unidad ${v.id}?`)) return;

  // Desasignar de personal y tareas
  state.data.staff.forEach(s => {
    if (s.vehiculoId === id) s.vehiculoId = "";
  });
  state.data.tasks.forEach(t => {
    if (t.vehiculoId === id) t.vehiculoId = "";
  });

  state.data.vehicles = state.data.vehicles.filter(x => x.id !== id);
  saveData(state.data);
  render();
}

function deleteTask(id) {
  const t = state.data.tasks.find(x => x.id === id);
  if (!t) return;
  if (!confirm("¿Borrar esta tarea?")) return;
  state.data.tasks = state.data.tasks.filter(x => x.id !== id);
  saveData(state.data);
  render();
}

// ----------------- Export / Import -----------------
function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ferti_mm_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importDataFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !parsed.staff || !parsed.vehicles || !parsed.tasks) {
        alert("Archivo inválido.");
        return;
      }
      state.data = parsed;
      saveData(state.data);
      render();
      alert("Importación completada.");
    } catch {
      alert("No se pudo leer el archivo.");
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("Esto borrará los datos guardados en este teléfono. ¿Continuar?")) return;
  state.data = structuredClone(DEFAULT_DATA);
  saveData(state.data);
  render();
}

// ----------------- Events -----------------
$("#searchStaff").addEventListener("input", (e) => {
  state.staffSearch = e.target.value;
  renderStaff();
});

function setShiftFilter(shift) {
  state.staffShiftFilter = shift;
  $$(".seg__btn").forEach(b => b.classList.toggle("is-active", b.dataset.shift === shift));
  renderStaff();
}
$("#shiftTodos").addEventListener("click", () => setShiftFilter("todos"));
$("#shiftDia").addEventListener("click", () => setShiftFilter("dia"));
$("#shiftNoche").addEventListener("click", () => setShiftFilter("noche"));

$("#btnAddStaff").addEventListener("click", openAddStaffModal);
$("#btnAddVehicle").addEventListener("click", openAddVehicleModal);
$("#btnAddTask").addEventListener("click", openAddTaskModal);

$("#taskFilterPerson").addEventListener("change", (e) => {
  state.taskFilterPerson = e.target.value;
  renderTasks();
});
$("#taskFilterVehicle").addEventListener("change", (e) => {
  state.taskFilterVehicle = e.target.value;
  renderTasks();
});
$("#taskFilterStatus").addEventListener("change", (e) => {
  state.taskFilterStatus = e.target.value;
  renderTasks();
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "editStaff") openEditStaffModal(btn.dataset.ficha);
  if (action === "delStaff") deleteStaff(btn.dataset.ficha);

  if (action === "editVehicle") openEditVehicleModal(btn.dataset.id);
  if (action === "delVehicle") deleteVehicle(btn.dataset.id);

  if (action === "editTask") openEditTaskModal(btn.dataset.id);
  if (action === "toggleTask") toggleTask(btn.dataset.id);
  if (action === "delTask") deleteTask(btn.dataset.id);
});

$("#btnExport").addEventListener("click", exportData);
$("#btnImport").addEventListener("click", () => $("#fileImport").click());
$("#fileImport").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) importDataFromFile(file);
  e.target.value = "";
});
$("#btnReset").addEventListener("click", resetData);

// Service worker (opcional)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

render();
