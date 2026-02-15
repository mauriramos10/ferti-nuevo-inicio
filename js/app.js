import { renderTree, bindTreeEvents } from "./ui.js";

let state = {
  data: null,
  open: new Set()
};

async function loadData() {
  const res = await fetch("../data/equipos.json", { cache: "no-store" });
  state.data = await res.json();
}

function toggleOpen(key) {
  if (state.open.has(key)) state.open.delete(key);
  else state.open.add(key);
  render();
}

function render() {
  const tree = document.getElementById("tree");
  tree.innerHTML = renderTree(state.data, state.open);
  bindTreeEvents(tree, { toggleOpen });
}

async function main() {
  await loadData();
  render();
}

main();
