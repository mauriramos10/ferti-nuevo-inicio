
import { renderTree, bindTreeEvents } from "./ui.js";
import { adminActions } from "./admin.js";

let state = {
  data: null,
  open: new Set(),
  selected: null,
  isAdmin: false
};

async function loadData(){
  const res = await fetch("./data/equipos.json");
  state.data = await res.json();
}

function render(){
  const tree = document.getElementById("tree");
  tree.innerHTML = renderTree(state.data, state.open, state.selected);
  bindTreeEvents(tree, {
    toggleOpen: (key)=>{
      if(state.open.has(key)) state.open.delete(key);
      else state.open.add(key);
      render();
    },
    setSelected: (sel)=>{
      state.selected = sel;
      render();
    }
  });

  const content = document.getElementById("content");
  content.innerHTML = "<h2>Selecciona un equipo</h2>";
}

async function main(){
  await loadData();
  render();
}

main();
