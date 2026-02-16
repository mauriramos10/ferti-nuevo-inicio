import { renderTree, bindTreeEvents } from "./ui.js";
import { adminActions, saveNow, API_URL } from "./admin.js";

const FALLBACK_LOCAL = "./data/equipos.json";

let state = {
  data: null,
  open: new Set(),
  selected: null,   // {type:"equipo"|"sistema", equipoId, sistemaId}
  isAdmin: false,
  dirty: false
};

function showFatal(err){
  const content = document.getElementById("content");
  if(content){
    content.innerHTML = `
      <h2>❌ Error cargando la app</h2>
      <pre style="white-space:pre-wrap;background:#fff;padding:12px;border-radius:12px;border:1px solid #e6ebf2;">${String(err?.stack || err)}</pre>
      <p>Abre F12 → Console para ver más detalles.</p>
    `;
  }
  console.error(err);
}

async function fetchJson(url){
  const res = await fetch(url, { cache:"no-store" });
  if(!res.ok) throw new Error(`HTTP ${res.status} al pedir: ${url}`);
  return await res.json();
}

async function loadData() {
  // 1) intenta Worker
  try {
    state.data = await fetchJson(API_URL);
    return;
  } catch (e) {
    console.warn("Falló Worker, intento local:", e);
  }
  // 2) fallback local
  state.data = await fetchJson(FALLBACK_LOCAL);
}

function setSelected(sel) {
  state.selected = sel;
  render();
}

function toggleOpen(key) {
  if (state.open.has(key)) state.open.delete(key);
  else state.open.add(key);
  render();
}

function findEquipo(equipoId){
  return (state.data?.equipos || []).find(e => e.id === equipoId);
}
function findSistema(equipoId, sistemaId){
  const eq = findEquipo(equipoId);
  if(!eq) return null;
  return (eq.sistemas || []).find(s => s.id === sistemaId);
}

function renderSaveBar(){
  if(!state.isAdmin) return "";
  const label = state.dirty ? "💾 Guardar cambios" : "✅ Sin cambios";
  const disabled = state.dirty ? "" : "disabled";
  return `
    <div style="display:flex;gap:10px;align-items:center;margin:10px 0;">
      <button id="btnSave" ${disabled}>${label}</button>
      ${state.dirty ? `<span style="color:#b45309;font-weight:700;">Cambios pendientes…</span>` : ``}
    </div>
  `;
}

async function handleSave(){
  const r = await saveNow(state.data);
  if(r.ok){
    state.dirty = false;
    alert("✅ Guardado");
    render();
    return;
  }
  if(r.error !== "cancelled"){
    alert("❌ No se pudo guardar.\n" + (r.detail || r.error));
  }
}

function wireSaveButton(){
  if(!state.isAdmin) return;
  const btn = document.getElementById("btnSave");
  if(!btn) return;
  btn.onclick = () => handleSave().catch(err => {
    alert("❌ Error guardando: " + (err?.message || err));
    console.error(err);
  });
}

