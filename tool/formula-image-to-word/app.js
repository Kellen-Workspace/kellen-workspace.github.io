import { createEquationDocx, latexToMathMl } from './docx.js';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

const $ = (s) => document.querySelector(s);
const els = {
  input: $('#image-input'), drop: $('#drop-zone'), empty: $('#empty-upload'), preview: $('#image-preview'), clear: $('#clear-image'), meta: $('#file-meta'),
  endpoint: $('#api-endpoint'), model: $('#model-name'), key: $('#api-key'), toggleKey: $('#toggle-key'), recognize: $('#recognize-button'), status: $('#status'),
  latex: $('#latex-editor'), formula: $('#formula-preview'), previewHint: $('#preview-hint'), editState: $('#edit-state'), copy: $('#copy-button'), export: $('#export-button'), filename: $('#filename')
};
let selectedFile = null;

els.endpoint.value = DEEPSEEK_ENDPOINT;
els.model.value = localStorage.getItem('formula.model') || '';
els.model.addEventListener('change', () => localStorage.setItem('formula.model', els.model.value.trim()));

function setStatus(message='', kind='') { els.status.textContent=message; els.status.className=`status ${kind}`; }
function validateFile(file) {
  if (!file?.type.startsWith('image/')) throw new Error('请选择图片文件。');
  if (file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB。');
}
function chooseFile(file) {
  try { validateFile(file); } catch(e) { setStatus(e.message,'error'); return; }
  selectedFile=file; const url=URL.createObjectURL(file); els.preview.src=url; els.preview.hidden=false; els.empty.hidden=true; els.clear.hidden=false;
  els.meta.textContent=`${file.name} · ${(file.size/1024).toFixed(file.size>1024*1024?0:1)} KB`; setStatus(); updateButtons();
}
els.input.addEventListener('change', e => chooseFile(e.target.files[0]));
['dragenter','dragover'].forEach(n=>els.drop.addEventListener(n,e=>{e.preventDefault();els.drop.classList.add('dragging');}));
['dragleave','drop'].forEach(n=>els.drop.addEventListener(n,e=>{e.preventDefault();els.drop.classList.remove('dragging');}));
els.drop.addEventListener('drop',e=>chooseFile(e.dataTransfer.files[0]));
els.drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.input.click();}});
els.clear.addEventListener('click',()=>{selectedFile=null;els.input.value='';els.preview.removeAttribute('src');els.preview.hidden=true;els.empty.hidden=false;els.clear.hidden=true;els.meta.textContent='尚未选择图片';updateButtons();setStatus();});
els.toggleKey.addEventListener('click',()=>{const show=els.key.type==='password';els.key.type=show?'text':'password';els.toggleKey.textContent=show?'隐藏':'显示';els.toggleKey.setAttribute('aria-label',show?'隐藏 API Key':'显示 API Key');});
[els.model,els.key].forEach(e=>e.addEventListener('input',updateButtons));
function updateButtons(){ const empty=!els.latex.value.trim(); els.recognize.disabled=!(selectedFile&&els.model.value.trim()&&els.key.value.trim()); els.copy.disabled=empty; els.export.disabled=empty; }

function fileDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('读取图片失败。'));r.readAsDataURL(file);});}
function extractLatex(content) {
  const text=typeof content==='string'?content:JSON.stringify(content);
  try { const j=JSON.parse(text); if(j.latex) return String(j.latex).trim(); } catch {}
  const fenced=text.match(/```(?:latex|tex|json)?\s*([\s\S]*?)```/i); let value=fenced?fenced[1].trim():text.trim();
  if(value.startsWith('{')){try{const j=JSON.parse(value);if(j.latex)value=j.latex;}catch{}}
  return String(value).replace(/^\$\$|\$\$$/g,'').replace(/^\\\[|\\\]$/g,'').trim();
}
async function recognize() {
  els.recognize.disabled=true; els.recognize.querySelector('.button-label').textContent='正在识别…'; setStatus('正在发送图片并解析公式，请稍候。');
  try {
    const image=await fileDataUrl(selectedFile); const endpoint=DEEPSEEK_ENDPOINT;
    const payload={model:els.model.value.trim(),temperature:0,messages:[{role:'user',content:[{type:'text',text:'你是数学公式 OCR。请精确识别图片中的全部公式，只返回 JSON：{"latex":"..."}。保留上下标、分式、根式、希腊字母、矩阵、分段条件和括号，不要解释。'},{type:'image_url',image_url:{url:image}}]}]};
    const localPayload={endpoint,apiKey:els.key.value.trim(),...payload};
    let response;
    try { response=await fetch('/api/recognize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(localPayload)}); if(response.status===404) throw new Error('NO_LOCAL_PROXY'); }
    catch(e){ if(e.message!=='NO_LOCAL_PROXY' && location.hostname==='localhost') throw e; response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${els.key.value.trim()}`},body:JSON.stringify(payload)}); }
    const data=await response.json().catch(()=>({})); if(!response.ok) throw new Error(data.error?.message||data.error||`接口返回 ${response.status}`);
    const content=data.choices?.[0]?.message?.content ?? data.output_text ?? data.content; if(!content) throw new Error('接口返回中没有找到识别结果。');
    els.latex.value=extractLatex(content); els.editState.textContent='已识别，可校正'; els.editState.classList.add('ready'); await renderPreview(); setStatus('识别完成，请核对公式后导出。','success');
  } catch(e) { setStatus(`识别失败：${e.message}${location.protocol==='https:'?'。若接口限制浏览器访问，请使用本地启动方式。':''}`,'error'); }
  finally { els.recognize.querySelector('.button-label').textContent='开始识别'; updateButtons(); }
}
els.recognize.addEventListener('click',recognize);

let renderTimer;
async function renderPreview(){
  clearTimeout(renderTimer); const latex=els.latex.value.trim(); updateButtons();
  if(!latex){els.formula.innerHTML='<span class="preview-placeholder">预览区域</span>';els.editState.textContent='等待识别';els.editState.classList.remove('ready');return;}
  els.editState.textContent='可导出';els.editState.classList.add('ready');
  if(!window.MathJax?.tex2svgPromise){els.formula.textContent=latex;els.previewHint.textContent='预览组件未加载，仍可导出';return;}
  try{els.formula.innerHTML='';const node=await MathJax.tex2svgPromise(latex,{display:true});els.formula.appendChild(node);els.previewHint.textContent='Word 中将保持可编辑';}
  catch(e){els.formula.innerHTML=`<span class="preview-error">LaTeX 预览失败：${String(e.message||e)}</span>`;els.previewHint.textContent='请检查语法';}
}
els.latex.addEventListener('input',()=>{clearTimeout(renderTimer);renderTimer=setTimeout(renderPreview,180);});
els.export.addEventListener('click',()=>{
  try { const blob=createEquationDocx(els.latex.value.trim()); const a=document.createElement('a'); const safe=(els.filename.value.trim()||'识别公式').replace(/[\\/:*?"<>|]/g,'_'); a.href=URL.createObjectURL(blob);a.download=`${safe}.docx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);setStatus('Word 文件已生成。','success'); }
  catch(e){setStatus(`导出失败：${e.message}`,'error');}
});

els.copy.addEventListener('click',async()=>{
  const latex=els.latex.value.trim();
  try {
    const mathml=latexToMathMl(latex);
    const html=`<!doctype html><html><head><meta charset="utf-8"></head><body>${mathml}</body></html>`;
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('RICH_CLIPBOARD_UNAVAILABLE');
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html],{type:'text/html'}),
      'text/plain': new Blob([mathml],{type:'text/plain'})
    })]);
    setStatus('公式已复制，可直接粘贴到桌面版 Word。','success');
  } catch(e) {
    try {
      await navigator.clipboard.writeText(latex);
      setStatus('已复制 LaTeX。请在 Word 中按 Alt+= 新建公式框，再粘贴。','success');
    } catch {
      setStatus('复制失败，请允许浏览器访问剪贴板后重试。','error');
    }
  }
});

function registerWebMcp(){
  const context=document.modelContext;if(!context?.registerTool)return;
  try{context.registerTool({name:'set_formula_latex',title:'设置公式 LaTeX',description:'把已识别或人工提供的 LaTeX 写入编辑器并更新公式预览。',inputSchema:{type:'object',properties:{latex:{type:'string'}},required:['latex'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(input){if(!input||typeof input.latex!=='string'||!input.latex.trim())throw new Error('latex 不能为空');els.latex.value=input.latex.trim();await renderPreview();return{status:'ready',latex:els.latex.value};}});}catch(e){console.debug('WebMCP unavailable',e);}
}
registerWebMcp(); updateButtons();

window.addEventListener('pagehide',()=>{ els.key.value=''; });
