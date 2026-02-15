// =======================
// CONFIG
// =======================
const API_URL = "https://throbbing-mouse-337ferti-backend.mauriramos10.workers.dev";

// Guardamos la contraseña en memoria (solo en esta sesión del navegador)
let ADMIN_PASS_CACHE = "";

// =======================
// HELPERS
// =======================
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

function askSap(def=""){
  const sap = prompt("Código SAP (solo números):", def);
  if(sap === null) return null;
  const s = sap.trim();
  if(!/^\d+$/.test(s)){
    alert("El código SAP debe contener solo números.");
    return null;
  }
  return s;
}

function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

async function saveToServer(data){
  // Pide contraseña si no hay cache
  if(!ADMIN_PASS_CACHE){
    const pass = prompt("Contraseña Admin (para guardar en GitHub):");
    if(pass === null) return false;
    ADMIN_PASS_CACHE = pass.trim();
    if(!ADMIN_PASS_CACHE) return false;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      admin_password: ADMIN_PASS_CACHE,
      data
    })
  });

  if(!res.ok){
    // si falla, limpiamos cache para que vuelva a pedirla
    ADMIN_PASS_CACHE = "";
    let detail = "";
    try { detail = await res.text(); } catch {}
    alert("❌ Error guardando en GitHub.\n\n" + detail);
    return false;
  }

  return true;
}

// =======================
// MAIN EXPORT
// =======================
export function adminActions(ctx){
  const { getState, setState, render } = ctx;

  function cloneState(){
    const s = getState();
    return { ...s, data: deepClone(s.data) };
  }

  return {
    // -----------------------
    // EQUIPOS
    // -----------------------
    async addEquipo(){
      const nombre = prompt("Nombre del equipo:");
      if(!nombre) return;

      const stock = askInt("Stock en taller:", 0);
      if(stock === null) return;

      const next = cloneState();
      next.data.equipos = next.data.equipos || [];

      const newEq = {
        id: makeId("eq"),
        nombre: nombre.trim(),
        stock_taller: stock,
        sistemas: []
      };

      next.data.equipos.push(newEq);

      // abrir el nodo del nuevo equipo en el árbol
      next.open = new Set(next.open || []);
      next.open.add(`eq:${newEq.id}`);

      // seleccionar el nuevo equipo
      next.selected = { type:"equipo", equipoId: newEq.id };

      setState(next);
      render();

      await saveToServer(next.data);
    },

    async editEquipo(equipoId){
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

      await saveToServer(next.data);
    },

    async deleteEquipo(equipoId){
      if(!confirm("¿Eliminar este equipo?")) return;

      const next = cloneState();
      next.data.equipos = (next.data.equipos || []).filter(e=>e.id!==equipoId);

      // limpiar selección si apuntaba a ese equipo
      if(next.selected?.equipoId === equipoId) next.selected = null;

      // limpiar expansión
      next.open = new Set(next.open || []);
      next.open.delete(`eq:${equipoId}`);

      setState(next);
      render();

      await saveToServer(next.data);
    },

    // -----------------------
    // SISTEMAS
    // -----------------------
    async addSistema(equipoId){
      const nombre = prompt("Nombre del sistema:");
      if(!nombre) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;

      eq.sistemas = eq.sistemas || [];
      const newSis = {
        id: makeId("sis"),
        nombre: nombre.trim(),
        componentes: []
      };
      eq.sistemas.push(newSis);

      // abrir el sistema y dejar seleccionado
      next.open = new Set(next.open || []);
      next.open.add(`eq:${equipoId}`);
      next.open.add(`sis:${equipoId}:${newSis.id}`);
      next.selected = { type:"sistema", equipoId, sistemaId: newSis.id };

      setState(next);
      render();

      await saveToServer(next.data);
    },

    async editSistema(equipoId, sistemaId){
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

      await saveToServer(next.data);
    },

    async deleteSistema(equipoId, sistemaId){
      if(!confirm("¿Eliminar este sistema?")) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;

      eq.sistemas = (eq.sistemas || []).filter(s=>s.id!==sistemaId);

      // ajustar selección
      if(next.selected?.type==="sistema" && next.selected?.sistemaId===sistemaId){
        next.selected = { type:"equipo", equipoId };
      }

      // limpiar expansión del sistema
      next.open = new Set(next.open || []);
      next.open.delete(`sis:${equipoId}:${sistemaId}`);

      setState(next);
      render();

      await saveToServer(next.data);
    },

    // -----------------------
    // COMPONENTES
    // -----------------------
    async addComponente(equipoId, sistemaId){
      const codigo_sap = askSap("");
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

      // asegurar que esté abierto el árbol
      next.open = new Set(next.open || []);
      next.open.add(`eq:${equipoId}`);
      next.open.add(`sis:${equipoId}:${sistemaId}`);

      setState(next);
      render();

      await saveToServer(next.data);
    },

    async editComponente(equipoId, sistemaId, compId){
      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;

      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;

      const comp = (sis.componentes || []).find(c=>c.id===compId);
      if(!comp) return;

      const codigo_sap = askSap(comp.codigo_sap);
      if(codigo_sap === null) return;

      const nombre = prompt("Nombre:", comp.nombre);
      if(nombre === null) return;

      const stock = askInt("Stock (entero):", comp.stock);
      if(stock === null) return;

      comp.codigo_sap = codigo_sap;
      comp.nombre = nombre.trim();
      comp.stock = stock;

      setState(next);
      render();

      await saveToServer(next.data);
    },

    async deleteComponente(equipoId, sistemaId, compId){
      if(!confirm("¿Eliminar este componente?")) return;

      const next = cloneState();
      const eq = (next.data.equipos || []).find(e=>e.id===equipoId);
      if(!eq) return;

      const sis = (eq.sistemas || []).find(s=>s.id===sistemaId);
      if(!sis) return;

      sis.componentes = (sis.componentes || []).filter(c=>c.id!==compId);

      setState(next);
      render();

      await saveToServer(next.data);
    }
  };
}
