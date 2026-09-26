const sections=window.SYMBOL_SECTIONS||[];
const allItems=sections.flatMap(section=>section.items.map(item=>({...item,sectionId:section.id,sectionTitle:section.title})));
const state={filter:"all",query:"",selected:allItems[0]||null};
const el=id=>document.getElementById(id);
let toastTimer;

function escapeHtml(value){return String(value).replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]))}
function searchable(item){return `${item.symbol} ${item.name} ${item.cn} ${item.markdown} ${item.note||""} ${item.sectionTitle}`.toLowerCase()}

function renderFilters(){
  el("filters").innerHTML=[{id:"all",title:"全部"},...sections].map(section=>`<button class="filter ${state.filter===section.id?"active":""}" data-filter="${section.id}" type="button">${section.title}</button>`).join("");
}

function renderSections(){
  const query=state.query.trim().toLowerCase();let visibleCount=0;
  el("symbol-sections").innerHTML=sections.map(section=>{
    if(state.filter!=="all"&&state.filter!==section.id)return "";
    const items=section.items.filter(item=>!query||searchable({...item,sectionTitle:section.title}).includes(query));visibleCount+=items.length;if(!items.length)return "";
    return `<section class="symbol-section" id="${section.id}"><div class="section-head"><div><p class="eyebrow">${section.subtitle}</p><h2>${section.title}</h2></div><span>${items.length} symbols</span></div><div class="symbol-grid">${items.map(item=>cardTemplate(item,section)).join("")}</div></section>`;
  }).join("");
  el("empty").hidden=visibleCount>0;
}

function cardTemplate(item,section){
  const selected=state.selected&&state.selected.symbol===item.symbol&&state.selected.markdown===item.markdown&&state.selected.sectionId===section.id;
  return `<article class="symbol-card ${selected?"selected":""}" data-symbol="${escapeHtml(item.symbol)}" data-markdown="${escapeHtml(item.markdown)}" data-name="${escapeHtml(item.name)}" data-cn="${escapeHtml(item.cn)}" data-section="${section.id}"><button class="symbol-button" type="button" aria-label="复制 ${escapeHtml(item.cn)} ${escapeHtml(item.symbol)}"><span class="glyph">${escapeHtml(item.symbol)}</span><span class="symbol-name">${escapeHtml(item.name)}</span><span class="symbol-cn">${escapeHtml(item.cn)}</span></button><button class="syntax-button" type="button" title="复制 ${escapeHtml(item.markdown)}">${escapeHtml(item.markdown)}</button></article>`;
}

function selectItem(item){state.selected=item;el("current-symbol").textContent=item.symbol;el("current-name").textContent=`${item.name} · ${item.cn}`;el("current-markdown").textContent=item.markdown;renderSections()}

async function copyText(text,label){
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const area=document.createElement("textarea");area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.append(area);area.select();if(!document.execCommand("copy"))throw new Error("copy failed");area.remove()}showToast(`已复制${label}：${text}`)}catch(error){showToast("复制失败，请手动选择文本")}
}

function showToast(message){const toast=el("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),1800)}
function itemFromCard(card){return {symbol:card.dataset.symbol,markdown:card.dataset.markdown,name:card.dataset.name,cn:card.dataset.cn,sectionId:card.dataset.section}}

el("filters").addEventListener("click",event=>{const button=event.target.closest("[data-filter]");if(!button)return;state.filter=button.dataset.filter;renderFilters();renderSections()});
el("search").addEventListener("input",event=>{state.query=event.target.value;renderSections()});
el("symbol-sections").addEventListener("click",event=>{const card=event.target.closest(".symbol-card");if(!card)return;const item=itemFromCard(card);selectItem(item);if(event.target.closest(".syntax-button"))copyText(item.markdown," Markdown");else if(event.target.closest(".symbol-button"))copyText(item.symbol,"符号")});
el("copy-symbol").addEventListener("click",()=>state.selected&&copyText(state.selected.symbol,"符号"));el("copy-markdown").addEventListener("click",()=>state.selected&&copyText(state.selected.markdown," Markdown"));
el("year").textContent=new Date().getFullYear();renderFilters();renderSections();if(state.selected)selectItem(state.selected);
