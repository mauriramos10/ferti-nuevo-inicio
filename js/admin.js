function makeId(prefix="id"){
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function askInt(msg, def=0){
  const raw = prompt(msg, String(def));
  if(raw === null) return null;
  const n = parseInt(raw, 10);
  if(Number.isNaN(n) || n < 0){
    alert("Debe ser un entero >= 0");
    return null;
  }
  return n;
}

function askSap(){
  const sap = prompt("Código SAP (solo números):");
  if(sap === null) return null;
  const s = sap.trim();
  if(!/^\d+$/.test(s)){
    alert("El código SAP debe contener solo números.");
    return null;
  }
  return s;
}

export function adminActions(ctx){
  const { getState, setState, render } = ctx;

  function cloneState(){
    const s = getState();
    return {
      ...s,
      data: JSON.parse(JSON.stringify(s.data)) // deep clone simple
    };
  }

  return {
    addEquipo(){
      const nombre = prompt("Nombre del equipo:");
      if(!nombre) return;
      const stock = askInt("Stock en taller:", 0);
      if(stock === null) return;

      const next = cloneState();
      next.data.equipos = next.data.equipos || [];
      next.data.equipos.push({
        id: makeId("eq"),
        nombre: nombre.trim(),
        stock_taller: stock,
        sistemas: []
      });

      setState(next);
      render();
    },

    editEquipo(equipoId){
      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;

      const nombre = prompt("Nuevo nombre del equipo:", eq.nombre);
      if(nombre === null) return;
      const stock = askInt("Nuevo stock en taller:", eq.stock_taller);
      if(stock === null) return;

      eq.nombre = nombre.trim();
      eq.stock_taller = stock;

      setState(next);
      render();
    },

    deleteEquipo(equipoId){
      if(!confirm("¿Eliminar este equipo?")) return;
      const next = cloneState();
      next.data.equipos = (next.data.equipos || []).filter(e=>e.id!==equipoId);
      // limpiar selección si apuntaba a este equipo
      if(next.selected?.equipoId === equipoId) next.selected = null;

      setState(next);
      render();
    },

    addSistema(equipoId){
      const nombre = prompt("Nombre del sistema:");
      if(!nombre) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      eq.sistemas = eq.sistemas || [];
      eq.sistemas.push({
        id: makeId("sis"),
        nombre: nombre.trim(),
        componentes: []
      });

      setState(next);
      render();
    },

    editSistema(equipoId, sistemaId){
      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;

      const nombre = prompt("Nuevo nombre del sistema:", sis.nombre);
      if(nombre === null) return;
      sis.nombre = nombre.trim();

      setState(next);
      render();
    },

    deleteSistema(equipoId, sistemaId){
      if(!confirm("¿Eliminar este sistema?")) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      eq.sistemas = (eq.sistemas || []).filter(s=>s.id!==sistemaId);

      if(next.selected?.type==="sistema" && next.selected?.sistemaId===sistemaId){
        next.selected = { type:"equipo", equipoId };
      }

      setState(next);
      render();
    },

    addComponente(equipoId, sistemaId){
      const codigo_sap = askSap();
      if(codigo_sap === null) return;
      const nombre = prompt("Nombre del componente:");
      if(!nombre) return;
      const stock = askInt("Stock (entero):", 0);
      if(stock === null) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;

      sis.componentes = sis.componentes || [];
      sis.componentes.push({
        id: makeId("comp"),
        codigo_sap,
        nombre: nombre.trim(),
        stock
      });

      setState(next);
      render();
    },

    editComponente(equipoId, sistemaId, compId){
      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;
      const comp = (sis.componentes || []).find(c=>c.id===compId);
      if(!comp) return;

      const codigo_sap = prompt("Código SAP (solo números):", comp.codigo_sap);
      if(codigo_sap === null) return;
      if(!/^\d+$/.test(codigo_sap.trim())){
        alert("SAP debe ser solo números.");
        return;
      }
      const nombre = prompt("Nombre:", comp.nombre);
      if(nombre === null) return;
      const stock = askInt("Stock (entero):", comp.stock);
      if(stock === null) return;

      comp.codigo_sap = codigo_sap.trim();
      comp.nombre = nombre.trim();
      comp.stock = stock;

      setState(next);
      render();
    },

    deleteComponente(equipoId, sistemaId, compId){
      if(!confirm("¿Eliminar este componente?")) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;
      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;

      sis.componentes = (sis.componentes || []).filter(c=>c.id!==compId);

      setState(next);
      render();
    }
  };
}
