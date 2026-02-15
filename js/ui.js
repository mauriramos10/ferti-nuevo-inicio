
function esc(s){
  return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

export function renderTree(data, openSet, selected){
  if(!data) return "";
  return (data.equipos || []).map(eq => {
    const eqKey = `eq:${eq.id}`;
    const eqOpen = openSet.has(eqKey);
    const eqSelected = selected?.equipoId === eq.id;

    return `
      <div class="node ${eqSelected ? "selected":""}" data-kind="equipo" data-eqid="${esc(eq.id)}">
        <div data-twist="${esc(eqKey)}">${eqOpen ? "▼":"▶"}</div>
        <div>${esc(eq.nombre)}</div>
      </div>
      ${eqOpen ? `<div class="indent">${(eq.sistemas||[]).map(sis => `
        <div class="node" data-kind="sistema" data-eqid="${esc(eq.id)}" data-sid="${esc(sis.id)}">
          <div>${esc(sis.nombre)}</div>
        </div>
      `).join("")}</div>` : ""}
    `;
  }).join("");
}

export function bindTreeEvents(container, actions){
  container.onclick = (e) => {
    const twist = e.target.closest("[data-twist]");
    if(twist){
      actions.toggleOpen(twist.getAttribute("data-twist"));
      return;
    }
    const node = e.target.closest(".node");
    if(!node) return;
    const kind = node.getAttribute("data-kind");
    if(kind === "equipo"){
      actions.setSelected({ equipoId: node.getAttribute("data-eqid") });
    }
  };
}
