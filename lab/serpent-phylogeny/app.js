const treeRoot=window.SERPENT_TREE;
const photoManifest=window.SERPENT_PHOTOS||{};
const speciesData=window.SERPENT_SPECIES||{};
const logManifest=window.SERPENT_LOGS||{};
const state={selected:null,photoIndex:0,mediaView:"gallery",expanded:new Set(["serpentes","alethinophidia","macrostomata","caenophidia","colubroidea"]),compareA:null,compareB:null,lca:null};
const nodeMap=new Map(),parentMap=new Map();
const el=id=>document.getElementById(id);

function indexTree(node,parent=null){nodeMap.set(node.id,node);if(parent)parentMap.set(node.id,parent.id);(node.children||[]).forEach(child=>indexTree(child,node))}
indexTree(treeRoot);

function lineageFor(id){const path=[];let current=id;while(current){path.unshift(nodeMap.get(current));current=parentMap.get(current)}return path}
function idSetFor(id){return new Set(id?lineageFor(id).map(item=>item.id):[])}

function renderNode(node){
  const hasChildren=node.children?.length>0,expanded=state.expanded.has(node.id);
  const selectedPath=idSetFor(state.selected),pathA=idSetFor(state.compareA),pathB=idSetFor(state.compareB);
  const classes=[node.type==="debated"?"debated-edge":"",selectedPath.has(node.id)?"path-edge":"",pathA.has(node.id)?"compare-a-edge":"",pathB.has(node.id)?"compare-b-edge":""].filter(Boolean).join(" ");
  const nodeClasses=[`type-${node.type||"clade"}`,state.selected===node.id?"selected":"",selectedPath.has(node.id)?"path-active":"",pathA.has(node.id)?"compare-a":"",pathB.has(node.id)?"compare-b":"",state.lca===node.id?"common-ancestor":""].filter(Boolean).join(" ");
  const children=node.children||[];
  const activeTrunk=children.some(child=>selectedPath.has(child.id));
  const compareATrunk=children.some(child=>pathA.has(child.id));
  const compareBTrunk=children.some(child=>pathB.has(child.id));
  const disputedTrunk=node.type==="debated";
  return `<li class="${classes}"><div class="tree-row"><button class="tree-toggle ${hasChildren?"":"empty"}" data-toggle="${node.id}" aria-label="${expanded?"折叠":"展开"}">${expanded?"▼":"▶"}</button><button class="tree-node ${nodeClasses}" data-node="${node.id}"><i class="node-dot"></i><span class="node-text">${node.name}<small class="node-latin">${node.latin||""}</small></span></button></div>${hasChildren?`<ul class="tree-children ${expanded?"":"collapsed"} ${activeTrunk?"path-trunk":""} ${compareATrunk?"compare-a-trunk":""} ${compareBTrunk?"compare-b-trunk":""} ${disputedTrunk?"debated-trunk":""}">${children.map(renderNode).join("")}</ul>`:""}</li>`;
}

function renderTree(){el("tree").innerHTML=`<ul>${renderNode(treeRoot)}</ul>`}

function selectNode(id){
  state.selected=id;state.photoIndex=0;
  let current=id;while(current){state.expanded.add(current);current=parentMap.get(current)}
  renderTree();renderDetail();
}

function renderDetail(){
  const node=nodeMap.get(state.selected);if(!node)return;
  const profile=speciesData[node.id];
  el("taxon-rank").textContent=node.rank||"演化节点";el("taxon-name").textContent=node.name;el("taxon-latin").textContent=node.latin||"";el("taxon-status").textContent=node.status||"";el("taxon-note").textContent=profile?.summary||node.note||"等待补充节点说明。";
  el("lineage-path").innerHTML=lineageFor(node.id).map(item=>`<button class="lineage-chip" data-node="${item.id}">${item.name}</button>`).join("");el("folder-path").textContent=`taxa/${node.id}/photos/`;
  const pageLink=el("species-page-link");pageLink.hidden=!profile;if(profile)pageLink.href=profile.page||`taxa/${node.id}/`;
  renderGallery(node.id);renderDistribution(profile);renderLogs(node.id,profile);
}

function renderGallery(id){
  const photos=photoManifest[id]||[];el("photo-count").textContent=`${photos.length} 张`;el("gallery-empty").hidden=photos.length>0;el("gallery").hidden=photos.length===0;if(!photos.length)return;
  state.photoIndex=Math.max(0,Math.min(state.photoIndex,photos.length-1));
  el("photo-stage").innerHTML=photos.map((photo,index)=>{const delta=index-state.photoIndex,limited=Math.max(-2,Math.min(2,delta)),distance=Math.abs(delta),x=limited*48-50,scale=distance===0?1:.78,z=10-distance,opacity=distance>2?0:.48,blur=distance===0?0:3;return `<figure class="photo-card ${distance===0?"active":""}" style="z-index:${z};opacity:${opacity};filter:blur(${blur}px);transform:translate(${x}%,-50%) scale(${scale}) rotateY(${limited*-5}deg)" data-photo="${index}"><img src="${photo.src}" alt="${photo.alt||photo.title||nodeMap.get(id).name}" loading="${distance===0?"eager":"lazy"}"></figure>`}).join("");
  const current=photos[state.photoIndex];el("photo-title").textContent=current.title||nodeMap.get(id).name;el("photo-progress").textContent=`${state.photoIndex+1} / ${photos.length}`;el("photo-prev").disabled=state.photoIndex===0;el("photo-next").disabled=state.photoIndex===photos.length-1;
}

