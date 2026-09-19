const te = new TextEncoder();

const COMMANDS = {
  alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', varepsilon:'ϵ', zeta:'ζ', eta:'η', theta:'θ', vartheta:'ϑ',
  iota:'ι', kappa:'κ', lambda:'λ', mu:'μ', nu:'ν', xi:'ξ', pi:'π', varpi:'ϖ', rho:'ρ', varrho:'ϱ', sigma:'σ',
  varsigma:'ς', tau:'τ', upsilon:'υ', phi:'φ', varphi:'ϕ', chi:'χ', psi:'ψ', omega:'ω',
  Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Xi:'Ξ', Pi:'Π', Sigma:'Σ', Upsilon:'Υ', Phi:'Φ', Psi:'Ψ', Omega:'Ω',
  cdot:'·', times:'×', div:'÷', pm:'±', mp:'∓', le:'≤', leq:'≤', ge:'≥', geq:'≥', neq:'≠', approx:'≈', sim:'∼',
  infty:'∞', partial:'∂', nabla:'∇', degree:'°', circ:'∘', to:'→', rightarrow:'→', leftarrow:'←', leftrightarrow:'↔',
  sum:'∑', prod:'∏', int:'∫', iint:'∬', iiint:'∭', oint:'∮', in:'∈', notin:'∉', subset:'⊂', superset:'⊃',
  cup:'∪', cap:'∩', forall:'∀', exists:'∃', emptyset:'∅', land:'∧', lor:'∨', neg:'¬', therefore:'∴', because:'∵',
  prime:'′', ell:'ℓ', hbar:'ℏ', Re:'ℜ', Im:'ℑ', propto:'∝', equiv:'≡', otimes:'⊗', oplus:'⊕', setminus:'∖',
  parallel:'∥', perp:'⊥', angle:'∠', triangle:'△', aleph:'ℵ',
  ldots:'…', cdots:'⋯', vdots:'⋮', ddots:'⋱', quad:'  ', qquad:'    ', ':' :' ', ',':' ', ';':'  ', '!':'',
};

const xml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const run = (text, normal=false) => `<m:r>${normal?'<m:rPr><m:nor/></m:rPr>':''}<m:t xml:space="preserve">${xml(text)}</m:t></m:r>`;
const row = (nodes) => nodes.map(toOmml).join('');

function toOmml(n) {
  if (!n) return '';
  if (n.type === 'text') return run(n.value, n.normal);
  if (n.type === 'row') return row(n.children);
  if (n.type === 'frac') return `<m:f><m:fPr><m:type m:val="bar"/></m:fPr><m:num>${toOmml(n.num)}</m:num><m:den>${toOmml(n.den)}</m:den></m:f>`;
  if (n.type === 'rad') return `<m:rad><m:radPr>${n.degree?'<m:degHide m:val="0"/>':'<m:degHide m:val="1"/>'}</m:radPr><m:deg>${n.degree?toOmml(n.degree):''}</m:deg><m:e>${toOmml(n.body)}</m:e></m:rad>`;
  if (n.type === 'subsup') return `<m:sSubSup><m:e>${toOmml(n.base)}</m:e><m:sub>${toOmml(n.sub)}</m:sub><m:sup>${toOmml(n.sup)}</m:sup></m:sSubSup>`;
  if (n.type === 'sub') return `<m:sSub><m:e>${toOmml(n.base)}</m:e><m:sub>${toOmml(n.sub)}</m:sub></m:sSub>`;
  if (n.type === 'sup') return `<m:sSup><m:e>${toOmml(n.base)}</m:e><m:sup>${toOmml(n.sup)}</m:sup></m:sSup>`;
  if (n.type === 'delim') return `<m:d><m:dPr><m:begChr m:val="${xml(n.left)}"/><m:endChr m:val="${xml(n.right)}"/><m:grow m:val="1"/></m:dPr><m:e>${toOmml(n.body)}</m:e></m:d>`;
  if (n.type === 'matrix') return `<m:m><m:mPr><m:baseJc m:val="center"/></m:mPr>${n.rows.map(r=>`<m:mr>${r.map(c=>`<m:e>${toOmml(c)}</m:e>`).join('')}</m:mr>`).join('')}</m:m>`;
  if (n.type === 'accent') return `<m:acc><m:accPr><m:chr m:val="${xml(n.char)}"/></m:accPr><m:e>${toOmml(n.body)}</m:e></m:acc>`;
  return '';
}

