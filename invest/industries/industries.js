const state={data:null,period:null,query:"",sortKey:"netProfitYoY",sortDir:-1};
const el=id=>document.getElementById(id);
const pct=value=>Number.isFinite(value)?`${value>0?"+":""}${value.toFixed(1)}%`:"—";
const cls=value=>!Number.isFinite(value)?"":value>=0?"positive":"negative";
const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
const amount=value=>Number.isFinite(value)?`${new Intl.NumberFormat("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)} 元`:"—";
const currentPeriod=()=>state.data.periods.find(item=>item.id===state.period)||state.data.periods[0];

function render(){
  const period=currentPeriod();
  let rows=period.industries.filter(row=>`${row.name} ${row.parent} ${row.code}`.toLowerCase().includes(state.query));
  rows.sort((a,b)=>{const av=a[state.sortKey],bv=b[state.sortKey];if(state.sortKey==="name")return String(av).localeCompare(String(bv),"zh-CN")*state.sortDir;if(av==null)return 1;if(bv==null)return-1;return(av-bv)*state.sortDir});
  el("summary-period").textContent=period.label;
  el("summary-industries").textContent=period.industries.length.toLocaleString();
  el("summary-companies").textContent=period.summary.companies.toLocaleString();
  el("summary-positive").textContent=period.summary.positiveNetProfit.toLocaleString();
  el("result-count").textContent=`显示 ${rows.length} / ${period.industries.length} 个行业`;
  el("industry-body").innerHTML=rows.map(row=>`<tr><td><span class="industry-name">${escapeHtml(row.name)}</span><span class="industry-meta">${escapeHtml(row.parent)} · ${escapeHtml(row.code)}</span></td><td class="${cls(row.netProfitYoY)}">${pct(row.netProfitYoY)}</td><td class="${cls(row.revenueYoY)}">${pct(row.revenueYoY)}</td><td class="${cls(row.priceReturn)}">${pct(row.priceReturn)}</td><td class="count-cell"><button class="company-button" data-code="${escapeHtml(row.code)}" data-metric="netProfit">${row.positiveNetProfit}</button><span> / ${row.netProfitObservations}</span></td><td class="count-cell"><button class="company-button" data-code="${escapeHtml(row.code)}" data-metric="revenue">${row.positiveRevenue}</button><span> / ${row.revenueObservations}</span></td><td>${row.companies}</td></tr>`).join("");
}

function periodCompanyMaps(startIndex){
  return [0,1,2].map(offset=>{
    const period=state.data.periods[startIndex+offset];
    return period?{period,map:new Map(period.companyFinancials.map(company=>[company.code,company]))}:null;
  });
}

function showCompanies(code,metric){
  const periodIndex=state.data.periods.findIndex(item=>item.id===state.period);
  const periods=periodCompanyMaps(periodIndex);
  const current=periods[0];
  const industry=current.period.industries.find(item=>item.code===code);
  const yoyKey=metric==="netProfit"?"netProfitYoY":"revenueYoY";
  const amountKey=metric==="netProfit"?"netProfitAmount":"revenueAmount";
  const metricLabel=metric==="netProfit"?"净利润":"营业收入";
  const companies=current.period.companyFinancials.filter(company=>company.industry===code&&Number.isFinite(company[yoyKey])&&company[yoyKey]>0).sort((a,b)=>b[yoyKey]-a[yoyKey]);
  el("dialog-title").textContent=`${industry.name} · ${metricLabel}同比增长公司（${companies.length}家）`;
  periods.forEach((item,index)=>{
    const label=item?item.period.label:index===1?"前一期":"前两期";
    el(`period-${index}-amount`).textContent=`${label}金额`;
    el(`period-${index}-yoy`).textContent=`${label}同比`;
  });
  el("company-body").innerHTML=companies.map(company=>{
    const cells=periods.map(item=>item?.map.get(company.code)||null);
    return `<tr><td>${escapeHtml(company.code)} ${escapeHtml(company.name)}</td>${cells.map(item=>`<td>${amount(item?.[amountKey])}</td><td class="${cls(item?.[yoyKey])}">${pct(item?.[yoyKey])}</td>`).join("")}</tr>`;
  }).join("")||'<tr><td colspan="7">本期没有同比增长公司。</td></tr>';
  el("company-dialog").showModal();
}

async function init(){
  el("year").textContent=new Date().getFullYear();
  try{
    const response=await fetch("data/sw-industry.json",{cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    state.data=await response.json();state.period=state.data.periods[0].id;
    el("period-select").innerHTML=state.data.periods.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
    el("data-source").textContent=`数据更新时间：${new Date(state.data.generatedAt).toLocaleString("zh-CN")}。来源：申万研究、上市公司定期报告、乐咕乐股和东方财富，数据通过 AKShare 获取。`;
    el("status").hidden=true;el("dashboard").hidden=false;render();
  }catch(error){el("status").textContent=`行业数据加载失败（${error.message}），请稍后重试。`}
}

el("period-select").addEventListener("change",event=>{state.period=event.target.value;render()});
el("metric-select").addEventListener("change",event=>{state.sortKey=event.target.value;state.sortDir=-1;render()});
el("search-input").addEventListener("input",event=>{state.query=event.target.value.trim().toLowerCase();render()});
document.querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{const key=th.dataset.sort;state.sortDir=state.sortKey===key?state.sortDir*-1:key==="name"?1:-1;state.sortKey=key;render()}));
el("industry-body").addEventListener("click",event=>{const button=event.target.closest(".company-button");if(button)showCompanies(button.dataset.code,button.dataset.metric)});
el("dialog-close").addEventListener("click",()=>el("company-dialog").close());
init();
