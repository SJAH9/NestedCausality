/* Native Arcade geometry/projection functions, extracted verbatim; see provenance.json. */
(()=>{'use strict';
const geometryCache=new Map();
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/Math.hypot(...a));
function geometryFor(requested){
 const count=14;
 if(geometryCache.has(count))return geometryCache.get(count);
 const vertices=[];
 for(let zero=0;zero<3;zero++)for(const a of [-1,1])for(const b of [-1,1]){const p=[0,0,0];p[(zero+1)%3]=a;p[(zero+2)%3]=b;vertices.push(p);}
 // Recover exact convex hull planes from the small canonical vertex sets.
 const planes=[],planeKeys=new Set();
 for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)for(let k=j+1;k<vertices.length;k++){
  const a=vertices[i],ab=vertices[j].map((v,t)=>v-a[t]),ac=vertices[k].map((v,t)=>v-a[t]),normal=cross(ab,ac);
  if(Math.hypot(...normal)<1e-8)continue;
  let n=unit(normal),d=dot(n,a);if(d<0){n=n.map(v=>-v);d=-d;}
  if(d<1e-8||vertices.some(p=>dot(n,p)>d+1e-7))continue;
  const key=[...n,d].map(v=>Math.round(v*1e7)).join(',');
  if(!planeKeys.has(key)){planeKeys.add(key);planes.push([n,d]);}
 }
 if(planes.length!==count)throw new Error('Invalid symmetric menu solid');
 const geometry=geometryFromPlanes(planes);geometry.basis='vector-equilibrium';geometry.subdivision=0;geometryCache.set(count,geometry);return geometry;
}
function geometryFromPlanes(planes){
 // Incremental convex clipping keeps the all-destinations shell practical as
 // cartridge/chapter routes grow. Each support plane still owns exactly one face.
 let polygons=[[[20,0,0],20],[[ -20,0,0],20],[[0,20,0],20],[[0,-20,0],20],[[0,0,20],20],[[0,0,-20],20]].map(([n])=>{
  n=unit(n);const u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(u,n);
  return [[-20,-20],[20,-20],[20,20],[-20,20]].map(([x,y])=>n.map((z,k)=>20*z+x*u[k]+y*v[k]));
 });
 for(const [planeIndex,[n,d]] of planes.entries()){
  const cut=[],next=[];
  for(const polygon of polygons){
   let outside=false;for(const p of polygon)if(dot(n,p)>d+1e-8){outside=true;break;}
   if(!outside){next.push(polygon);continue;}const out=[];
   for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=dot(n,a)-d,db=dot(n,b)-d;
    if(da<=1e-8)out.push(a);
    if((da< -1e-8&&db>1e-8)||(da>1e-8&&db< -1e-8)){const t=da/(da-db),p=a.map((z,k)=>z+t*(b[k]-z));out.push(p);cut.push(p);}
    else if(Math.abs(da)<=1e-8)cut.push(a);
   }if(out.length>=3){out.plane=polygon.plane;next.push(out);}
  }
  const unique=[...new Map(cut.map(p=>[p.map(v=>Math.round(v*1e7)).join(','),p])).values()];
  if(unique.length>=3){const u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(u,n),center=unique[0].map((_,k)=>unique.reduce((s,p)=>s+p[k],0)/unique.length);
   unique.sort((a,b)=>Math.atan2(dot(a.map((z,k)=>z-center[k]),v),dot(a.map((z,k)=>z-center[k]),u))-Math.atan2(dot(b.map((z,k)=>z-center[k]),v),dot(b.map((z,k)=>z-center[k]),u)));unique.plane=planeIndex;next.push(unique);
  }polygons=next;
 }
 // Tangent constraints can leave zero-area caps or collinear subdivisions.
 polygons=polygons.map(poly=>{let out=poly.slice(),changed=true;while(changed&&out.length>=3){changed=false;for(let i=0;i<out.length;i++){const a=out[(i+out.length-1)%out.length],b=out[i],c=out[(i+1)%out.length];if(Math.hypot(...cross(b.map((v,k)=>v-a[k]),c.map((v,k)=>v-b[k])))<1e-8){out.splice(i,1);changed=true;break;}}}out.plane=poly.plane;return out;}).filter(poly=>poly.length>=3);
 const raw=[...new Map(polygons.flat().map(p=>[p.map(v=>Math.round(v*1e7)).join(','),p])).values()];
 const scale=Math.SQRT2/Math.max(...raw.map(p=>Math.hypot(...p))),points=raw.map(p=>p.map(v=>v*scale)),edges=[],seen=new Set();
 const vertexKey=p=>p.map(v=>Math.round(v*1e7)).join(','),vertexIndex=new Map(raw.map((p,i)=>[vertexKey(p),i])),byPlane=new Map(polygons.map(p=>[p.plane,p]));
 const menuFaces=planes.flatMap(([normal,d],planeIndex)=>{
  if(!byPlane.has(planeIndex))return [];
  const n=unit(normal),poly=byPlane.get(planeIndex),center=[0,1,2].map(k=>poly.reduce((sum,p)=>sum+p[k]*scale,0)/poly.length);
  const u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(u,n);
  const indices=[...new Set(byPlane.get(planeIndex).map(p=>vertexIndex.get(vertexKey(p))))];
  indices.sort((a,b)=>Math.atan2(dot(points[a].map((z,k)=>z-center[k]),v),dot(points[a].map((z,k)=>z-center[k]),u))-Math.atan2(dot(points[b].map((z,k)=>z-center[k]),v),dot(points[b].map((z,k)=>z-center[k]),u)));
  indices.forEach((a,i)=>{const b=indices[(i+1)%indices.length],key=[a,b].sort((a,b)=>a-b).join(',');if(!seen.has(key)){seen.add(key);edges.push([a,b]);}});
  const vertices=indices.map(i=>points[i]);
  const xs=vertices.map(p=>dot(p,u)),ys=vertices.map(p=>dot(p,v)),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
  const base=center.map((n,k)=>n+loX*u[k]+hiY*v[k]),ux=u.map(n=>n*(hiX-loX)/960),vy=v.map(n=>-n*(hiY-loY)/960);
  const polygon=xs.map((x,i)=>[(x-loX)/(hiX-loX),(hiY-ys[i])/(hiY-loY)]);
  return [{center,normal:n,vertices,base,ux,vy,polygon}];
 });
 return {points,edges,faces:menuFaces.map(f=>f.vertices),menuFaces,camera:'outside',count:menuFaces.length};
}
// Integer frequency n splits each original square into n² squares and each
// original triangle into n² triangles. Every cell stays on its parent's plane;
// frequencies that are multiples share all earlier lattice vertices and edges.
function subdivideVE(frequency,ve=geometryFor(14)){
 const cells=[];
 for(const [parent,face]of ve.menuFaces.entries()){
  const [a,b,c,d]=face.vertices;
  if(d){
   const at=(i,j)=>a.map((v,k)=>v+(b[k]-v)*i/frequency+(d[k]-v)*j/frequency);
   for(let i=0;i<frequency;i++)for(let j=0;j<frequency;j++)cells.push({parent,normal:face.normal,vertices:[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)]});
  }else{
   const at=(i,j)=>a.map((v,k)=>v+(b[k]-v)*i/frequency+(c[k]-v)*j/frequency);
   for(let i=0;i<frequency;i++)for(let j=0;j<frequency-i;j++){
    cells.push({parent,normal:face.normal,vertices:[at(i,j),at(i+1,j),at(i,j+1)]});
    if(i+j<frequency-1)cells.push({parent,normal:face.normal,vertices:[at(i+1,j),at(i+1,j+1),at(i,j+1)]});
   }
  }
 }
 return geometryFromCells(cells,frequency);
}
function geometryFromCells(cells,frequency=1){
 const points=[],edges=[],vertexIndices=new Map(),edgeKeys=new Set();
 const vertexIndex=p=>{const key=p.map(v=>Math.round(v*1e8)).join(',');if(!vertexIndices.has(key)){vertexIndices.set(key,points.length);points.push(p);}return vertexIndices.get(key);};
 const menuFaces=cells.map(({parent,normal:n,vertices})=>{
  const indices=vertices.map(vertexIndex);
  indices.forEach((a,i)=>{const b=indices[(i+1)%indices.length],key=[a,b].sort((a,b)=>a-b).join(',');if(!edgeKeys.has(key)){edgeKeys.add(key);edges.push([a,b]);}});
  const center=[0,1,2].map(k=>vertices.reduce((sum,p)=>sum+p[k],0)/vertices.length),u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(u,n);
  const xs=vertices.map(p=>dot(p,u)),ys=vertices.map(p=>dot(p,v)),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
  const base=center.map((z,k)=>z+(loX-dot(center,u))*u[k]+(hiY-dot(center,v))*v[k]),ux=u.map(z=>z*(hiX-loX)/960),vy=v.map(z=>-z*(hiY-loY)/960),polygon=xs.map((x,i)=>[(x-loX)/(hiX-loX),(hiY-ys[i])/(hiY-loY)]);
  return {parent,center,normal:n,vertices,base,ux,vy,polygon};
 });
 return {points,edges,faces:menuFaces.map(f=>f.vertices),menuFaces,camera:'outside',count:menuFaces.length,basis:'vector-equilibrium',subdivision:frequency};
}
// Coalesce only unused coplanar cells. Occupied lattice faces retain their
// original positions; convex area equality prevents closing over occupied cells.
function compactEmptyFacets(g,occupied){
 if(occupied>=g.count||g.count<=14)return g;
 const key=p=>p.map(v=>Math.round(v*1e8)).join(','),groups=new Map();
 const area=(vertices,n)=>Math.abs(vertices.reduce((sum,p,i)=>sum+dot(cross(p,vertices[(i+1)%vertices.length]),n),0))/2;
 const hull=(vertices,n)=>{const u=unit(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),v=cross(u,n),unique=[...new Map(vertices.map(p=>[key(p),p])).values()].map(p=>({p,x:dot(p,u),y:dot(p,v)})).sort((a,b)=>a.x-b.x||a.y-b.y),turn=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=points=>{const h=[];for(const p of points){while(h.length>1&&turn(h.at(-2),h.at(-1),p)<=1e-9)h.pop();h.push(p);}return h;},lo=half(unique),hi=half(unique.slice().reverse());return lo.slice(0,-1).concat(hi.slice(0,-1)).map(p=>p.p);};
 for(const f of g.menuFaces.slice(occupied)){const plane=[...f.normal,dot(f.normal,f.vertices[0])].map(v=>Math.round(v*1e6)).join(',');if(!groups.has(plane))groups.set(plane,[]);groups.get(plane).push({parent:f.parent,normal:f.normal,vertices:f.vertices,area:area(f.vertices,f.normal)});}
 const empty=[];
 for(let cells of groups.values()){
  const normal=cells[0].normal,distance=dot(normal,cells[0].vertices[0]);if(cells.some(f=>f.vertices.some(p=>Math.abs(dot(normal,p)-distance)>1e-8))){empty.push(...cells);continue;}
  const whole=hull(cells.flatMap(f=>f.vertices),cells[0].normal),total=cells.reduce((s,f)=>s+f.area,0);
  if(Math.abs(area(whole,cells[0].normal)-total)<1e-7){empty.push({...cells[0],vertices:whole});continue;}
  let changed=true;while(changed){changed=false;const edgeMap=new Map();outer:for(let i=0;i<cells.length;i++){const f=cells[i];for(let k=0;k<f.vertices.length;k++){const edge=[key(f.vertices[k]),key(f.vertices[(k+1)%f.vertices.length])].sort().join('|');if(edgeMap.has(edge)){const j=edgeMap.get(edge),other=cells[j],vertices=hull([...f.vertices,...other.vertices],f.normal);if(Math.abs(area(vertices,f.normal)-f.area-other.area)<1e-7){cells[j]={...other,vertices,area:f.area+other.area};cells.splice(i,1);changed=true;break outer;}}else edgeMap.set(edge,i);}}}
  empty.push(...cells);
 }
 // Preserve the fine boundary vertices on coarse empty panels, keeping the
 // resulting surface closed at the original mesh's shared edges.
 if(empty.length===g.count-occupied)return g;
 const boundary=empty.map(f=>{let vertices=[];for(let i=0;i<f.vertices.length;i++){const a=f.vertices[i],b=f.vertices[(i+1)%f.vertices.length],ab=b.map((v,k)=>v-a[k]),length=dot(ab,ab);const points=g.points.map(p=>({p,t:dot(p.map((v,k)=>v-a[k]),ab)/length})).filter(({p,t})=>t>=-1e-8&&t<1-1e-8&&Math.hypot(...p.map((v,k)=>v-a[k]-t*ab[k]))<1e-7).sort((x,y)=>x.t-y.t);vertices.push(...points.map(p=>p.p));}for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],c=vertices[(i+2)%vertices.length];if(Math.hypot(...cross(b.map((v,k)=>v-a[k]),c.map((v,k)=>v-a[k])))>1e-8){vertices=vertices.slice(i).concat(vertices.slice(0,i));break;}}return {...f,vertices};});
 const result=geometryFromCells([...g.menuFaces.slice(0,occupied),...boundary],g.subdivision||1),incidence=new Map(),edgeKey=p=>p.map(v=>Math.round(v*1e7)).join(',');for(const f of result.menuFaces)for(let i=0;i<f.vertices.length;i++){const edge=[edgeKey(f.vertices[i]),edgeKey(f.vertices[(i+1)%f.vertices.length])].sort().join('|');incidence.set(edge,(incidence.get(edge)||0)+1);}if([...incidence.values()].some(n=>n!==2))return g;return {...g,...result,uncompactedCount:g.count,occupiedFacets:occupied};
}
// Grow item territories over shared edges, preserving every original assignment.
function facetTerritories(g,itemCount,width=1){
 const occupied=Math.min(g.count,itemCount*width),owners=Array.from({length:g.count},(_,i)=>i<occupied?Math.floor(i/width):-1),key=p=>p.map(v=>Math.round(v*1e7)).join(','),edges=new Map(),neighbors=Array.from({length:g.count},()=>[]);
 g.menuFaces.forEach((f,i)=>f.vertices.forEach((p,j)=>{const k=[key(p),key(f.vertices[(j+1)%f.vertices.length])].sort().join('|');if(!edges.has(k))edges.set(k,[]);edges.get(k).push(i);}));
 for(const fs of edges.values())for(const a of fs)for(const b of fs)if(a!==b)neighbors[a].push(b);
 const distance=Array(g.count).fill(Infinity),heap=[],push=v=>{heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=v[0])break;heap[i]=heap[p];i=p;}heap[i]=v;},pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1][0]<heap[j][0])j++;if(last[0]<=heap[j][0])break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
 for(let i=0;i<occupied;i++){distance[i]=0;push([0,i]);}
 while(heap.length){const [d,i]=pop();if(d!==distance[i])continue;for(const j of neighbors[i]){if(j<occupied)continue;const next=d+Math.hypot(...g.menuFaces[i].center.map((v,k)=>v-g.menuFaces[j].center[k]));if(next<distance[j]-1e-10||(Math.abs(next-distance[j])<1e-10&&owners[i]<owners[j])){distance[j]=next;owners[j]=owners[i];push([next,j]);}}}
 // Disconnected experimental meshes still attach to the nearest seeded group.
 if(occupied)for(let i=occupied;i<g.count;i++)if(owners[i]<0){let nearest=Infinity;for(let j=0;j<occupied;j++){const d=Math.hypot(...g.menuFaces[i].center.map((v,k)=>v-g.menuFaces[j].center[k]));if(d<nearest){nearest=d;owners[i]=owners[j];}}}
 const boundary=g.edges.filter(([a,b])=>{const fs=edges.get([key(g.points[a]),key(g.points[b])].sort().join('|'))||[];return fs.length!==2||owners[fs[0]]<0||owners[fs[0]]!==owners[fs[1]];});
 return {...g,edges:boundary,faceItems:owners,occupiedFacets:occupied?g.count:0,itemCount,territoryAnchors:surfaceAnchors(g,owners)};
}
// Freeze each territory's center and tangent frame in object coordinates.
function surfaceAnchors(g,owners){
 const groups=new Map(),sub=(a,b)=>a.map((v,k)=>v-b[k]),add=(a,b)=>a.map((v,k)=>v+b[k]),scale=(a,t)=>a.map(v=>v*t);
 g.menuFaces.forEach((f,index)=>{const item=owners[index];if(item<0)return;if(!groups.has(item))groups.set(item,[]);groups.get(item).push(index);});
 return [...groups].map(([item,faces])=>{
  let area=0,sum=[0,0,0];const triangles=[];
  for(const index of faces){const f=g.menuFaces[index];for(let j=1;j<f.vertices.length-1;j++){const [a,b,c]=[f.vertices[0],f.vertices[j],f.vertices[j+1]],weight=Math.hypot(...cross(sub(b,a),sub(c,a)))/2;if(weight<1e-14)continue;area+=weight;sum=add(sum,scale(add(add(a,b),c),weight/3));triangles.push({index,a,b,c});}}
  const centroid=scale(sum,1/(area||1));let anchor=null,face=faces[0],nearest=Infinity;
  for(const {index,a,b,c}of triangles){const ab=sub(b,a),ac=sub(c,a),n=unit(cross(ab,ac)),projected=sub(centroid,scale(n,dot(sub(centroid,a),n))),ap=sub(projected,a),d00=dot(ab,ab),d01=dot(ab,ac),d11=dot(ac,ac),d20=dot(ap,ab),d21=dot(ap,ac),den=d00*d11-d01*d01,v=(d11*d20-d01*d21)/den,w=(d00*d21-d01*d20)/den;const candidates=[];if(v>=-1e-9&&w>=-1e-9&&v+w<=1+1e-9)candidates.push(projected);
   for(const [p,q]of [[a,b],[b,c],[c,a]]){const edge=sub(q,p),t=Math.max(0,Math.min(1,dot(sub(centroid,p),edge)/dot(edge,edge)));candidates.push(add(p,scale(edge,t)));}
   for(const point of candidates){const distance=dot(sub(point,centroid),sub(point,centroid));if(distance<nearest-1e-12){nearest=distance;anchor=point;face=index;}}
  }
  anchor ||=g.menuFaces[face].center;const normal=g.menuFaces[face].normal,u=unit(g.menuFaces[face].ux),v=unit(g.menuFaces[face].vy),vertices=faces.flatMap(i=>g.menuFaces[i].vertices),xs=vertices.map(p=>dot(sub(p,anchor),u)),ys=vertices.map(p=>dot(sub(p,anchor),v)),width=Math.max(1e-6,Math.max(...xs)-Math.min(...xs)),height=Math.max(1e-6,Math.max(...ys)-Math.min(...ys));
  return {item,faces,face,anchor,normal,u,v,width,height};
 });
}
// Circular least-squares compromise of visible label baselines, weighted by projected area.
// The correction is frozen once per rest, so conflicting facet frames cannot cause drift.
function uprightCorrection(g,turn,camera,focal,w,h){
 let x=0,y=0,total=0;
 for(const t of g.territoryAnchors||[]){
  const p=turn(t.anchor).map((v,k)=>v-camera[k]),n=turn(t.normal),facing=-dot(n,p)/Math.hypot(...p);
  if(p[2]<=.06||facing<=.03)continue;
  const sx=w/2+focal*p[0]/p[2],sy=h/2-focal*p[1]/p[2];if(sx<0||sx>w||sy<0||sy>h)continue;
  const u=turn(t.u),dx=u[0]*p[2]-p[0]*u[2],dy=-(u[1]*p[2]-p[1]*u[2]),length=Math.hypot(dx,dy);
  if(length<1e-9)continue;const weight=t.width*t.height*facing/(p[2]*p[2]);x+=weight*dx/length;y+=weight*dy/length;total+=weight;
 }
 return Math.hypot(x,y)>total*1e-6?-Math.atan2(y,x):0;
}
// Project a fixed surface frame: no screen-space recentering or billboarding.
function territoryLabels(renderer,facets,labelFor,selected,w,h,g,turn,camera,focal,offset=[0,0,0],fontSize=112){
 const visible=new Set(facets.map(f=>f.item)),result=[],cx=w/2,cy=h/2;
 for(const t of g.territoryAnchors||[]){if(!visible.has(t.item))continue;const center=turn(t.anchor.map((v,k)=>v+offset[k])).map((v,k)=>v-camera[k]),normal=turn(t.normal);if(center[2]<=.06||dot(normal,center)>=-.03)continue;
  const base=turn(t.anchor.map((v,k)=>v+offset[k]-t.u[k]*t.width/2-t.v[k]*t.height/2)).map((v,k)=>v-camera[k]),ux=turn(t.u.map(v=>v*t.width/960)),vy=turn(t.v.map(v=>v*t.height/960)),matrix=[focal*ux[0]+cx*ux[2],cy*ux[2]-focal*ux[1],0,ux[2],focal*vy[0]+cx*vy[2],cy*vy[2]-focal*vy[1],0,vy[2],0,0,1,0,focal*base[0]+cx*base[2],cy*base[2]-focal*base[1],0,base[2]];
  renderer.label(matrix,labelFor(t.item),true,false,t.item===selected,w,h,null,fontSize,t.width/t.height);result.push({item:t.item,faces:t.faces,anchor:t.anchor,face:t.face,x:cx+focal*center[0]/center[2],y:cy-focal*center[1]/center[2],matrix});
 }return result;
}
// Relax the departing support planes while introducing the destination's planes.
// One continuously clipped solid remains at the same center throughout the morph.
function morphGeometry(from,to,t){
 if(t<=0||from===to)return from;if(t>=1)return to;
 const radius=Math.SQRT2;
 const planes=[...from.menuFaces.map(f=>[f.normal,dot(f.normal,f.center)*(1-t)+radius*t]),...to.menuFaces.map(f=>[f.normal,radius*(1-t)+dot(f.normal,f.center)*t])];
 // Matching parallel constraints share one plane, avoiding duplicate mesh faces.
 const merged=new Map();for(const [n,d] of planes){const key=n.map(v=>Math.round(v*1e7)).join(',');if(!merged.has(key)||d<merged.get(key)[1])merged.set(key,[n,d]);}
 return geometryFromPlanes([...merged.values()]);
}
function hoverCallout(host,id,hitFor,labelFor){
 const output=document.createElement('output');output.id=id;output.className='geometry-hover';output.hidden=true;host.append(output);let pointer=null;
 host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(e.target.closest('.facet-callout,.lab-callout,nav,#lab-actions,#facet-lab-tools,#facet-lab-left')){pointer=null;return;}pointer=[e.clientX,e.clientY];},{capture:true});
 host.addEventListener('pointerleave',()=>{pointer=null;output.hidden=true;});
 return {update(){const r=host.getBoundingClientRect(),point=pointer&&[pointer[0]-r.left,pointer[1]-r.top],hit=point&&hitFor().find(f=>{let sign=0;return f.polygon.every((a,i)=>{const b=f.polygon[(i+1)%f.polygon.length],v=(b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]);if(Math.abs(v)<1e-6)return true;if(!sign)sign=Math.sign(v);return Math.sign(v)===sign;});});output.hidden=!hit;if(hit){output.textContent=labelFor(hit);output.dataset.item=hit.item??hit.index;output.dataset.facet=hit.face??hit.index;}else{delete output.dataset.item;delete output.dataset.facet;}}};
}

window.Arcade={geometryFor,geometryFromPlanes,subdivideVE,geometryFromCells,compactEmptyFacets,facetTerritories,surfaceAnchors,uprightCorrection,territoryLabels,morphGeometry,hoverCallout,state:{feature:null},pauseNavigation(){},refreshGeometry(){}};
})();