function mathToken(value, normal=false) {
  if (/^\d+(?:\.\d+)?$/.test(value)) return `<mn>${xml(value)}</mn>`;
  if (/^[+\-−=<>≤≥≠≈·×÷±∓→←↔∈∉⊂⊃∪∩∧∨¬∴∵,;:|()[\]{}]$/.test(value)) return `<mo>${xml(value)}</mo>`;
  if (/^\\/.test(value)) return `<mtext>${xml(value)}</mtext>`;
  return `<mi${normal?' mathvariant="normal"':''}>${xml(value)}</mi>`;
}

function toMathMl(n) {
  if (!n) return '';
  if (n.type === 'text') return mathToken(n.value, n.normal);
  if (n.type === 'row') return `<mrow>${n.children.map(toMathMl).join('')}</mrow>`;
  if (n.type === 'frac') return `<mfrac>${toMathMl(n.num)}${toMathMl(n.den)}</mfrac>`;
  if (n.type === 'rad') return n.degree ? `<mroot>${toMathMl(n.body)}${toMathMl(n.degree)}</mroot>` : `<msqrt>${toMathMl(n.body)}</msqrt>`;
  if (n.type === 'subsup') return `<msubsup>${toMathMl(n.base)}${toMathMl(n.sub)}${toMathMl(n.sup)}</msubsup>`;
  if (n.type === 'sub') return `<msub>${toMathMl(n.base)}${toMathMl(n.sub)}</msub>`;
  if (n.type === 'sup') return `<msup>${toMathMl(n.base)}${toMathMl(n.sup)}</msup>`;
  if (n.type === 'delim') return `<mrow>${n.left?`<mo stretchy="true">${xml(n.left)}</mo>`:''}${toMathMl(n.body)}${n.right?`<mo stretchy="true">${xml(n.right)}</mo>`:''}</mrow>`;
  if (n.type === 'matrix') return `<mtable>${n.rows.map(r=>`<mtr>${r.map(c=>`<mtd>${toMathMl(c)}</mtd>`).join('')}</mtr>`).join('')}</mtable>`;
  if (n.type === 'accent') return `<mover accent="true">${toMathMl(n.body)}<mo>${xml(n.char)}</mo></mover>`;
  return '';
}