function projectPoint([lat,lng]){return [((lng+180)/360)*1000,((90-lat)/180)*500]}
function renderWorldMap(distribution){
  const graticules=[100,200,300,400].map(y=>`<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`).join("")+[167,333,500,667,833].map(x=>`<line x1="${x}" y1="0" x2="${x}" y2="500"/>`).join("");
  const polygons=(distribution?.polygons||[]).map((polygon,index)=>`<polygon class="range-shape range-${index}" points="${polygon.map(projectPoint).map(point=>point.join(",")).join(" ")}"/>`).join("");
  const map=window.SERPENT_WORLD_MAP;return `<svg data-outline-nodes="${map.nodeCount}" viewBox="0 0 1000 500" role="img" aria-label="${distribution?.label||"物种分布范围示意图"}"><g class="graticule">${graticules}</g><g class="land">${map.landSvg()}</g><g class="ranges">${polygons}</g></svg>`;
}

function renderDistribution(profile){
  const map=el("distribution-map"),note=el("distribution-note");
  if(!profile?.distribution){map.innerHTML='<div class="map-empty">该节点暂无物种级分布数据。请选择物种节点，或在 species-data.js 中补充分布范围。</div>';note.textContent="";return}
  map.innerHTML=renderWorldMap(profile.distribution);note.innerHTML=`<strong>${profile.distribution.label}</strong> · ${profile.distribution.note||"范围仅作学习示意。"}`;
}

function renderLogs(id,profile){
  const section=el("log-preview");section.hidden=!profile;if(!profile)return;
  const logs=[...(logManifest[id]||[])].sort((a,b)=>b.date.localeCompare(a.date));el("log-count").textContent=`${logs.length} 篇`;
  el("log-list").innerHTML=logs.length?logs.slice(0,4).map(log=>`<a class="log-item" href="${log.url}"><time>${log.date}</time><div><strong>${log.title}</strong><p>${log.summary||"打开日志阅读全文"}</p></div><span>↗</span></a>`).join(""):`<div class="log-empty">还没有日志。每篇日志存放在 <code>taxa/${id}/logs/日期-标题/index.html</code>，提交后会自动按日期倒序显示。</div>`;
}

function movePhoto(step){const photos=photoManifest[state.selected]||[];const next=state.photoIndex+step;if(next>=0&&next<photos.length){state.photoIndex=next;renderGallery(state.selected)}}

function populateSpeciesSelectors(){
  const species=[...nodeMap.values()].filter(node=>node.type==="species");
  const options=species.map(item=>`<option value="${item.id}">${item.name} · ${item.latin}</option>`).join("");el("species-a").innerHTML=options;el("species-b").innerHTML=options;
  if(species.length>1)el("species-b").selectedIndex=1;
}

function compareSpecies(){
  const a=el("species-a").value,b=el("species-b").value;if(!a||!b)return;
  const pathA=lineageFor(a),pathB=lineageFor(b);let lca=treeRoot;
  for(let index=0;index<Math.min(pathA.length,pathB.length);index+=1){if(pathA[index].id!==pathB[index].id)break;lca=pathA[index]}
  state.compareA=a;state.compareB=b;state.lca=lca.id;[...pathA,...pathB].forEach(node=>{let current=node.id;while(current){state.expanded.add(current);current=parentMap.get(current)}});renderTree();
  el("ancestor-result").innerHTML=`<span>最近共同祖先</span><strong>${lca.name}</strong><small>${lca.latin||lca.rank||""}</small>`;
}

function setMediaView(view){state.mediaView=view;document.querySelectorAll("[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));el("gallery-view").hidden=view!=="gallery";el("map-view").hidden=view!=="map"}

el("tree").addEventListener("click",event=>{const toggle=event.target.closest("[data-toggle]"),node=event.target.closest("[data-node]");if(toggle){const id=toggle.dataset.toggle;state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);renderTree()}else if(node)selectNode(node.dataset.node)});
el("lineage-path").addEventListener("click",event=>{const node=event.target.closest("[data-node]");if(node)selectNode(node.dataset.node)});
el("expand-all").addEventListener("click",()=>{const allExpanded=[...nodeMap.values()].filter(node=>node.children?.length).every(node=>state.expanded.has(node.id));state.expanded=allExpanded?new Set(["serpentes"]):new Set([...nodeMap.values()].filter(node=>node.children?.length).map(node=>node.id));el("expand-all").textContent=allExpanded?"全部展开":"收起分支";renderTree()});
el("find-ancestor").addEventListener("click",compareSpecies);el("photo-prev").addEventListener("click",()=>movePhoto(-1));el("photo-next").addEventListener("click",()=>movePhoto(1));el("photo-stage").addEventListener("click",event=>{const card=event.target.closest("[data-photo]");if(card){state.photoIndex=Number(card.dataset.photo);renderGallery(state.selected)}});
document.querySelector(".media-tabs").addEventListener("click",event=>{const button=event.target.closest("[data-view]");if(button)setMediaView(button.dataset.view)});
document.addEventListener("keydown",event=>{if(state.mediaView!=="gallery")return;if(event.key==="ArrowLeft")movePhoto(-1);if(event.key==="ArrowRight")movePhoto(1)});
el("year").textContent=new Date().getFullYear();populateSpeciesSelectors();renderTree();selectNode("serpentes");
