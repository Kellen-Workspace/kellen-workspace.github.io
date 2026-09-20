const treeRoot=window.SERPENT_TREE;
const photoManifest=window.SERPENT_PHOTOS||{};
const state={selected:null,photoIndex:0,expanded:new Set(["serpentes","alethinophidia","macrostomata","caenophidia","colubroidea"])};
const nodeMap=new Map(),parentMap=new Map();
const el=id=>document.getElementById(id);

function indexTree(node,parent=null){nodeMap.set(node.id,node);if(parent)parentMap.set(node.id,parent.id);(node.children||[]).forEach(child=>indexTree(child,node))}
indexTree(treeRoot);

function renderNode(node){
  const hasChildren=node.children?.length>0,expanded=state.expanded.has(node.id);
  return `<li><div class="tree-row"><button class="tree-toggle ${hasChildren?"":"empty"}" data-toggle="${node.id}" aria-label="${expanded?"折叠":"展开"}">${expanded?"▼":"▶"}</button><button class="tree-node type-${node.type||"clade"} ${state.selected===node.id?"selected":""}" data-node="${node.id}"><i class="node-dot"></i><span class="node-text">${node.name}<small class="node-latin">${node.latin||""}</small></span></button></div>${hasChildren?`<ul class="tree-children ${expanded?"":"collapsed"}">${node.children.map(renderNode).join("")}</ul>`:""}</li>`;
}

function renderTree(){el("tree").innerHTML=`<ul>${renderNode(treeRoot)}</ul>`}

function lineageFor(id){const path=[];let current=id;while(current){path.unshift(nodeMap.get(current));current=parentMap.get(current)}return path}

function selectNode(id){state.selected=id;state.photoIndex=0;let current=id;while(current){state.expanded.add(current);current=parentMap.get(current)}renderTree();renderDetail()}

function renderDetail(){
  const node=nodeMap.get(state.selected);if(!node)return;
  el("taxon-rank").textContent=node.rank||"演化节点";el("taxon-name").textContent=node.name;el("taxon-latin").textContent=node.latin||"";el("taxon-status").textContent=node.status||"";el("taxon-note").textContent=node.note||"等待补充节点说明。";
  el("lineage-path").innerHTML=lineageFor(node.id).map(item=>`<span class="lineage-chip">${item.name}</span>`).join("");el("lineage-path").className="lineage-path";el("folder-path").textContent=`taxa/${node.id}/photos/`;
  renderGallery(node.id);
}

function renderGallery(id){
  const photos=photoManifest[id]||[];el("photo-count").textContent=`${photos.length} 张`;el("gallery-empty").hidden=photos.length>0;el("gallery").hidden=photos.length===0;if(!photos.length)return;
  state.photoIndex=Math.max(0,Math.min(state.photoIndex,photos.length-1));
  el("photo-stage").innerHTML=photos.map((photo,index)=>{const delta=index-state.photoIndex,limited=Math.max(-2,Math.min(2,delta)),distance=Math.abs(delta),x=limited*48-50,scale=distance===0?1:.78,z=10-distance,opacity=distance>2?0:.48,blur=distance===0?0:3;return `<figure class="photo-card ${distance===0?"active":""}" style="z-index:${z};opacity:${opacity};filter:blur(${blur}px);transform:translate(${x}%,-50%) scale(${scale}) rotateY(${limited*-5}deg)" data-photo="${index}"><img src="${photo.src}" alt="${photo.alt||photo.title||nodeMap.get(id).name}" loading="${distance===0?"eager":"lazy"}"></figure>`}).join("");
  const current=photos[state.photoIndex];el("photo-title").textContent=current.title||nodeMap.get(id).name;el("photo-progress").textContent=`${state.photoIndex+1} / ${photos.length}`;el("photo-prev").disabled=state.photoIndex===0;el("photo-next").disabled=state.photoIndex===photos.length-1;
}

function movePhoto(step){const photos=photoManifest[state.selected]||[];const next=state.photoIndex+step;if(next>=0&&next<photos.length){state.photoIndex=next;renderGallery(state.selected)}}

el("tree").addEventListener("click",event=>{const toggle=event.target.closest("[data-toggle]"),node=event.target.closest("[data-node]");if(toggle){const id=toggle.dataset.toggle;state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);renderTree()}else if(node)selectNode(node.dataset.node)});
el("expand-all").addEventListener("click",()=>{const allExpanded=[...nodeMap.values()].filter(node=>node.children?.length).every(node=>state.expanded.has(node.id));state.expanded=allExpanded?new Set(["serpentes"]):new Set([...nodeMap.values()].filter(node=>node.children?.length).map(node=>node.id));el("expand-all").textContent=allExpanded?"全部展开":"收起分支";renderTree()});
el("photo-prev").addEventListener("click",()=>movePhoto(-1));el("photo-next").addEventListener("click",()=>movePhoto(1));el("photo-stage").addEventListener("click",event=>{const card=event.target.closest("[data-photo]");if(card){state.photoIndex=Number(card.dataset.photo);renderGallery(state.selected)}});
document.addEventListener("keydown",event=>{if(event.key==="ArrowLeft")movePhoto(-1);if(event.key==="ArrowRight")movePhoto(1)});
el("year").textContent=new Date().getFullYear();renderTree();selectNode("serpentes");
