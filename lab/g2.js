/* G2 influences receive a completed explorer mesh. No independent parameter controls. */
(()=>{'use strict';
const source='https://arxiv.org/abs/1909.09717';
const terms=[[0,1,2,1],[0,3,4,1],[0,5,6,1],[1,3,5,1],[1,4,6,-1],[2,3,6,-1],[2,4,5,-1]];
const catalog=[
 ['VE','Explorer geometry','Keep the explorer geometry.'],
 ['R⁷','Flat G₂ · R⁷','Lift the explorer into flat seven-dimensional coordinates and retain its XYZ projection.'],
 ['T⁷','Flat G₂ · T⁷','Use explorer coordinates as periodic angles on the flat seven-torus.'],
 ['×','G₂ cross product','The explorer position and incident face normals supply the seven-dimensional cross product.'],
 ['A','Associative frame','Build an associative three-plane from the explorer position, normal and their G₂ cross product.'],
 ['A⊥','Coassociative complement','Project the explorer lift onto the four-plane perpendicular to an associative coordinate plane.'],
 ['C','Cone · S³ × S³','Explorer position and face normals supply two S³ charts and the radial coordinate of the cone.'],
 ...terms.map(([a,b,c,sign])=>['φ'+[a+1,b+1,c+1].join(''),'Associative '+[a+1,b+1,c+1].join(' · '),'Project explorer relationships onto the '+(sign<0?'negatively':'positively')+' oriented associative coordinate plane.'])
].map(([symbol,name,description],i)=>({symbol,name,description,source:i===6?'https://arxiv.org/abs/hep-th/0107177':source}));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),unit=a=>a.map(x=>x/(Math.hypot(...a)||1));
function cross(a,b){const r=Array(7).fill(0);for(const [i,j,k,s]of terms){r[k]+=s*(a[i]*b[j]-a[j]*b[i]);r[i]+=s*(a[j]*b[k]-a[k]*b[j]);r[j]+=s*(a[k]*b[i]-a[i]*b[k]);}return r;}
function lift([x,y,z]){return [x,y,z,(x+y)/Math.SQRT2,(y+z)/Math.SQRT2,(z+x)/Math.SQRT2,(x-y+z)/Math.sqrt(3)];}
const project=a=>[a[0]+.35*a[3]+.2*a[6],a[1]+.35*a[4]-.2*a[6],a[2]+.35*a[5]+.2*a[6]];
function apply(g,type){if(type===1)return g;
 if([3,4,5,7].includes(type))g=Arcade.geometryFromCells(g.menuFaces.flatMap(f=>f.vertices.length===3?[f]:Array.from({length:f.vertices.length-2},(_,i)=>({...f,vertices:[f.vertices[0],f.vertices[i+1],f.vertices[i+2]]}))),g.subdivision);
 const normals=g.points.map(()=>[0,0,0]),keys=new Map(g.points.map((p,i)=>[p.map(x=>x.toFixed(7)).join(','),i]));
 for(const f of g.menuFaces)for(const p of f.vertices){const i=keys.get(p.map(x=>x.toFixed(7)).join(','));if(i!==undefined)for(let k=0;k<3;k++)normals[i][k]+=f.normal[k];}
 const edges=g.edges.map(([a,b])=>Math.hypot(...g.points[a].map((x,i)=>x-g.points[b][i]))).filter(Number.isFinite);
 const meanEdge=edges.reduce((a,b)=>a+b,0)/(edges.length||1),samples=[];
 const transformed=g.points.map((p,i)=>{
  const q=lift(p),n=unit(lift(unit(normals[i]))),r=Math.hypot(...p),u=unit(q);let t=n.map((x,k)=>x-dot(n,u)*u[k]),ambient=q,display;
  if(Math.hypot(...t)<1e-8){const axis=Array(7).fill(0);axis[u.reduce((best,x,k)=>Math.abs(x)<Math.abs(u[best])?k:best,0)]=1;t=axis.map((x,k)=>x-dot(axis,u)*u[k]);}t=unit(t);
  if(type===2)display=p.slice();
  else if(type===3){ambient=q.map(x=>((x%(2*Math.PI))+2*Math.PI)%(2*Math.PI));display=project(ambient.map(Math.sin));}
  else if(type===4){ambient=cross(q,n);display=project(ambient).map((x,k)=>p[k]+.35*x);}
  else if(type===5){const w=cross(u,t),angle=Math.atan2(p[1],p[0]);ambient=u.map((x,k)=>r*(Math.cos(angle)*x+Math.sin(angle)*t[k]+.25*Math.sin(r)*w[k]));display=project(ambient);}
  else if(type===6){ambient=q.map((x,k)=>k<3?0:x);display=project(ambient);}
  else if(type===7){const stereo=v=>{const d=1+dot(v,v);return [...v.map(x=>2*x/d),(dot(v,v)-1)/d];},a=stereo(p),b=stereo(unit(normals[i]));ambient=[r,...a,...b];display=[r*(a[0]+.35*b[0]),r*(a[1]+.35*b[1]),r*(a[2]+.35*b[2])];}
  else{const term=terms[type-8],indices=term.slice(0,3);ambient=q.map((x,k)=>indices.includes(k)?x:0);display=indices.map((k,j)=>q[k]*(j===2?term[3]:1));}
  samples.push({input:p,normal:unit(normals[i]),source:ambient,display});return display;
 });
 const bound=transformed.reduce((r,p)=>Math.max(r,Math.hypot(...p)),0)||1,scale=type===2?1:Math.SQRT2/bound;
 const cells=g.menuFaces.map(f=>{const vertices=f.vertices.map(p=>{const i=keys.get(p.map(x=>x.toFixed(7)).join(','));return transformed[i].map(x=>x*scale);}),a=vertices[1].map((x,k)=>x-vertices[0][k]),b=vertices[2].map((x,k)=>x-vertices[0][k]),normal=unit([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);return {vertices,normal,parent:f.parent};});
 const mesh=Arcade.geometryFromCells(cells,g.subdivision);mesh.g2={type,name:catalog[type-1].name,inputVertices:g.points.length,inputFaces:g.count,meanEdge,displayScale:scale,source,metricStatus:type===2||type===3?'flat standard G2 structure':'explorer influence; no torsion-free metric solve',samples};return mesh;
}
window.G2Influences={catalog,terms,cross,lift,apply};
})();
