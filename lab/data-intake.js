/* Input adapters retain records, source order and source identity; no inference or scores. */
(()=>{'use strict';
const MAX_ROWS=250000,MAX_BYTES=64*1024*1024;
const string=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
function href(value,base){if(typeof value!=='string'||! /^(?:https?:\/\/|mailto:|\/|\.\.?\/|#)/i.test(value.trim()))return null;try{const u=new URL(String(value),base||undefined);return ['http:','https:','mailto:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function flatten(value,prefix='',out=Object.create(null),depth=0){
 if(Array.isArray(value)&&!prefix&&value.length){value.forEach((v,i)=>flatten(v,'['+i+']',out,depth+1));return out;}
 if(value&&typeof value==='object'&&!Array.isArray(value)&&depth<6&&Object.keys(value).length){for(const [k,v]of Object.entries(value))flatten(v,prefix?prefix+'.'+k:k,out,depth+1);}else out[prefix||'value']=value;return out;
}
function csv(text,delimiter,header=true){
 const records=[];let cells=[],cell='',quoted=false,afterQuote=false;
 function endCell(){cells.push(cell);cell='';afterQuote=false;}
 function endRow(){endCell();if(cells.some(v=>v!==''))records.push(cells);cells=[];}
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=c;}
 else if(c==='"'&&!cell&&!afterQuote)quoted=true;
 else if(c===delimiter)endCell();else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;endRow();}
 else if(afterQuote&&c.trim())throw Error('Unexpected character after a quoted field.');else if(!afterQuote)cell+=c;
 if(records.length>MAX_ROWS+1)throw Error('More than '+MAX_ROWS.toLocaleString()+' records. Load a source page or a smaller file.');}
 if(quoted)throw Error('Unclosed quoted field.');if(cell||cells.length||afterQuote)endRow();if(!records.length)return [];
 const width=Math.max(...records.slice(0,1000).map(r=>r.length)),used=new Set(),names=(header?records.shift():Array.from({length:width},(_,i)=>'column '+(i+1))).map((s,i)=>{let n=s.trim()||'column '+(i+1),base=n,j=2;while(used.has(n))n=base+' ('+j+++')';used.add(n);return n;});
 return records.map(r=>{const o=Object.create(null);for(let i=0;i<Math.max(names.length,r.length);i++)o[names[i]||'extra column '+(i+1)]=r[i]??null;return o;});
}
function detect(text,name='',type=''){
 const t=text.trimStart(),ext=name.split(/[?#]/)[0].split('.').pop().toLowerCase();
 if(['ttl','trig','nt','nq','n3'].includes(ext)||/turtle|n-triples|n-quads|trig/.test(type))return 'rdf';
 if(['rss','atom','xml','rdf'].includes(ext)||/^<\?xml|^<(?:rss|feed|rdf:RDF)\b/.test(t))return 'xml';
 if(['jsonl','ndjson'].includes(ext)||/ndjson/.test(type))return 'jsonl';
 if(t.startsWith('{')||t.startsWith('[')||/json/.test(type))return 'json';
 if(t.startsWith('<'))return 'xml';if(ext==='tsv'||/tab-separated/.test(type))return 'tsv';
 if(ext==='csv'||/csv/.test(type))return 'csv';
 if(/^(?:@prefix|@base|PREFIX|BASE)\s/.test(t))return 'rdf';
 const first=t.split(/\r?\n/,1)[0];return first.includes('\t')?'tsv':first.includes(',')?'csv':'text';
}
function jsonRecords(value,path){
 let next=null,chosen=path||'';
 if(value&&typeof value==='object'){const candidate=value.links?.next?.href||value.links?.next||value.next||value.pagination?.next;next=typeof candidate==='string'?candidate:null;}
 if(path){for(const part of path.split('.')){if(value==null||!Object.hasOwn(value,part))throw Error('Record path not found: '+path);value=value[part];}}
 else if(!Array.isArray(value)&&value&&typeof value==='object'){
  const key=['features','@graph','results','data','items','records','entries'].find(k=>Array.isArray(value[k]))||Object.keys(value).find(k=>Array.isArray(value[k]));if(key){value=value[key];chosen=key;}
 }
 return {records:Array.isArray(value)?value:[value],path:chosen||'(root)',next};
}
function parseText(text,{format='auto',name='',type='',path='',header=true,base=''}={}){
 text=text.replace(/^\uFEFF/,'');format=format==='auto'?detect(text,name,type):format;let records,info='',next=null;
 if(format==='json'){const result=jsonRecords(JSON.parse(text),path);records=result.records;info='Records: '+result.path+' · nested objects keep field paths; arrays retain JSON.';next=result.next;}
 else if(format==='jsonl')records=text.split(/\r?\n/).filter(s=>s.trim()).map((s,i)=>{try{return JSON.parse(s);}catch{throw Error('Invalid JSON on line '+(i+1));}});
 else if(format==='csv'||format==='tsv')records=csv(text,format==='tsv'?'\t':',',header);
 else if(format==='rdf'){
  if(!globalThis.N3)throw Error('RDF parser unavailable.');const quads=new N3.Parser({baseIRI:base||'urn:dataset:',format:/\.nq(?:$|[?#])/.test(name)?'N-Quads':/\.nt(?:$|[?#])/.test(name)?'N-Triples':undefined}).parse(text);
  const term=t=>t.termType==='BlankNode'?'_:'+t.value:t.termType==='Quad'?N3.Writer.quadToString(t):t.value;
  records=quads.map(q=>({subject:term(q.subject),predicate:term(q.predicate),object:term(q.object),objectType:q.object.termType,datatype:q.object.datatype?.value||'',language:q.object.language||'',graph:term(q.graph)}));info='RDF statements · terms, literal datatypes, languages and graph names retained · no inference.';
 }else if(format==='xml')throw Error('XML must use the browser document adapter.');
 else records=text.split(/\r?\n/).map((line,i)=>({line:i+1,text:line}));
 if(records.length>MAX_ROWS)throw Error('More than '+MAX_ROWS.toLocaleString()+' records. Load a source page or a smaller file.');
 return {records,format,info,next};
}
function parseXML(text,{base='',path=''}={}){
 const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid XML. Choose Text to inspect the unparsed input.');
 const root=doc.documentElement,all=tag=>Array.from(doc.getElementsByTagNameNS('*',tag));let nodes=all('item'),format='RSS';if(!nodes.length){nodes=all('entry');format='Atom';}
 if(!nodes.length){format=root.namespaceURI==='http://www.w3.org/1999/02/22-rdf-syntax-ns#'?'RDF/XML':'XML';nodes=path?all(path):Array.from(root.children);if(!nodes.length)nodes=[root];}
 if(nodes.length>MAX_ROWS)throw Error('More than '+MAX_ROWS.toLocaleString()+' records. Load a smaller XML document.');
 function value(node,depth=0){if(depth>12)return new XMLSerializer().serializeToString(node);const o=Object.create(null);for(const a of node.attributes)o['@'+a.name]=a.value;const children=Array.from(node.children);if(!children.length){if(!node.attributes.length)return node.textContent; o.value=node.textContent;}for(const c of children){const v=value(c,depth+1),k=c.tagName;if(Object.hasOwn(o,k))o[k]=Array.isArray(o[k])?[...o[k],v]:[o[k],v];else o[k]=v;}return o;}
 const namespaces=Object.fromEntries(Array.from(root.attributes).filter(a=>a.name==='xmlns'||a.prefix==='xmlns').map(a=>[a.name,a.value]));
 const records=nodes.map(n=>{const o=value(n);if(typeof o!=='object')return {value:o};if(format==='RDF/XML'){o['@element']=n.tagName;o['@namespace']=n.namespaceURI;o['@namespaces']=namespaces;}if(format==='RSS'||format==='Atom'){const link=Array.from(n.children).find(c=>c.localName==='link'&&(!c.getAttribute('rel')||c.getAttribute('rel')==='alternate'));if(link)o.url=href(link.getAttribute('href')||link.textContent,link.baseURI==='about:blank'?base:link.baseURI)||link.getAttribute('href')||link.textContent;}return o;});
 const nextNode=all('link').find(n=>n.getAttribute('rel')==='next');return {records,format,next:nextNode?.getAttribute('href')||null,info:format==='RDF/XML'?'RDF/XML structural records: namespace names, resources, attributes and nested nodes retained; not an expanded RDF graph.':'XML structure and attributes retained. '+(path?'Record element: '+path:format==='XML'?'Root children are records.':'Feed entries are records.')};
}
function type(value){if(value==null||value==='')return 'empty';if(typeof value==='object')return 'structured';if(typeof value==='boolean'||/^(true|false)$/i.test(value))return 'boolean';if(typeof value==='number'||/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value))return 'number';if(/^https?:\/\//i.test(value)&&href(value))return 'link';if(/^\d{4}-\d{2}-\d{2}(?:[T\s]|$)/.test(value)&&Number.isFinite(Date.parse(value)))return 'date';return 'text';}
 globalThis.DataIntake={MAX_ROWS,MAX_BYTES,string,href,flatten,detect,parseText,parseXML,type};
})();