function renderRightPanel() {
  const content = document.getElementById("content");
  const breadcrumb = document.getElementById("breadcrumb");

  const actions = adminActions({
    getState: ()=>state,
    setState: (next)=>{ state = next; },
    render,
    markDirty: (v)=>{ state.dirty = v; }
  });

  if (!state.selected) {
    if(breadcrumb) breadcrumb.textContent = "Equipos";
    if(content){
      content.innerHTML = `
        ${renderSaveBar()}
        <h2>Equipos</h2>
        <p>Selecciona un equipo o un sistema en el panel izquierdo.</p>
        ${state.isAdmin ? `<button id="btnAddEquipo">+ Agregar equipo</button>` : ``}
      `;
      wireSaveButton();
      if(state.isAdmin){
        document.getElementById("btnAddEquipo")?.addEventListener("click", actions.addEquipo);
      }
    }
    return;
  }

  const { type, equipoId, sistemaId } = state.selected;
  const eq = findEquipo(equipoId);

  if (type === "equipo") {
    if(breadcrumb) breadcrumb.textContent = `Equipos / ${eq?.nombre ?? ""}`;
    if(content){
      content.innerHTML = `
        ${renderSaveBar()}
        <h2>${eq?.nombre ?? ""}</h2>
        <p><b>Stock en taller:</b> ${Number.isInteger(eq?.stock_taller) ? eq.stock_taller : 0}</p>

        ${state.isAdmin ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button id="btnAddEquipo">+ Agregar equipo</button>
            <button id="btnEditEquipo">✏ Editar equipo</button>
            <button id="btnDelEquipo">🗑 Eliminar equipo</button>
            <button id="btnAddSistema">+ Agregar sistema</button>
          </div>
        ` : `<p>Selecciona un sistema para ver componentes.</p>`}
      `;
      wireSaveButton();
      if(state.isAdmin){
        document.getElementById("btnAddEquipo")?.addEventListener("click", actions.addEquipo);
        document.getElementById("btnEditEquipo")?.addEventListener("click", ()=>actions.editEquipo(equipoId));
        document.getElementById("btnDelEquipo")?.addEventListener("click", ()=>actions.deleteEquipo(equipoId));
        document.getElementById("btnAddSistema")?.addEventListener("click", ()=>actions.addSistema(equipoId));
      }
    }
    return;
  }

  const sis = findSistema(equipoId, sistemaId);
  if(breadcrumb) breadcrumb.textContent = `Equipos / ${eq?.nombre ?? ""} / ${sis?.nombre ?? ""}`;

  const rows = sis?.componentes || [];
  const table = `
    <table class="table">
      <thead>
        <tr>
          <th>Código SAP</th>
          <th>Nombre</th>
          <th>Stock</th>
          ${state.isAdmin ? `<th>Acciones</th>` : ``}
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.codigo_sap ?? ""}</td>
            <td>${r.nombre ?? ""}</td>
            <td>${Number.isInteger(r.stock) ? r.stock : ""}</td>
            ${state.isAdmin ? `
              <td>
                <button data-edit="${r.id}">✏</button>
                <button data-del="${r.id}">🗑</button>
              </td>
            ` : ``}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  if(content){
    content.innerHTML = `
      ${renderSaveBar()}
      <h2>${sis?.nombre ?? ""}</h2>

      ${state.isAdmin ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
          <button id="btnEditSistema">✏ Editar sistema</button>
          <button id="btnDelSistema">🗑 Eliminar sistema</button>
          <button id="btnAddComp">+ Agregar componente</button>
        </div>
      ` : ``}

      ${rows.length ? table : "<p>No hay componentes aún.</p>"}
    `;
    wireSaveButton();

    if(state.isAdmin){
      document.getElementById("btnEditSistema")?.addEventListener("click", ()=>actions.editSistema(equipoId, sistemaId));
      document.getElementById("btnDelSistema")?.addEventListener("click", ()=>actions.deleteSistema(equipoId, sistemaId));
      document.getElementById("btnAddComp")?.addEventListener("click", ()=>actions.addComponente(equipoId, sistemaId));

      document.querySelectorAll("[data-edit]").forEach(b=>{
        b.addEventListener("click", ()=>actions.editComponente(equipoId, sistemaId, b.getAttribute("data-edit")));
      });
      document.querySelectorAll("[data-del]").forEach(b=>{
        b.addEventListener("click", ()=>actions.deleteComponente(equipoId, sistemaId, b.getAttribute("data-del")));
      });
    }
  }
}

function render() {
  const tree = document.getElementById("tree");
  if(tree){
    tree.innerHTML = renderTree(state.data, state.open, state.selected);
    bindTreeEvents(tree, { toggleOpen, setSelected });
  }
  renderRightPanel();
}

function setupAdminButton(){
  const btn = document.getElementById("adminBtn") || document.querySelector(".admin-btn");
  if(!btn) return;

  btn.onclick = () => {
    const pass = prompt("Contraseña Admin (para entrar al modo admin):");
    if(pass === null) return;

    if(pass.trim() === "1234"){
      state.isAdmin = true;
      alert("Modo Admin ACTIVADO");
      render();
    }else{
      alert("Contraseña incorrecta");
    }
  };
}

async function main() {
  setupAdminButton();
  await loadData();

  const first = state.data?.equipos?.[0];
  if (first) state.open.add(`eq:${first.id}`);

  render();
}

main().catch(showFatal);