class Parser {
  constructor(source) { this.s = source.replace(/\$+/g,'').replace(/\\displaystyle/g,'').trim(); this.i = 0; }
  peek(v) { return this.s.startsWith(v, this.i); }
  skipSpace() { while (/\s/.test(this.s[this.i] || '')) this.i++; }
  command() { this.i++; const m = this.s.slice(this.i).match(/^[A-Za-z]+|^./); const c = m ? m[0] : ''; this.i += c.length; return c; }
  group(open='{', close='}') {
    this.skipSpace();
    if (this.s[this.i] === open) { this.i++; const v = this.parse(close); if (this.s[this.i] === close) this.i++; return v; }
    return this.atom();
  }
  atom() {
    this.skipSpace();
    if (this.i >= this.s.length) return {type:'row',children:[]};
    if (this.s[this.i] === '{') return this.group();
    if (this.s[this.i] !== '\\') return {type:'text', value:this.s[this.i++]};
    const cmd = this.command();
    if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') return {type:'frac', num:this.group(), den:this.group()};
    if (cmd === 'sqrt') {
      this.skipSpace(); let degree = null;
      if (this.s[this.i] === '[') degree = this.group('[',']');
      return {type:'rad', degree, body:this.group()};
    }
    if (['overline','bar','hat','widehat','tilde','widetilde','vec','dot','ddot'].includes(cmd)) {
      const chars={overline:'¯',bar:'¯',hat:'̂',widehat:'̂',tilde:'̃',widetilde:'̃',vec:'⃗',dot:'̇',ddot:'̈'};
      return {type:'accent', char:chars[cmd], body:this.group()};
    }
    if (['mathrm','mathbf','mathit','mathsf','mathtt','text','operatorname'].includes(cmd)) {
      const g=this.group(); const flatten=(n)=>n.type==='text'?n.value:n.type==='row'?n.children.map(flatten).join(''):'';
      const t=flatten(g); return t ? {type:'text',value:t,normal:cmd==='text'||cmd==='operatorname'||cmd==='mathrm'} : g;
    }
    if (cmd === 'left') {
      const left=this.delimiter(); const body=this.parseRight(); const right=this.delimiter(); return {type:'delim',left,right,body};
    }
    if (cmd === 'begin') return this.environment(this.groupName());
    if (cmd === '\\') return {type:'text',value:' '};
    if (cmd === ' ') return {type:'text',value:' '};
    return {type:'text', value:COMMANDS[cmd] ?? (['sin','cos','tan','log','ln','exp','lim','max','min'].includes(cmd)?cmd:`\\${cmd}`), normal:['sin','cos','tan','log','ln','exp','lim','max','min'].includes(cmd)};
  }
  groupName() { this.skipSpace(); if(this.s[this.i]!=='{') return ''; const e=this.s.indexOf('}',++this.i); const v=this.s.slice(this.i,e<0?this.s.length:e); this.i=e<0?this.s.length:e+1; return v; }
  delimiter() { this.skipSpace(); if(this.s[this.i]==='\\'){ const c=this.command(); return {langle:'⟨',rangle:'⟩',lbrace:'{',rbrace:'}',vert:'|',Vert:'‖','{':'{','}':'}'}[c] ?? (c==='.'?'':c); } const c=this.s[this.i++] || ''; return c==='.'?'':c; }
  parseRight() { const start=this.i; let depth=0; while(this.i<this.s.length){ if(this.s[this.i]==='{')depth++; if(this.s[this.i]==='}')depth--; if(depth===0&&this.peek('\\right')){ const part=this.s.slice(start,this.i); this.i+=6; return new Parser(part).parse(); } this.i++; } return new Parser(this.s.slice(start)).parse(); }
  environment(name) {
    const end=`\\end{${name}}`; const start=this.i; const at=this.s.indexOf(end,start); const raw=this.s.slice(start,at<0?this.s.length:at); this.i=at<0?this.s.length:at+end.length;
    const rows=raw.split(/\\\\/).filter(x=>x.trim()).map(r=>r.split('&').map(c=>new Parser(c).parse()));
    const matrix={type:'matrix',rows};
    if(name==='cases') return {type:'delim',left:'{',right:'',body:matrix};
    if(name.includes('matrix')) { const pair=name==='pmatrix'?['(',')']:name==='bmatrix'?['[',']']:name==='Bmatrix'?['{','}']:name==='vmatrix'?['|','|']:name==='Vmatrix'?['‖','‖']:null; return pair?{type:'delim',left:pair[0],right:pair[1],body:matrix}:matrix; }
    return matrix;
  }
  parse(stop='') {
    const children=[];
    while(this.i<this.s.length && (!stop || this.s[this.i]!==stop)) {
      this.skipSpace(); if(this.i>=this.s.length || (stop&&this.s[this.i]===stop)) break;
      let base=this.atom(); this.skipSpace(); let sub=null,sup=null;
      while(this.s[this.i]==='_'||this.s[this.i]==='^'){ const kind=this.s[this.i++]; const value=this.group(); if(kind==='_')sub=value; else sup=value; this.skipSpace(); }
      if(sub&&sup) base={type:'subsup',base,sub,sup}; else if(sub)base={type:'sub',base,sub}; else if(sup)base={type:'sup',base,sup};
      children.push(base);
    }
    return {type:'row',children};
  }
}

export function latexToOmml(latex) { return toOmml(new Parser(latex).parse()); }
export function latexToMathMl(latex) { return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">${toMathMl(new Parser(latex).parse())}</math>`; }

function crc32(bytes) {
  let c=0xffffffff;
  for (const b of bytes) { c^=b; for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0); }
  return (c^0xffffffff)>>>0;
}
const u16=n=>new Uint8Array([n&255,(n>>>8)&255]);
const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
const join=(parts)=>{ const len=parts.reduce((a,p)=>a+p.length,0), out=new Uint8Array(len); let o=0; for(const p of parts){out.set(p,o);o+=p.length;} return out; };
function zipStore(entries) {
  const locals=[], centrals=[]; let offset=0;
  for(const [name,content] of entries){ const nb=te.encode(name), data=te.encode(content), crc=crc32(data); const local=join([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),nb,data]); locals.push(local); const central=join([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb]); centrals.push(central); offset+=local.length; }
  const body=join(locals), cd=join(centrals), end=join([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(cd.length),u32(body.length),u16(0)]); return join([body,cd,end]);
}

export function createEquationDocx(latex) {
  const omml=latexToOmml(latex);
  const now=new Date().toISOString();
  const entries=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`],
    ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`],
    ['word/_rels/document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['word/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style></w:styles>`],
    ['word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr><m:oMathPara><m:oMathParaPr><m:jc m:val="centerGroup"/></m:oMathParaPr><m:oMath>${omml}</m:oMath></m:oMathPara></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`],
    ['docProps/core.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>识别公式</dc:title><dc:creator>公式图片转 Word</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`],
    ['docProps/app.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>`]
  ];
  return new Blob([zipStore(entries)], {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
