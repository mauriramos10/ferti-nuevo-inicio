import { renderTree, bindTreeEvents } from "./ui.js";
import { adminActions } from "./admin.js";

let state = {
  data: null,
  open: new Set(),
  selected: null,   // {type: "equipo"|"sistema", equipoId, sistemaId}
  isAdmin: false
};

// ✅ IMPORTANTE: ruta correcta para GitHub Pages
const API_URL = "https://throbbing-mouse-337ferti-backend.mauriramos10.workers.dev";

async function loadData() {
  const res = await fetch(API_URL, { cache: "no-store" });
  state.data = await res.json();
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
  return (state.data.equipos || []).find(e => e.id === equipoId);
}
function findSistema(equipoId, sistemaId){
  const eq = findEquipo(equipoId);
  if(!eq) return null;
  return (eq.sistemas || []).find(s => s.id === sistemaId);
}

function renderRightPanel() {
  const content = document.getElementById("content");
  const breadcrumb = document.getElementById("breadcrumb");

  const actions = adminActions({
    getState: ()=>state,
    setState: (next)=>{ state = next; },
    render
  });

  // Vista por defecto (sin selección)
  if (!state.selected) {
    breadcrumb.textContent = "Equipos";
    content.innerHTML = `
      <h2>Equipos</h2>
      <p>Selecciona un equipo o un sistema en el panel izquierdo.</p>
      ${state.isAdmin ? `<button id="btnAddEquipo">+ Agregar equipo</button>` : ``}
    `;
    if(state.isAdmin){
      document.getElementById("btnAddEquipo")?.addEventListener("click", actions.addEquipo);
    }
    return;
  }

  const { type, equipoId, sistemaId } = state.selected;
  const eq = findEquipo(equipoId);

  // Vista de EQUIPO
  if (type === "equipo") {
    breadcrumb.textContent = `Equipos / ${eq?.nombre ?? ""}`;
    content.innerHTML = `
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

    if(state.isAdmin){
      document.getElementById("btnAddEquipo")?.addEventListener("click", actions.addEquipo);
      document.getElementById("btnEditEquipo")?.addEventListener("click", ()=>actions.editEquipo(equipoId));
      document.getElementById("btnDelEquipo")?.addEventListener("click", ()=>actions.deleteEquipo(equipoId));
      document.getElementById("btnAddSistema")?.addEventListener("click", ()=>actions.addSistema(equipoId));
    }
    return;
  }

  // Vista de SISTEMA
  const sis = findSistema(equipoId, sistemaId);
  breadcrumb.textContent = `Equipos / ${eq?.nombre ?? ""} / ${sis?.nombre ?? ""}`;

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

  content.innerHTML = `
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

  if(state.isAdmin){
    document.getElementById("btnEditSistema")?.addEventListener("click", ()=>actions.editSistema(equipoId, sistemaId));
    document.getElementById("btnDelSistema")?.addEventListener("click", ()=>actions.deleteSistema(equipoId, sistemaId));
    document.getElementById("btnAddComp")?.addEventListener("click", ()=>actions.addComponente(equipoId, sistemaId));

    // Acciones por fila
    document.querySelectorAll("[data-edit]").forEach(b=>{
      b.addEventListener("click", ()=>actions.editComponente(equipoId, sistemaId, b.getAttribute("data-edit")));
    });
    document.querySelectorAll("[data-del]").forEach(b=>{
      b.addEventListener("click", ()=>actions.deleteComponente(equipoId, sistemaId, b.getAttribute("data-del")));
    });
  }
}

function render() {
  const tree = document.getElementById("tree");
  tree.innerHTML = renderTree(state.data, state.open, state.selected);
  bindTreeEvents(tree, { toggleOpen, setSelected });
  renderRightPanel();
}

function setupAdminButton(){
  const btn = document.querySelector(".admin-btn");
  btn.addEventListener("click", ()=>{
    const pass = prompt("Contraseña Admin:");
    if(pass === null) return;

    if(pass.trim() === "1234"){
      state.isAdmin = true;
      alert("Modo Admin ACTIVADO (fase A: en memoria)");
      render();
    }else{
      alert("Contraseña incorrecta");
    }
  });
}

async function main() {
  await loadData();
  const first = state.data.equipos?.[0];
  if (first) state.open.add(`eq:${first.id}`);
  setupAdminButton();
  render();
}

main();
