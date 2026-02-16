function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

export function renderTree(data, openSet, selected){
  if(!data) return "";

  return (data.equipos || []).map(eq => {
    const eqKey = `eq:${eq.id}`;
    const eqOpen = openSet.has(eqKey);
    const eqSelected = selected?.type==="equipo" && selected?.equipoId===eq.id;

    const eqRow = `
      <div class="node ${eqSelected ? "selected":""}" data-kind="equipo" data-eqid="${esc(eq.id)}">
        <div class="twisty" data-twist="${esc(eqKey)}">${eqOpen ? "▼":"▶"}</div>
        <div>${esc(eq.nombre)}</div>
        <div class="badge">Taller: ${Number.isInteger(eq.stock_taller) ? eq.stock_taller : 0}</div>
      </div>
    `;

    const systems = eq.sistemas || [];
    const sysHtml = eqOpen ? `
      <div class="indent">
        ${systems.map(sis => {
          const sisKey = `sis:${eq.id}:${sis.id}`;
          const sisOpen = openSet.has(sisKey);
          const sisSelected = selected?.type==="sistema" && selected?.equipoId===eq.id && selected?.sistemaId===sis.id;
          const comps = sis.componentes || [];

          const sisRow = `
            <div class="node ${sisSelected ? "selected":""}" data-kind="sistema" data-eqid="${esc(eq.id)}" data-sid="${esc(sis.id)}">
              <div class="twisty" data-twist="${esc(sisKey)}">${sisOpen ? "▼":"▶"}</div>
              <div>${esc(sis.nombre)}</div>
              <div class="badge">Items: ${comps.length}</div>
            </div>
          `;

          const compHtml = sisOpen ? `
            <div class="indent">
              ${comps.map(c => `
                <div class="node" style="cursor:default">
                  <div class="twisty"></div>
                  <div>[${esc(c.codigo_sap)}] ${esc(c.nombre)}</div>
                  <div class="badge">Stock: ${Number.isInteger(c.stock) ? c.stock : 0}</div>
                </div>
              `).join("")}
            </div>
          ` : "";

          return sisRow + compHtml;
        }).join("")}
      </div>
    ` : "";

    return eqRow + sysHtml;
  }).join("");
}

export function bindTreeEvents(container, actions){
  // Reemplaza handler para evitar duplicados tras render()
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
      actions.setSelected({ type:"equipo", equipoId: node.getAttribute("data-eqid") });
    }
    if(kind === "sistema"){
      actions.setSelected({
        type:"sistema",
        equipoId: node.getAttribute("data-eqid"),
        sistemaId: node.getAttribute("data-sid")
      });
    }
  };
}
