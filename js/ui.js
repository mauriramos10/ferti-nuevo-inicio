function esc(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

export function renderTree(data, openSet){
  if(!data) return "";

  return data.equipos.map(eq => {
    const eqKey = `eq:${eq.id}`;
    const eqOpen = openSet.has(eqKey);

    const eqRow = `
      <div class="node">
        <div class="twisty" data-twist="${esc(eqKey)}">${eqOpen ? "▼":"▶"}</div>
        <div>${esc(eq.nombre)}</div>
        <div class="badge">Taller: ${eq.stock_taller}</div>
      </div>
    `;

    const systems = eq.sistemas || [];
    const sysHtml = eqOpen ? `
      <div class="indent">
        ${systems.map(sis => `
            <div class="node">
              <div class="twisty"></div>
              <div>${esc(sis.nombre)}</div>
            </div>
        `).join("")}
      </div>
    ` : "";

    return eqRow + sysHtml;
  }).join("");
}

export function bindTreeEvents(container, actions){
  container.addEventListener("click", (e)=>{
    const twist = e.target.closest("[data-twist]");
    if(twist){
      actions.toggleOpen(twist.getAttribute("data-twist"));
    }
  });
}
