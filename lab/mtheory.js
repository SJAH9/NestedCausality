/* Equation-defined sections; no vacuum, holonomy or field-equation solver. */
(()=>{'use strict';
const tau=2*Math.PI;
const catalog=[
 {name:'Native Arcade',dimension:2,description:'Original six-field geometry rules.',source:'https://sidhubbard.com/arcade/facet-lab.js'},
 {name:'T⁷ · flat seven-torus',dimension:7,description:'Periodic product T⁷ = (S¹)⁷. Explore a T² section with five angles fixed. Flat product metric; trivial holonomy.',source:'https://arxiv.org/abs/hep-th/0504108'},
 {name:'S⁷ · round sphere',dimension:7,description:'Σ xᵢ² = R² in R⁸. A latitude S² section with five coordinates fixed; the round internal space of the Freund–Rubin family.',source:'https://arxiv.org/abs/0806.1218'},
 {name:'S⁷ / Zₖ · Hopf quotient',dimension:7,description:'z ∼ exp(2πi/k)z in C⁴, Σ|zᵢ|² = R². A Hopf T² section in z₃=z₄=0, displayed through quotient-invariant coordinates.',source:'https://arxiv.org/abs/0806.1218'},
 {name:'C(S³ × S³) · conical G₂ limit',dimension:7,description:'Radial cone over S³ × S³. A T² section of the link at radius ρ. Topological cone coordinates only; the nearly Kähler link metric and torsion-free G₂ metric are not calculated.',source:'https://arxiv.org/abs/hep-th/0107177'}
];
function valid(c){return Array.isArray(c)&&(c.length===6||c.length===10)&&c.every((v,i)=>Number.isInteger(v)&&v>=1&&v<=(i===0?12:i===6?5:14));}
function parameters(c){return {type:c[6]||1,radius:(c[7]||4)/4,latitude:(c[8]||7)*Math.PI/30,k:c[9]||3};}
function point(c,u,v){const {type,radius:R,latitude:a,k}=parameters(c),cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);let source,display;
 if(type===2){const angles=[u,v,a,a,a,a,a];source=angles.flatMap(t=>[R*Math.cos(t),R*Math.sin(t)]);/* A declared nonlinear embedding of the T² section into R³, preserving both periods. */display=[R*(1+.32*cv)*cu,R*(1+.32*cv)*su,R*.32*sv];}
 else if(type===3){source=[R*Math.sin(a)*sv*cu,R*Math.sin(a)*sv*su,R*Math.sin(a)*cv,R*Math.cos(a),0,0,0,0];display=source.slice(0,3);}
 else if(type===4){const theta=u/k;source=[R*Math.cos(a)*Math.cos(theta),R*Math.cos(a)*Math.sin(theta),R*Math.sin(a)*Math.cos(theta+v),R*Math.sin(a)*Math.sin(theta+v),0,0,0,0];/* u = k arg(z1), v = arg(z2/z1) are invariant under the common Z_k action. This is an embedding of these section coordinates, not a linear projection of the quotient. */display=[R*(1+.35*Math.sin(a)*cv)*cu,R*(1+.35*Math.sin(a)*cv)*su,R*.35*Math.sin(a)*sv];}
 else if(type===5){source=[R,Math.cos(a)*cu,Math.cos(a)*su,Math.sin(a),0,Math.cos(a)*cv,Math.cos(a)*sv,Math.sin(a),0];display=[R*(1+.35*Math.cos(a)*cv)*cu,R*(1+.35*Math.cos(a)*cv)*su,R*.35*Math.cos(a)*sv];}
 else throw Error('Choose a mathematical construction.');
 return {source,display};}
function geometry(c,count){const p=parameters(c),n=Math.max(12,Math.min(64,12+Math.ceil(Math.sqrt(count||1))*2)),sphere=p.type===3,rows=sphere?n/2:n,cells=[],samples=[];const at=(i,j)=>point(c,tau*i/n,sphere?Math.PI*j/rows:tau*j/rows);
 for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=at(i,j),b=at(i+1,j),d=at(i,j+1),e=at(i+1,j+1);samples.push(a.source);for(const vertices of (sphere&&j===0?[[a.display,e.display,d.display]]:sphere&&j===rows-1?[[a.display,b.display,d.display]]:[[a.display,b.display,e.display],[a.display,e.display,d.display]])){if(sphere)vertices.reverse();const ab=vertices[1].map((x,k)=>x-vertices[0][k]),ac=vertices[2].map((x,k)=>x-vertices[0][k]),v=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],len=Math.hypot(...v);if(len>1e-12)cells.push({vertices,normal:v.map(x=>x/len),sourceVertices:vertices.map(v=>[a,b,d,e].find(q=>q.display===v).source)});}}
 const g=window.Arcade.geometryFromCells(cells);g.sourceFaces=cells.map(f=>f.sourceVertices);g.mtheory={...p,name:catalog[p.type-1].name,dimension:7,sectionDimension:2,metricStatus:p.type===5?'topological section; G2 metric absent':'declared standard metric; display embedding is not isometric',samples,sampling:n};return g;
}
window.MTheorySections={catalog,valid,parameters,point,geometry};
})();
