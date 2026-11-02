/* Shared native Facet Lab construction: the lab and projection worker use this same code. */
(()=>{'use strict';
const arcade=window.Arcade,defaults=[12,14,1,1,1,1];
const normalize=c=>Array.isArray(c)&&c.length===3?[...c,1,1,1]:c;
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
const cache=new Map();
function seed(c){
 const rule=c[2],sym=c[0];let planes=null;
 if(rule===2)planes=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(n=>[unit(n),1]);
 if(rule===3)planes=[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[unit([x,y,z]),1])));
 if(rule===4||rule===12)planes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(n=>[n,1]);
 const axisSides=({6:2,7:3,8:4,9:6})[sym];
 if(axisSides||rule===11){const sides=Math.max(3,axisSides||6);planes=Array.from({length:sides},(_,i)=>[[Math.cos(2*Math.PI*i/sides),Math.sin(2*Math.PI*i/sides),0],1]);planes.push([[0,0,1],1],[[0,0,-1],1]);if(axisSides===2)planes=[[ [1,0,0],1],[[-1,0,0],1],[[0,1,0],.7],[[0,-1,0],.7],[[0,0,1],1],[[0,0,-1],1]];}
 if(c[5]===2)planes=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(n=>[unit(n),1]);
 if(c[5]===3)planes=[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[unit([x,y,z]),1])));
 if(c[5]===4){const phi=(1+Math.sqrt(5))/2,inv=1/phi;planes=[...[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[x,y,z]))),...[-1,1].flatMap(a=>[-1,1].flatMap(b=>[[0,a*inv,b*phi],[a*inv,b*phi,0],[b*phi,0,a*inv]]))].map(n=>[unit(n),1]);}
 if(c[5]===6)planes=arcade.geometryFor(14).menuFaces.map(f=>[f.normal,f.vertices.length===3?1.03:1]);
 let g=planes?arcade.geometryFromPlanes(planes):arcade.geometryFor(14);
 // Prism caps can have more than four sides: triangulate their centres.
 if(g.menuFaces.some(f=>f.vertices.length>4))g=arcade.geometryFromCells(g.menuFaces.flatMap((f,parent)=>f.vertices.length<=4?[{...f,parent}]:f.vertices.map((p,i)=>({parent,normal:f.normal,vertices:[f.center,p,f.vertices[(i+1)%f.vertices.length]]}))));
 return g;
}
function arrange(g,occupied){
 const spare=g.count-occupied;if(!spare)return g;
 const directions=g.menuFaces.map(f=>unit(f.center)),near=new Float64Array(g.count).fill(Infinity),used=new Set();
 for(let k=0;k<spare;k++){let best=-1,score=-Infinity;directions.forEach((p,i)=>{if(used.has(i))return;const d=k?near[i]:p[2];if(d>score){best=i;score=d;}});used.add(best);directions.forEach((p,i)=>near[i]=Math.min(near[i],1-dot(p,directions[best])));}
 const menuFaces=g.menuFaces.filter((_,i)=>!used.has(i)).concat(g.menuFaces.filter((_,i)=>used.has(i)));return {...g,menuFaces,faces:menuFaces.map(f=>f.vertices)};
}
function geometry(c,occupied,facetCount=null){
 c=normalize(c);if(c.length===10&&(c[6]||1)>1)return window.MTheorySections.geometry(c,facetCount===null?occupied:facetCount);const itemCount=occupied;occupied=facetCount===null?occupied*c[4]:facetCount;
 const key=c.join('-')+':'+occupied;if(cache.has(key))return cache.get(key);
 if(c.join('-')===defaults.join('-')&&occupied<=14)return arcade.geometryFor(14);
 const base=seed(c),capacity=Math.max(occupied,1);let frequency=Math.max(1,Math.ceil(Math.sqrt(capacity/base.count)));
 if(c[2]===10){let a=1,b=2;while(a<frequency){[a,b]=[b,a+b];}frequency=a;}
 if(c[5]===12)frequency*=2;
 let g=arcade.subdivideVE(frequency,base),cells=g.menuFaces;
 const nonlinear=[5,8,13].includes(c[2])||c[3]>1||[5,7,10,11,13,14].includes(c[5]);
 if(nonlinear)cells=cells.flatMap(f=>f.vertices.length===3?[f]:[ {...f,vertices:[f.vertices[0],f.vertices[1],f.vertices[2]]},{...f,vertices:[f.vertices[0],f.vertices[2],f.vertices[3]]}]);
 const transform=p=>{
  let [x,y,z]=p,rule=c[2],s=c[0],r=Math.hypot(x,y,z);
  if(rule===5){x*=Math.SQRT2/r;y*=Math.SQRT2/r;z*=Math.SQRT2/r;}
  if(rule===6)z*=(1+Math.sqrt(5))/2;
  if(rule===7)z*=Math.SQRT2;
  if(rule===8){const angle=z*Math.PI*(3-Math.sqrt(5));[x,y]=[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];}
  if(rule===13){const wave=1+.12*Math.sin(6*Math.atan2(y,x))*Math.sin(Math.PI*z/Math.SQRT2);x*=wave;y*=wave;z*=wave;}
  if(rule===11)z*=1+Math.log2(1+occupied/14)*.22;
  if(rule===12){const growth=1+Math.log2(1+occupied/14)*.08;x*=growth;y*=growth;z*=growth;}
  const influence=c[5],growth=Math.log2(1+occupied/14);
  if(influence===5||influence===7){const radius=Math.hypot(x,y,z)||1;x*=Math.SQRT2/radius;y*=Math.SQRT2/radius;z*=Math.SQRT2/radius;}
  if(influence===8)z*=(1+Math.sqrt(5))/2;
  if(influence===9)z*=Math.SQRT2;
  if([10,11,14].includes(influence)){const angle=influence===10?z*Math.PI*(3-Math.sqrt(5)):influence===11?.45*Math.tanh(z*3):.6*Math.sin(growth)*z;[x,y]=[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];if(influence===14)z*=1-.18*Math.sin(growth);}
  const direction=unit([x,y,z]);let lobes=0;
  if(c[3]>1){const mode=c[3],stage=Math.max(1,Math.floor(growth)+1),fib=[1,2,3,5,8,13],primes=[2,3,5,7,11,13],branches=mode===2?2:mode===3?3:mode===4?4:mode===5?2:mode===6?Math.min(12,stage*2):mode===7?12:mode===8?Math.min(14,stage*3):mode===9?fib[Math.min(5,stage)]:mode===10?primes[Math.min(5,stage)]:mode===11?4:mode===12?Math.min(14,stage*2):mode===13?1:4;
   for(let k=0;k<branches;k++){let d;if(mode===14)d=unit([[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]][k]);else if(mode===5)d=[0,0,k?1:-1];else{const angle=2*Math.PI*k/branches+(mode===8?k*.7:mode===11?(stage%2)*Math.PI/4:0),height=mode===6?.5:mode===8||mode===12?2*(k+.5)/branches-1:mode===13?1:0;d=unit([Math.cos(angle),Math.sin(angle),height]);}lobes=Math.max(lobes,Math.pow(Math.max(0,dot(direction,d)),12));}
  }
  if(influence===13)for(const d of [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]])lobes=Math.max(lobes,Math.pow(Math.max(0,dot(direction,unit(d))),8));
  const branchScale=1+Math.min(.9,growth*.22)*lobes;x*=branchScale;y*=branchScale;z*=branchScale;
  if(s===1){x+=.23*y+.13*z;y+=.17*z;x*=1.2;z*=.8;x+=.08*z*z;y+=.05*x*x;}
  if(s===2){x+=.28*y;y+=.17*z;}
  if(s===3){y+=.25*z;z*=.76;}
  if(s===4){x+=.25*z;z*=.76;}
  if(s===5){x+=.25*y;y*=.76;}
  if(s===10)z+=.2*(x*x+y*y);
  if(s===11){x*=1.24;z*=.72;}
  return [x,y,z];
 };
 // Triangulate non-affine symmetry too, keeping each label on its true plane.
 if(c[0]===10||c[0]===1)cells=cells.flatMap(f=>f.vertices.length===3?[f]:[{...f,vertices:f.vertices.slice(0,3)},{...f,vertices:[f.vertices[0],f.vertices[2],f.vertices[3]]}]);
 cells=cells.map(f=>{const vertices=f.vertices.map(transform),n=unit(cross(vertices[1].map((v,k)=>v-vertices[0][k]),vertices[2].map((v,k)=>v-vertices[0][k])));return {parent:f.parent,vertices,normal:dot(n,vertices[0])<0?n.map(v=>-v):n};});
 g=arcade.geometryFromCells(cells,frequency);
 // Keep the outer envelope around the retained VE core and within menu zoom limits.
 const radius=g.points.reduce((r,p)=>Math.max(r,Math.hypot(...p)),0),growth=[11,12].includes(c[2])?1+Math.log2(1+occupied/14)*.06:1,scale=Math.SQRT2*growth/radius;
 g=arcade.geometryFromCells(cells.map(f=>({...f,vertices:f.vertices.map(p=>p.map(v=>v*scale))})),frequency);
 if(c.length===7)g=window.G2Influences.apply(g,c[6]);g.configuration=c.slice();g=arcade.compactEmptyFacets(g,occupied);g.facetsPerItem=c[4];g.itemCount=itemCount;g.occupiedFacets=occupied;if(g.count<=32768)cache.set(key,g);if(cache.size>24)cache.delete(cache.keys().next().value);return g;
}
window.FacetGeometry={geometry,addFacets(configuration,facets){return geometry(configuration,facets/configuration[4],facets);}};
})();
