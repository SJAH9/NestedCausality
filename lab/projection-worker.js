/* Add facets through the same native construction used by Facet Lab. */
'use strict';
self.window=self;
importScripts('vendor/arcade-contract.js','g2.js?v=2','mtheory.js?v=g2-1','facet-geometry.js?v=1');
const unit=a=>{const r=Math.hypot(...a)||1;return a.map(v=>v/r);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
function labelsFor(digits,mode,budget){const labels=new Uint8Array(budget),positions=new Uint32Array(budget);let written=0,read=0,previous=0;while(written<budget&&read<digits.length){const raw=digits.charCodeAt(read)-48;if(raw<0||raw>9)throw Error('Invalid decimal expansion.');let digit=raw;if(mode>=3){const sum=previous+raw;digit=sum?1+(sum-1)%9:0;previous=digit;}read++;const repeats=mode===2||mode===4?digit:1;for(let k=0;k<repeats&&written<budget;k++){labels[written]=digit;positions[written]=read;written++;}}if(written!==budget)throw Error('The stored decimal expansion has insufficient digits for this projection.');return {labels,positions,read};}
onmessage=async({data})=>{try{const {id,configuration,budget,mode,constant}=data;let digits='';if(budget){const response=await fetch('digits/'+constant+'.txt');if(!response.ok)throw Error('Decimal expansion could not load.');digits=(await response.text()).trim();}
const {labels,positions,read}=labelsFor(digits,mode,budget),geometry=FacetGeometry.addFacets(configuration,budget),faces=geometry.count;
if(faces<budget)throw Error('This saved construction cannot yet add the requested number of facets.');
let edges=0;for(const f of geometry.menuFaces)edges+=f.vertices.length;
const wire=new Float32Array(edges*6),ink=new Float32Array(budget*13);let wi=0,fi=0;
function cell(vertices,normal){for(let j=0;j<vertices.length;j++){wire.set(vertices[j],wi);wi+=3;wire.set(vertices[(j+1)%vertices.length],wi);wi+=3;}
if(fi<budget){const center=[0,1,2].map(k=>vertices.reduce((s,p)=>s+p[k],0)/vertices.length),u=unit(cross(Math.abs(normal[1])<.9?[0,1,0]:[1,0,0],normal)),v=cross(u,normal);let radius=Infinity;for(let j=0;j<vertices.length;j++){const a=vertices[j],b=vertices[(j+1)%vertices.length],edge=unit(b.map((x,k)=>x-a[k])),delta=center.map((x,k)=>x-a[k]);radius=Math.min(radius,Math.hypot(...cross(edge,delta)));}const size=radius*1.2;ink.set([...center,...u.map(x=>x*size),...v.map(x=>x*size),...normal,labels[fi]],fi*13);}fi++;}
for(const face of geometry.menuFaces)cell(face.vertices,face.normal);
postMessage({id,wire,ink,labels,positions,read,faces,budget,construction:'native-add-facets',sampleFaces:geometry.faces.slice(0,16)},[wire.buffer,ink.buffer,labels.buffer,positions.buffer]);
}catch(error){postMessage({id:data.id,error:error.message});}};
