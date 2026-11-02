(()=>{'use strict';
const $=id=>document.getElementById(id),cv=$('ve'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),tree={foyer:{label:'THE ARCADE LAB',items:[['Arcade Games','games'],['Theater','theater'],['Forbidden Knowledge','forbidden'],['The End of The World','end-world'],['Time Machine','time-machine'],['ə','schwa']]},games:{label:'ARCADE GAMES',items:[['Missile Command','defense'],['Matrix','matrix'],['StarWords','starwords']]},theater:{label:'THE THEATER',items:[['Sci-Fi','scifi'],['Documentary','documentary'],['Standard','standard-titles']]},scifi:{label:'SCI-FI',items:[['Unreal Again','unreal'],['Unreal Again 2: The Nocturns','nocturns']]},documentary:{label:'DOCUMENTARY',items:[['From The Many: One','many'],['0∞','zero'],['The Civic Enclosure','civic']]},forbidden:{label:'FORBIDDEN KNOWLEDGE',items:[]},'end-world':{label:'THE END OF THE WORLD',items:[]},'time-machine':{label:'TIME MACHINE',items:[]},schwa:{label:'ə',items:[]}},parents={forbidden:'foyer','end-world':'foyer','time-machine':'foyer',schwa:'foyer',games:'foyer',theater:'foyer',scifi:'theater',documentary:'theater'},games=['defense','matrix','starwords'],titles={defense:'Missile Command',matrix:'Matrix',starwords:'StarWords',unreal:'Unreal Again',nocturns:'Unreal Again 2: The Nocturns',many:'From The Many: One',zero:'0∞',civic:'The Civic Enclosure'};

// Explicit title-to-cartridge bindings. An entry exists only for a retained score.
const featureRoutes={
 'automatic-ignorance':{title:'Automatic Ignorance',parent:'theater',url:'automatic-ignorance/reader.html'},
 'imagine-this-standard':{title:'Standard',parent:'imagine-this',url:'scored/imagine-this/reader.html'},
 'imagine-this-stagezero':{title:'Stagecraft/0∞',parent:'imagine-this-authoros-menu',url:'scored/imagine-this/stagezero.html'},
 'imagine-this-authoros':{title:'0∞/TextBook/Stagecraft',parent:'imagine-this-authoros-menu',url:'scored/imagine-this/authoros.html'},
 'upload-wars':{title:'Upload Wars',parent:'authoros-titles',url:'scored/upload-wars/reader.html'},
 'standard-catastrophism':{title:'Catastrophism',parent:'standard-titles',url:'scored.html?cartridge=standard'},
 'authoros-catastrophism':{title:'Catastrophism',parent:'authoros-titles',url:'scored.html?cartridge=authoros-reader'},
 'cinema-catastrophism':{title:'Catastrophism',parent:'cinema-titles',url:'scored.html?cartridge=storyboard-cinema'},
 'stagecraft-catastrophism':{title:'Catastrophism',parent:'stagecraft-titles',url:'scored.html?cartridge=stagecraft'},
 'stagecraft-unreal':{title:'Unreal Again',parent:'stagecraft-titles',url:'viewers/unreal.html'},
 'witnesseth-many':{title:'From The Many: One',parent:'witnesseth-titles',url:'viewers/many.html'},
 'schwa-causality':{title:'Causality and Attraction',parent:'schwa-titles',url:'viewers/schwa.html?volume=s1-v1'},
 'zero-original':{title:'The Zero Infinity',parent:'zero-titles',url:'viewers/zero.html'},
 'zero-catastrophism':{title:'Catastrophism',parent:'zero-titles',url:'scored.html?cartridge=zero'}
};
parents['imagine-this']='forbidden';
parents['imagine-this-authoros-menu']='imagine-this';
Object.assign(tree,{
 'imagine-this':{label:'IMAGINE THIS',items:[['Standard','imagine-this-standard'],['AuthorOS','imagine-this-authoros-menu']]},
 'imagine-this-authoros-menu':{label:'AUTHOROS',items:[['Stagecraft/0∞','imagine-this-stagezero'],['0∞/TextBook/Stagecraft','imagine-this-authoros']]},
 forbidden:{label:'FORBIDDEN KNOWLEDGE',items:[['Imagine This','imagine-this'],['AuthorOS','authoros-titles']]},
 'end-world':{label:'THE END OF THE WORLD',items:[['Storyboard Cinema','cinema-titles'],['Stagecraft','stagecraft-titles']]},
 'time-machine':{label:'TIME MACHINE',items:[['Witnesseth','witnesseth-titles']]},
 schwa:{label:'ə',items:[['ə','schwa-titles'],['0∞','zero-titles']]}
});
for(const [name,parent,label] of [['standard-titles','theater','Standard'],['authoros-titles','forbidden','AuthorOS'],['cinema-titles','end-world','Storyboard Cinema'],['stagecraft-titles','end-world','Stagecraft'],['witnesseth-titles','time-machine','Witnesseth'],['schwa-titles','schwa','ə'],['zero-titles','schwa','0∞']]){
 tree[name]={label,items:Object.entries(featureRoutes).filter(([,f])=>f.parent===name).map(([id,f])=>[f.title,id])};parents[name]=parent;
}
tree.theater.items.push(['Automatic Ignorance','automatic-ignorance']);
tree.forbidden.items.push(['Automatic Ignorance','automatic-ignorance']);
// Only retained scores with verified public recordings enter this catalog.
if(window.ArcadeCubeCatalog?.books?.length){
 tree.forbidden.items.push(['Cube Study','cube-books']);
 tree['cube-books']={label:'CUBE STUDY · BOOKS',items:[]};parents['cube-books']='forbidden';
 for(const book of window.ArcadeCubeCatalog.books){
  const menu='cube-'+book.id,pages=1+Math.ceil(Math.max(0,book.chapters.length-12)/11);
  tree['cube-books'].items.push([book.title,menu]);parents[menu]='cube-books';
  tree[menu]={label:book.title,items:[['Complete book',menu+'-full'],['Chapters',menu+'-chapters-0']]};
  const url=(chapter)=>book.viewer+'?volume='+encodeURIComponent(book.volume)+'&cartridge=cube&t=0&p=0'+(chapter?'&chapter='+encodeURIComponent(chapter.id):'');
  featureRoutes[menu+'-full']={title:book.title,parent:menu,url:url()};
  for(let page=0;page<pages;page++){
   const name=menu+'-chapters-'+page;parents[name]=menu;
   tree[name]={label:book.title+' · CHAPTERS '+(page+1)+'/'+pages,paged:pages>1,items:[]};
   for(const chapter of book.chapters.slice(page?12+(page-1)*11:0,page?12+page*11:12)){
    const id=menu+'-'+chapter.id;tree[name].items.push([chapter.title,id]);
    featureRoutes[id]={title:chapter.title,parent:name,url:url(chapter)};
   }
   if(page<pages-1)tree[name].items.push(['Next chapters',menu+'-chapters-'+(page+1),1]);
   if(page>0)tree[name].items.push(['Previous chapters',menu+'-chapters-'+(page-1),3]);
  }
 }
}
// Every chapter room now contains its complete chapter list. Existing page IDs
// remain aliases so saved chapter links and their return routes still work.
for(const id of Object.keys(tree).filter(id=>/^cube-.+-chapters-0$/.test(id))){
 const prefix=id.slice(0,-1),pages=Object.keys(tree).filter(key=>key.startsWith(prefix)&&/^\d+$/.test(key.slice(prefix.length))).sort((a,b)=>Number(a.slice(prefix.length))-Number(b.slice(prefix.length)));
 const entries=pages.flatMap(key=>tree[key].items.filter(([label])=>!/^(Next|Previous) chapters$/.test(label)));
 for(const page of pages){tree[page].items=entries.slice();tree[page].paged=false;tree[page].label=tree[id].label.replace(/ · CHAPTERS .*$/,' · CHAPTERS');}
}
// Native availability comes from loaded supports() checks against the public catalog.
// Each volume owns full playback and bounded chapter routes; no score is generated.
if(window.ArcadeCartridgeCatalog){
 tree.foyer.items.push(['Cartridges','cartridges']);
 tree.cartridges={label:'CARTRIDGES',items:[]};parents.cartridges='foyer';
 for(const cartridge of ArcadeCartridgeCatalog.cartridges){
  const id='cart-'+cartridge.id;tree.cartridges.items.push([cartridge.label,id]);parents[id]='cartridges';
  tree[id]={label:cartridge.label,items:[]};
  for(const volume of cartridge.volumes){
   const book=id+'-'+volume.id,chapters=book+'-chapters';parents[book]=id;parents[chapters]=book;
   tree[id].items.push([volume.title,book]);
   tree[book]={label:volume.title,items:[['Complete volume',book+'-full'],['Chapters',chapters]]};
   tree[chapters]={label:volume.title+' · CHAPTERS',items:[]};
   featureRoutes[book+'-full']={title:volume.title,parent:book,url:volume.url};
   volume.chapters.forEach((chapter,index)=>{
    const key=book+'-chapter-'+index,end=chapter.end??volume.chapters[index+1]?.start??volume.duration;
    tree[chapters].items.push([chapter.title,key]);
    featureRoutes[key]={title:chapter.title,parent:chapters,url:volume.url,clip:{id:chapter.id,start:chapter.start,end}};
   });
  }
 }
}
for(const [id,f]of Object.entries(featureRoutes))titles[id]=f.title;
// [ff] indexes every menu and playable destination on one symmetric shell.
const menuPath=id=>{const path=[],seen=new Set();while(id&&tree[id]&&!seen.has(id)){seen.add(id);path.unshift(tree[id].label);id=parents[id];}return path;};
const ffDestinations=new Map();
for(const id of Object.keys(tree))ffDestinations.set(id,menuPath(id).join(' / '));
for(const [id,title] of Object.entries(titles)){
 const parent=featureRoutes[id]?.parent||(games.includes(id)?'games':['unreal','nocturns'].includes(id)?'scifi':'documentary');
 ffDestinations.set(id,[...menuPath(parent),title].join(' / '));
}
tree.ff={label:'[ff]',expanded:true,items:[...ffDestinations].map(([id,label])=>[label,id])};parents.ff='foyer';
tree.foyer.items.push(['[ff]','ff']);

// Room size follows its actual options; no artificial fourteen-item page limit.
for(const [id,room] of Object.entries(tree)){
 if(parents[id])room.items.push(['Back',parents[id],0]);
 room.paged=false;room.expanded=room.items.length>14;
}

const sessionKey='arcade:navigation-session';
let savedNavigation=null;try{savedNavigation=JSON.parse(sessionStorage.getItem(sessionKey)||'null');}catch{}
let routeInitialized=false;
const homeDistance=4.5;
let viewDistance=homeDistance,renderer;
const rotationStep=Math.PI/12,stepInterval=80;
const detent=angle=>Math.round(angle/rotationStep)*rotationStep;
let landing=false,roll=Math.PI/4,autoSpinning=false,lastInteraction=performance.now();
const idleDelay=1200,idleCycle=3900,idlePause=3000;
let idleTour=null,idleUpright=null,lastRotation=-Infinity,previousRotation=null;
function counterclockwiseDelta(from,to){
 const tau=2*Math.PI,delta=((from-to)%tau+tau)%tau;
 return delta<1e-7||tau-delta<1e-7?0:-delta;
}
let spinYaw=0,spinPitch=0,spinSteps=0,axisChanges=0,dragPointer=null,dragSample=null;
function haltSpin(){idleUpright=null;idleTour=null;autoSpinning=false;landing=false;spinYaw=spinPitch=0;spinSteps=0;}
let node='foyer',selected=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,feature=null,api=null,last=null,library=[],orientationDone=false,launchToken=0,baseFace=0,passage=null,entered=Boolean(savedNavigation?.entered)||Boolean(titles[new URLSearchParams(location.search).get('feature')]),wasFullscreen=false,lastBackAt=-Infinity;
// Every menu starts with the canonical vector equilibrium. Larger shells are
// radial subdivisions of its six square and eight triangular faces.
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
let currentGeometry=geometryFor(tree.foyer.items.length),allMenuFaces=currentGeometry.menuFaces;
try{renderer=new VERenderer(cv,currentGeometry.faces,currentGeometry.points,currentGeometry.edges);}catch(e){const p=document.createElement('p');p.className='room-notice';p.textContent=e.message;$('lobby').append(p);throw e;}
const environment=new ArcadeEnvironment($('lobby'));
let foyerGeometry=null;
const foyerView={yaw:Math.PI/4,pitch:Math.asin(1/Math.sqrt(3))};
function roomGeometry(id){
 if(window.FacetLab?.hasSavedConfiguration)return window.FacetLab.menuGeometry(tree[id].items.length);
 if(tree[id].expanded){
  const required=tree[id].items.length,key='all-'+required;
  if(!geometryCache.has(key)){
   const frequency=Math.ceil(Math.sqrt(required/14)),g=compactEmptyFacets(subdivideVE(frequency),required);
   if(g.count<required)throw Error('Insufficient all-menu facets');geometryCache.set(key,g);
  }
  return geometryCache.get(key);
 }
 if(id!=='foyer')return geometryFor(tree[id].paged?14:tree[id].items.length);
 if(!foyerGeometry){
  const g=geometryFor(14),a=foyerView.yaw,b=foyerView.pitch;
  // Assign the top-level categories to the nearest/front facets.
  const facing=f=>{const [x,y,z]=f.normal;return -(z*Math.cos(a)+x*Math.sin(a))*Math.cos(b)-y*Math.sin(b)-dot(f.normal,f.center)/homeDistance;};
  const menuFaces=g.menuFaces.slice().sort((a,b)=>facing(b)-facing(a));
  foyerGeometry={...g,menuFaces,faces:menuFaces.map(f=>f.vertices)};
 }
 return foyerGeometry;
}
function useGeometry(id){currentGeometry=facetTerritories(roomGeometry(id),tree[id].items.length,facetsPerItem());allMenuFaces=currentGeometry.menuFaces;renderer.setGeometry(currentGeometry.faces,currentGeometry.points,currentGeometry.edges);}
const recovery=document.createElement('button');recovery.id='arcade-fullscreen';recovery.textContent='⛶';recovery.title='Restore fullscreen';recovery.setAttribute('aria-label','Restore fullscreen');document.body.append(recovery);recovery.onclick=()=>void full().catch(()=>{});
const navigation=document.createElement('nav');navigation.id='facet-navigation';navigation.setAttribute('aria-label','Room navigation');
const returnButton=document.createElement('button');returnButton.textContent='← Back';returnButton.onclick=back;
const roomName=document.createElement('span'),help=document.createElement('span');help.textContent='Drag to step · Pinch to zoom · Touch to stop · Tap a face to enter';navigation.append(returnButton,roomName,help);$('lobby').append(navigation);

// Four readable titles track the nearest complete front-facing facets.
const calloutLayer=document.createElement('div');calloutLayer.id='facet-callouts';
const calloutSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');calloutSvg.setAttribute('aria-hidden','true');calloutLayer.append(calloutSvg);
let projectedFacets=[];
const callouts=[[.2,.14],[.8,.14],[.2,.81],[.8,.81],[.12,.48],[.88,.48]].map(([x,y])=>{
 const line=document.createElementNS(calloutSvg.namespaceURI,'line'),dot=document.createElementNS(calloutSvg.namespaceURI,'circle');dot.setAttribute('r','3');calloutSvg.append(line,dot);
 const button=document.createElement('button');button.className='facet-callout'+(y===.48?' side-callout':'');button.style.left=(x*100)+'%';button.style.top=(y*100)+'%';button.hidden=true;calloutLayer.append(button);
 button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('pointerup',e=>e.stopPropagation());
 button.onclick=()=>{if(passage||feature)return;const index=Number(button.dataset.item);haltSpin();pointerMoved=false;selected=index;markChoices();const [,dest,facet]=tree[node].items[index];if(facet===0)back();else enter(dest);};
 return {x,y,button,line,dot};
});$('lobby').append(calloutLayer);
function updateCallouts(w,h){
 // Tracking continues while its presentation waits for the geometry to rest.
 calloutLayer.hidden=currentGeometry.count<=256&&((!reduced.matches&&!idleUpright?.done)||performance.now()-lastRotation<180);
 calloutSvg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 for(const callout of callouts){
  const {button,line,dot,x,y}=callout,anchor=[x*w,y*h];let best=null,nearest=Infinity;
  if(!passage)for(const facet of projectedFacets){if(!facet.complete)continue;const d=(facet.x-anchor[0])**2+(facet.y-anchor[1])**2;if(d<nearest){best=facet;nearest=d;}}
  button.hidden=!best;line.style.display=dot.style.display=best?'':'none';if(!best){delete button.dataset.item;continue;}
  button.dataset.item=best.index;button.dataset.facet=best.face;button.title=tree[node].items[best.index][0];
  if(button.textContent!==best.text)button.textContent=best.text;
  line.setAttribute('x1',best.x);line.setAttribute('y1',best.y);line.setAttribute('x2',anchor[0]);line.setAttribute('y2',anchor[1]);dot.setAttribute('cx',best.x);dot.setAttribute('cy',best.y);
 }
 window.FacetLab?.observeMenuCallouts(callouts.map(c=>c.button.hidden?null:Number(c.button.dataset.item)));
}
// Hover stays tied to the current projected surface, including during rotation.
function hoverCallout(host,id,hitFor,labelFor){
 const output=document.createElement('output');output.id=id;output.className='geometry-hover';output.hidden=true;host.append(output);let pointer=null;
 host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(e.target.closest('.facet-callout,.lab-callout,nav,#lab-actions,#facet-lab-tools,#facet-lab-left')){pointer=null;return;}pointer=[e.clientX,e.clientY];},{capture:true});
 host.addEventListener('pointerleave',()=>{pointer=null;output.hidden=true;});
 return {update(){const r=host.getBoundingClientRect(),point=pointer&&[pointer[0]-r.left,pointer[1]-r.top],hit=point&&hitFor().find(f=>{let sign=0;return f.polygon.every((a,i)=>{const b=f.polygon[(i+1)%f.polygon.length],v=(b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]);if(Math.abs(v)<1e-6)return true;if(!sign)sign=Math.sign(v);return Math.sign(v)===sign;});});output.hidden=!hit;if(hit){output.textContent=labelFor(hit);output.dataset.item=hit.item??hit.index;output.dataset.facet=hit.face??hit.index;}else{delete output.dataset.item;delete output.dataset.facet;}}};
}
const menuHover=hoverCallout($('lobby'),'facet-hover',()=>passage||feature?[]:projectedFacets,f=>tree[node].items[f.index][0]);
function facetsPerItem(){return window.FacetLab?.facetsPerItem||1;}
function facetIndex(i){return i*facetsPerItem();}
function faceOrientation(index){const [x,y,z]=allMenuFaces[index].normal;return {yaw:Math.atan2(x,z)+Math.PI,pitch:-Math.atan2(y,Math.hypot(x,z))};}
function options(id,container){container.replaceChildren(...facetTerritories(roomGeometry(id),tree[id].items.length,facetsPerItem()).faceItems.flatMap((i,fi)=>{if(i<0)return [];const [name,dest,facet]=tree[id].items[i];const b=document.createElement('button'),label=document.createElement('span'),title=document.createElement('span');label.textContent=(id==='ff'||id.startsWith('ff-page-'))?name.split(' / ').slice(-2).join(' / '):name;b.title=name;b.setAttribute('aria-label',name);b.append(label);b.dataset.fixedFacet=fi;b.dataset.menuItem=i;title.className='facet-title';title.textContent=name;title.setAttribute('aria-hidden','true');title.onclick=()=>b.click();b.onfocus=()=>{if(!passage&&b.matches(':focus-visible'))choose(i);};b.onclick=()=>{if(pointerMoved)return;selected=i;markChoices();if(facet===0)back();else enter(dest);};return [b,title];}));if(!tree[id].items.length){const note=document.createElement('p');note.className='room-notice';note.textContent=tree[id].label+' · No experience connected yet. Backspace returns to The Arcade Lab.';container.append(note);}}
function markChoices(){for(const [j,b]of [...$('choices').querySelectorAll('button')].entries())b.setAttribute('aria-current',String(Number(b.dataset.menuItem??j)===selected));}
function choose(i){if(passage)return;haltSpin();if(!tree[node].items.length){selected=-1;return;}selected=(i+tree[node].items.length)%tree[node].items.length;const orientation=faceOrientation(facetIndex(selected)),angle=orientation.yaw;targetYaw=yaw+Math.atan2(Math.sin(angle-yaw),Math.cos(angle-yaw));targetPitch=orientation.pitch;markChoices();}
function showNode(id,push=true,arrival=null){resetZoomGesture();lastInteraction=performance.now();stop();pointerAnchor=null;touchStart=null;mouseEdge=null;node=id;useGeometry(id);roomName.textContent=tree[id].label;returnButton.hidden=!parents[id];selected=0;baseFace=0;$('lobby').hidden=false;$('experience').hidden=true;document.body.classList.remove('arcade-active','arcade-game');document.body.classList.add('arcade-navigation');options(id,$('choices'));choose(0);yaw=targetYaw+.62;pitch=targetPitch+.38;targetYaw=yaw;targetPitch=pitch;viewDistance=homeDistance;if(id==='foyer'){yaw=targetYaw=foyerView.yaw;pitch=targetPitch=foyerView.pitch;selected=0;markChoices();}if(push)history.pushState({node:id},'',`?room=${id}`);syncFullscreen();}
function travel(dest){
 if(passage)return;haltSpin();
 const index=tree[node].items.findIndex(item=>item[1]===dest);if(index<0)return;
 if(reduced.matches){if(tree[dest])showNode(dest);else void openFeature(dest);return;}
 const face=facetIndex(index),normal=allMenuFaces[face].center;
 pointerAnchor=null;touchStart=null;targetYaw=yaw;targetPitch=pitch;
 const next=document.createElement('div');next.id='next-choices';next.setAttribute('aria-hidden','true');$('lobby').append(next);
 if(tree[dest])options(dest,next);
 for(const button of next.children){button.tabIndex=-1;button.disabled=true;}
 const nextGeometry=tree[dest]?roomGeometry(dest):currentGeometry;
 passage={from:node,to:dest,face,normal,nextGeometry,start:performance.now(),duration:1600,progress:0,camera:[0,0,0],next,morph:!!tree[dest],fromGeometry:currentGeometry,frames:new Map()};
 $('choices').inert=true;
}
function stop(){savePlayback();if((document.fullscreenElement||document.webkitFullscreenElement)===$('experience')){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)Promise.resolve(exit.call(document)).catch(()=>{});}playerViewportFallback=false;setPlayerFullscreen(false);haltSpin();dragPointer=null;dragSample=null;$('skip-orientation').hidden=true;if(passage){passage.next.remove();passage=null;}$('choices').inert=false;launchToken++;try{api?.pause();api?.destroy?.();}catch{}api=null;feature=null;last=null;$('feature').src='about:blank';$('captions').textContent='';$('status').textContent='';}
function fullscreenDocument(){try{return window.frameElement?.hasAttribute('data-site-enclosure-frame')?parent.document:document;}catch{return document;}}
function isFullscreen(){const doc=fullscreenDocument();return Boolean(doc.fullscreenElement||doc.webkitFullscreenElement||doc.documentElement.dataset.enclosureImmersive==='true');}
async function full(){const doc=fullscreenDocument();if(doc.fullscreenElement||doc.webkitFullscreenElement)return;const request=doc.documentElement.requestFullscreen||doc.documentElement.webkitRequestFullscreen;if(request)await request.call(doc.documentElement);}
// The top menu is available in an ordinary browser window; fullscreen is optional.
function navigationReady(){return true;}
let playerFullscreen=false,playerViewportFallback=false;
function setPlayerFullscreen(active){
 playerFullscreen=active;document.body.classList.toggle('arcade-player-fullscreen',active);
 const button=$('player-fullscreen');button.setAttribute('aria-pressed',String(active));
 button.setAttribute('aria-label',active?'Exit player fullscreen':'Enter player fullscreen');button.title=active?'Exit fullscreen player':'Fullscreen player';
 try{
  const doc=$('feature').contentDocument;if(!doc)return;
  doc.documentElement.toggleAttribute('data-arcade-viewport-only',active);
  if(!doc.getElementById('arcade-viewport-only-style')){
   const style=doc.createElement('style');style.id='arcade-viewport-only-style';
   style.textContent='html[data-arcade-viewport-only] body *{visibility:hidden!important}html[data-arcade-viewport-only] #system-grid,html[data-arcade-viewport-only] #grid,html[data-arcade-viewport-only] iframe.piops-stagecraft{visibility:visible!important}';
   doc.head.append(style);
  }
  $('feature').contentWindow.dispatchEvent(new Event('resize'));
 }catch{}
}
function syncPlayerFullscreen(){
 const el=document.fullscreenElement||document.webkitFullscreenElement;
 setPlayerFullscreen(Boolean(feature)&&(el===$('experience')||playerViewportFallback));
}
async function togglePlayerFullscreen(){
 syncPlayerFullscreen();
 const view=$('experience');
 try{
  if(playerFullscreen){playerViewportFallback=false;const exit=document.exitFullscreen||document.webkitExitFullscreen;
   if((document.fullscreenElement||document.webkitFullscreenElement)===view&&exit)await exit.call(document);else setPlayerFullscreen(false);
  }else{
   const request=view.requestFullscreen||view.webkitRequestFullscreen;
   if(request)await request.call(view);else{playerViewportFallback=true;setPlayerFullscreen(true);}
  }
 }catch(e){$('status').textContent='Player fullscreen could not open: '+e.message;}
}
$('player-fullscreen').onclick=()=>void togglePlayerFullscreen();
for(const type of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(type,syncPlayerFullscreen);
$('feature').addEventListener('load',()=>setPlayerFullscreen(playerFullscreen));


const playerNav=document.createElement('nav');playerNav.id='player-navigation';playerNav.setAttribute('aria-label','Player navigation');
const playerBack=document.createElement('button');playerBack.id='player-back';playerBack.type='button';playerBack.textContent='← Back';playerBack.title='Return to Arcade; listening position is saved';playerBack.onclick=back;
const chapterLabel=document.createElement('label');chapterLabel.textContent='Chapter ';const chapterMenu=document.createElement('select');chapterMenu.id='player-chapters';chapterMenu.setAttribute('aria-label','Choose chapter');chapterLabel.append(chapterMenu);chapterLabel.hidden=true;
playerNav.append(playerBack,chapterLabel);$('experience').append(playerNav);
chapterMenu.onchange=()=>{void act('seek',Number(chapterMenu.value));};
let menuSignature='',lastPlaybackSave=0;
function syncChapterMenu(){const chapters=api?.chapters?.()||[],signature=feature+JSON.stringify(chapters);chapterLabel.hidden=!chapters.length;
 if(signature!==menuSignature){menuSignature=signature;chapterMenu.replaceChildren(...chapters.map(ch=>{const option=document.createElement('option');option.value=String(ch.start);option.textContent=ch.title;return option;}));}
 const s=api?.snapshot();if(s&&document.activeElement!==chapterMenu){const ch=chapters.find(c=>c.id===s.chapter.id);if(ch)chapterMenu.value=String(ch.start);}
}
function savePlayback(){if(!feature||games.includes(feature)||!api)return;try{const s=api.snapshot();if(s&&Number.isFinite(s.time))sessionStorage.setItem('arcade-playback:'+feature,JSON.stringify({time:s.time,chapter:s.chapter.id}));}catch{}}
const keyDocuments=new WeakSet(),keyFrames=new WeakSet();
function installPlayerKeys(win){try{const doc=win.document;if(!keyDocuments.has(doc)){keyDocuments.add(doc);win.addEventListener('keydown',handleKey,{capture:true});}
 for(const frame of doc.querySelectorAll('iframe')){if(!keyFrames.has(frame)){keyFrames.add(frame);frame.addEventListener('load',()=>installPlayerKeys(frame.contentWindow));}installPlayerKeys(frame.contentWindow);}}catch{}}
addEventListener('pagehide',savePlayback);
setInterval(()=>{if(!feature||!api)return;installPlayerKeys($('feature').contentWindow);syncChapterMenu();if(performance.now()-lastPlaybackSave>1000){savePlayback();lastPlaybackSave=performance.now();}},250);

function back(){
 lastBackAt=performance.now();
 if(passage){showNode(node);return;}
 if(feature)showNode(featureRoutes[feature]?.parent|| (games.includes(feature)?'games':['unreal','nocturns'].includes(feature)?'scifi':'documentary'));
 else if(parents[node])travel(parents[node]);
 else cv.focus({preventScroll:true});
}
function saveNavigation(){try{sessionStorage.setItem(sessionKey,JSON.stringify({entered,node,yaw,pitch,roll,baseFace,viewDistance}));}catch{}}
addEventListener('pagehide',saveNavigation);
function syncFullscreen(){
 recovery.hidden=Boolean(feature)||(!!(fullscreenDocument().fullscreenElement||fullscreenDocument().webkitFullscreenElement));
 const active=isFullscreen();if(active)entered=true;
 const first=navigationReady()&&!routeInitialized;if(first)routeInitialized=true;
 if(entered)saveNavigation();
 wasFullscreen=active;
 // Fullscreen controls discovery, never the lifetime of an entered session.
 const ready=navigationReady();$('lobby').hidden=!ready||Boolean(feature);$('experience').hidden=!ready||!feature;document.body.classList.toggle('arcade-entry',!ready);document.body.classList.toggle('arcade-navigation',ready&&!feature);document.body.classList.toggle('arcade-active',ready&&Boolean(feature));
 if(first)route();
 if(ready&&!feature)cv.focus({preventScroll:true});
}
for(const type of ['fullscreenchange','webkitfullscreenchange','site-enclosure:fullscreen'])fullscreenDocument().addEventListener(type,syncFullscreen);
for(const type of ['focus','pageshow','resize'])addEventListener(type,()=>{syncPlayerFullscreen();syncFullscreen();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncPlayerFullscreen();syncFullscreen();}});
async function enter(dest){if(!navigationReady()||!dest)return;if(tree[node].items[selected]?.[2]===0){back();return;}travel(dest);}
function chapterPlayback(native,clip,child){
 if(!clip)return native;
 const low=Number(clip.start),high=Number(clip.end),clamp=t=>Math.max(low,Math.min(high-.04,Number(t)||0));
 if(!Number.isFinite(low)||!Number.isFinite(high)||high<=low)throw Error('Chapter boundaries unavailable');
 let ended=false,closed=false;
 const continuous=child.document.getElementById('continuous');if(continuous)continuous.checked=false;
 const timer=setInterval(()=>{if(closed)return;const s=native.snapshot();if(s&&s.time>=high-.06){ended=true;native.pause();if(s.time>high)void native.seek(high-.04);}},20);
 const audio=child.document.getElementById('recording'),finish=e=>{const s=native.snapshot();if(s&&s.time>=high-.15){e.stopImmediatePropagation();ended=true;native.pause();}};
 audio?.addEventListener('ended',finish,true);
 return {...native,snapshot(){const s=native.snapshot();return s?{...s,time:Math.max(low,Math.min(high,s.time)),chapter:{...s.chapter,id:clip.id,start:low,end:high},ended}:s;},async play(){const s=native.snapshot();if(ended||s?.time>=high-.06){ended=false;await native.seek(low);}await native.play();},async seek(t){ended=false;await native.seek(clamp(t));},destroy(){closed=true;clearInterval(timer);audio?.removeEventListener('ended',finish,true);native.destroy?.();}};
}
async function openFeature(id,share={}){if(!navigationReady())return;stop();const token=launchToken;feature=id;recovery.hidden=true;pointerAnchor=null;touchStart=null;orientationDone=false;const isGame=games.includes(id);document.body.classList.toggle('arcade-game',isGame);$('bezel').hidden=isGame;$('captions').hidden=isGame;$('lobby').hidden=true;$('experience').hidden=false;document.body.classList.add('arcade-active');document.body.classList.remove('arcade-navigation');$('feature-title').textContent=titles[id];$('feature').title=titles[id];$('library').hidden=true;$('skip-orientation').hidden=true;$('orientation').hidden=true;$('instructions').textContent={defense:'Point and click / tap to intercept. Protect the six cities.',matrix:'Arrows / WASD steer. Space fires. Shift + Space: lightning bomb. Touch: use the controls below.',starwords:'Click, tap or drag across words to burst them into stardust.'}[id]||'';$('orientation-progress').textContent='Complete the introductory level to choose a work.';$('status').textContent='Opening '+titles[id]+'…';const previousDocument=$('feature').contentDocument;$('feature').src='/arcade/'+(featureRoutes[id]?.url||(games.includes(id)?'game.html?game='+id:'viewers/'+id+'.html'));
if(!Object.prototype.hasOwnProperty.call(share,'time')){try{const saved=JSON.parse(sessionStorage.getItem('arcade-playback:'+id));if(Number.isFinite(saved?.time))share={...share,time:saved.time};}catch{}}
if(!share.restore)history.pushState({feature:id},'',`?feature=${id}`);
// A previous viewer can still expose its API until the new iframe navigation commits.
// Never treat that stale API as the newly selected feature.
await new Promise(resolve=>{const frame=$('feature');let timer,poll;
 const loaded=()=>{try{if(frame.contentDocument===previousDocument||frame.contentWindow.location.href==='about:blank'||!frame.contentWindow.ArcadeFeature)return;}catch{return;}clearTimeout(timer);clearInterval(poll);frame.removeEventListener('load',loaded);resolve();};
 frame.addEventListener('load',loaded);poll=setInterval(loaded,50);timer=setTimeout(()=>{clearInterval(poll);frame.removeEventListener('load',loaded);resolve();},90000);loaded();});
const start=performance.now();while(token===launchToken){try{api=$('feature').contentWindow.ArcadeFeature;if(api?.ready()){if(share.content&&games.includes(id)){await api.loadContent(share.content);orientationDone=true;$('orientation').hidden=true;}if(share.mode&&games.includes(id))api.setAuto?.(share.mode==='auto');const clip=featureRoutes[id]?.clip;api=chapterPlayback(api,clip,$('feature').contentWindow);if(clip||share.time)await api.seek(Number(share.time)||(clip?.start||0));last=api.snapshot();$('status').textContent='';await api.play();const child=$('feature').contentWindow;installPlayerKeys(child);syncChapterMenu();if(games.includes(id)){child.focus();$('skip-orientation').hidden=orientationDone;}return;}}catch(e){$('status').textContent=e.message;}if(performance.now()-start>90000){$('status').textContent='Feature could not start. Return to Arcade and try again.';return;}await new Promise(r=>setTimeout(r,200));}}
function selectFacing(){const occupied=currentGeometry.occupiedFacets,facing=allMenuFaces.slice(0,occupied).map(f=>-rotatePoint(f.normal,targetYaw,targetPitch)[2]);const index=facing.indexOf(Math.max(...facing));selected=index<0?-1:currentGeometry.faceItems[index];markChoices();}
function landOnSelection(){
 // Pick an occupied face near the projected stopping orientation.
 const endYaw=targetYaw+spinYaw*1400,endPitch=targetPitch+spinPitch*1400;
 const weights=tree[node].items.map((item,i)=>{
  const normal=allMenuFaces[facetIndex(i)].normal;
  return -rotatePoint(normal,endYaw,endPitch)[2]/Math.hypot(...normal);
 });
 const choice=weights.indexOf(Math.max(...weights));if(choice<0){haltSpin();return;}
 const orientation=faceOrientation(facetIndex(choice));haltSpin();landing=true;selected=choice;
 const nearest=(from,to)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from));
 targetYaw=detent(nearest(yaw,orientation.yaw));targetPitch=detent(nearest(pitch,orientation.pitch));
 markChoices();
}
function rotate(code){if(passage)return;haltSpin();pointerAnchor=null;if(code==='ArrowLeft'||code==='ArrowRight'){targetYaw+=(code==='ArrowLeft'?-1:1)*rotationStep;}if(code==='ArrowUp')targetPitch+=rotationStep;if(code==='ArrowDown')targetPitch-=rotationStep;selectFacing();}
let pointerAnchor=null,touchStart=null,mouseEdge=null;
let pointerMoved=false;
const zoomTouches=new Map();let pinch=null;
function clampZoom(distance){return Math.max(Math.SQRT2+.12,Math.min(12,distance));}
function resetZoomGesture(){zoomTouches.clear();pinch=null;}
function startZoom(){haltSpin();targetYaw=yaw;targetPitch=pitch;touchStart=null;pointerAnchor=null;dragPointer=null;dragSample=null;pointerMoved=true;}
$('lobby').addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch'||passage||feature||!navigationReady()||e.target.closest('#facet-navigation'))return;
 zoomTouches.set(e.pointerId,[e.clientX,e.clientY]);
 if(zoomTouches.size===2){const [a,b]=[...zoomTouches.values()];startZoom();pinch={span:Math.hypot(a[0]-b[0],a[1]-b[1]),distance:viewDistance};for(const id of zoomTouches.keys())$('lobby').setPointerCapture(id);e.preventDefault();e.stopImmediatePropagation();}
},true);
$('lobby').addEventListener('pointermove',e=>{
 if(!zoomTouches.has(e.pointerId))return;zoomTouches.set(e.pointerId,[e.clientX,e.clientY]);
 if(!pinch)return;e.preventDefault();e.stopImmediatePropagation();
 if(zoomTouches.size>=2){const [a,b]=[...zoomTouches.values()],span=Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1]));viewDistance=clampZoom(Math.SQRT2+(pinch.distance-Math.SQRT2)*pinch.span/span);}
},true);
function finishZoomTouch(e){
 if(!zoomTouches.has(e.pointerId))return;zoomTouches.delete(e.pointerId);
 if(pinch){e.preventDefault();e.stopImmediatePropagation();pointerMoved=true;if(!zoomTouches.size){pinch=null;saveNavigation();}}
}
$('lobby').addEventListener('pointerup',finishZoomTouch,true);
$('lobby').addEventListener('pointercancel',finishZoomTouch,true);
// Trackpad pinch arrives as Ctrl+wheel in Chromium and WebKit.
$('lobby').addEventListener('wheel',e=>{
 if(!e.ctrlKey||passage||feature||!navigationReady())return;e.preventDefault();startZoom();
 viewDistance=clampZoom(Math.SQRT2+(viewDistance-Math.SQRT2)*Math.exp(e.deltaY*.01));saveNavigation();
},{passive:false});
$('lobby').addEventListener('pointerdown',e=>{
 if(passage||feature||!navigationReady()||!e.isPrimary||e.button!==0||e.target.closest('#facet-navigation'))return;
 const spinning=autoSpinning||Math.hypot(spinYaw,spinPitch)>.00005;
 haltSpin();targetYaw=yaw;targetPitch=pitch;pointerMoved=false;
 dragPointer=e.pointerId;touchStart=[e.clientX,e.clientY,spinning];pointerAnchor=[e.clientX,e.clientY,yaw,pitch];
 dragSample={x:e.clientX,y:e.clientY,time:e.timeStamp};
 // Capture only after a drag, so an ordinary facet tap keeps its click target.
});
$('lobby').addEventListener('pointermove',e=>{
 if(passage||feature||!pointerAnchor||e.pointerId!==dragPointer)return;
 if(e.clientX===dragSample.x&&e.clientY===dragSample.y)return;
 const rect=cv.getBoundingClientRect(),dx=e.clientX-pointerAnchor[0],dy=e.clientY-pointerAnchor[1];
 if(!pointerMoved&&Math.hypot(dx,dy)>6){pointerMoved=true;$('lobby').setPointerCapture(e.pointerId);}
 if(!pointerMoved)return;
 // Undo the current view roll for predictable screen-space pushes.
 const gain=Math.PI*2/Math.min(rect.width,rect.height),horizontal=dx*Math.cos(roll)+dy*Math.sin(roll),vertical=dy*Math.cos(roll)-dx*Math.sin(roll);
 targetYaw=pointerAnchor[2]+horizontal*gain*.8;targetPitch=pointerAnchor[3]-vertical*gain*.8;
 const dt=e.timeStamp-dragSample.time;
 if(dt>0){const vx=(e.clientX-dragSample.x)/dt,vy=(e.clientY-dragSample.y)/dt,blend=1-Math.exp(-dt/45);
  spinYaw=Math.max(-.018,Math.min(.018,spinYaw*(1-blend)+(vx*Math.cos(roll)+vy*Math.sin(roll))*gain*.8*blend));
  spinPitch=Math.max(-.018,Math.min(.018,spinPitch*(1-blend)-(vy*Math.cos(roll)-vx*Math.sin(roll))*gain*.8*blend));
 }
 dragSample={x:e.clientX,y:e.clientY,time:e.timeStamp};selectFacing();
});
$('lobby').addEventListener('pointerup',e=>{
 if(e.pointerId!==dragPointer)return;
 const tap=touchStart&&!pointerMoved,brake=tap&&touchStart[2];
 if(tap||reduced.matches||!dragSample)haltSpin();
 else {const held=Math.exp(-Math.max(0,e.timeStamp-dragSample.time-50)/80);spinYaw*=held;spinPitch*=held;}
 touchStart=null;pointerAnchor=null;dragPointer=null;dragSample=null;
 if(brake){pointerMoved=true;return;}
 if(tap&&e.target===cv){
  if(currentGeometry.count>256){const rect=cv.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
   const hit=projectedFacets.find(f=>{let sign=0;return f.polygon.every((a,i)=>{const b=f.polygon[(i+1)%f.polygon.length],cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(cross)<1e-6)return true;if(!sign)sign=Math.sign(cross);return Math.sign(cross)===sign;});});
   if(!hit)return;selected=hit.index;markChoices();
  }
  if(selected>=0){const [,dest,facet]=tree[node].items[selected];if(facet===0)back();else void enter(dest);}
 }
});
function cancelDrag(){resetZoomGesture();haltSpin();touchStart=null;pointerAnchor=null;dragPointer=null;dragSample=null;}
$('lobby').addEventListener('pointercancel',cancelDrag);
addEventListener('blur',cancelDrag);
document.addEventListener('visibilitychange',()=>{lastInteraction=performance.now();if(document.hidden)cancelDrag();});
// Any input restarts the inactivity interval; pointer-down retains the brake flag.
for(const type of ['pointerdown','pointermove','pointerup','keydown','wheel','focus'])addEventListener(type,()=>{
 lastInteraction=performance.now();
 if(type!=='pointerdown'&&autoSpinning){haltSpin();targetYaw=yaw;targetPitch=pitch;}
},{capture:true,passive:true});
reduced.addEventListener('change',()=>{if(reduced.matches)haltSpin();});
function handleKey(e){
 if(window.FacetLab?.active)return;
 if(feature&&e.code==='Backspace'&&!e.target.closest?.('textarea,[contenteditable="true"],input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button])')){e.preventDefault();e.stopImmediatePropagation();return;}
 if(e.code==='Escape'&&playerFullscreen){e.preventDefault();void togglePlayerFullscreen();return;}
 if($('arcade-share')?.open)return;
 if(!navigationReady()||e.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;
 if(e.code==='Backspace'){e.preventDefault();e.stopImmediatePropagation();if(!feature)back();return;}
 if(e.code==='Escape'&&!feature){e.preventDefault();e.stopImmediatePropagation();back();return;}
 if(e.metaKey||e.ctrlKey||e.altKey)return;
 if(feature&&!games.includes(feature)&&['ArrowLeft','ArrowRight','Space'].includes(e.code)&&!e.target.closest?.('button')){
  e.preventDefault();e.stopImmediatePropagation();const s=api?.snapshot();if(!s)return;
  if(e.code==='Space'){if(!e.repeat)void act(s.paused?'play':'pause');}
  else void act('seek',Math.max(0,Math.min(s.duration-.05,s.time+(e.code==='ArrowRight'?5:-5))));return;
 }
 if(passage)return;
 if(!feature&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();rotate(e.code);}
 else if(!feature&&e.code==='Enter'&&e.target===cv){e.preventDefault();if(selected>=0)void enter(tree[node].items[selected][1]);}
 else if(feature&&!games.includes(feature)&&e.code==='Space'&&!e.target.closest?.('button')){e.preventDefault();last?.paused?act('play'):act('pause');}
 else if(e.code==='KeyF'){if(feature)void togglePlayerFullscreen();else void full();}
}
addEventListener('keydown',handleKey,{capture:true});
function rotatePoint([x,y,z],a=yaw,b=pitch){const u=x*Math.cos(a)-z*Math.sin(a),v=z*Math.cos(a)+x*Math.sin(a);const Y=y*Math.cos(b)-v*Math.sin(b);return [u*Math.cos(roll)+Y*Math.sin(roll),Y*Math.cos(roll)-u*Math.sin(roll),v*Math.cos(b)+y*Math.sin(b)];}
function clipNear(poly){const out=[],near=.06;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(a[2]>=near)out.push(a);if((a[2]>=near)!==(b[2]>=near)){const t=(near-a[2])/(b[2]-a[2]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
function draw(now=performance.now()){if(navigationReady()&&!document.hidden&&!feature&&!window.FacetLab?.active){
 const dpr=Math.min(devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;
 if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}

 const dt=Math.max(0,Math.min(50,now-(draw.previous??now)));draw.previous=now;
 if(!passage){
  autoSpinning=false;idleTour=null;
  if(!autoSpinning&&!pointerAnchor&&!reduced.matches&&!landing){
   const decay=Math.exp(-dt/1400),advance=1400*(1-decay);
   targetYaw+=spinYaw*advance;targetPitch+=spinPitch*advance;spinYaw*=decay;spinPitch*=decay;
   if((spinYaw||spinPitch)&&Math.hypot(spinYaw,spinPitch)<.00004){spinYaw=spinPitch=0;targetYaw=detent(targetYaw);targetPitch=detent(targetPitch);}
   if(!landing&&(spinYaw||spinPitch))selectFacing();
  }
  // Follow the hand and fast momentum continuously; detents emerge on the slow tail.
  const speed=Math.hypot(spinYaw,spinPitch);
  if(autoSpinning||pointerAnchor||speed>0){
   yaw=targetYaw;pitch=targetPitch;draw.lastStep=now;
  }else if(now-(draw.lastStep??-Infinity)>=stepInterval/(window.FacetLab?.navigationRate||1)&&
    (Math.abs(targetYaw-yaw)>1e-10||Math.abs(targetPitch-pitch)>1e-10)){
   const nextYaw=detent(targetYaw),nextPitch=detent(targetPitch);
   const tick=(value,target)=>Math.abs(target-value)<rotationStep*.5?target:value+Math.sign(target-value)*rotationStep;
   yaw=detent(tick(detent(yaw),nextYaw));pitch=detent(tick(detent(pitch),nextPitch));
   draw.lastStep=now;
   if(!spinYaw&&!spinPitch){targetYaw=nextYaw;targetPitch=nextPitch;}
  }
 }
 // Settle only the view-axis roll; yaw and pitch retain the visible facets.
 if(!passage&&!pointerAnchor&&!reduced.matches&&!spinYaw&&!spinPitch&&now-lastInteraction>=idleDelay&&Math.abs(yaw-targetYaw)<1e-8&&Math.abs(pitch-targetPitch)<1e-8){
  if(!idleUpright)idleUpright={start:now,from:roll,to:roll+uprightCorrection(currentGeometry,rotatePoint,[0,0,-viewDistance],Math.min(w,h)*1.05,w,h)};
  const t=Math.min(1,(now-idleUpright.start)/900),ease=t*t*(3-2*t);roll=idleUpright.from+(idleUpright.to-idleUpright.from)*ease;idleUpright.done=t>=1;
 }
 const rotation=[yaw,pitch,roll];if(previousRotation&&rotation.some((v,k)=>Math.abs(v-previousRotation[k])>1e-8))lastRotation=now;previousRotation=rotation;
 const focal=Math.min(w,h)*1.05,cx=w/2,cy=h/2;
 let camera=[0,0,-viewDistance],distance=0;
 if(passage&&!passage.morph){
  passage.progress=Math.min(1,(now-passage.start)/passage.duration);const t=passage.progress;
  // First turn into the chosen square, then cross its actual plane.
  const align=Math.min(1,t/.55),smooth=align*align*(3-2*align);
  if(passage.initialYaw===undefined){passage.initialYaw=yaw;passage.initialPitch=pitch;const n=passage.normal;passage.endYaw=Math.atan2(n[0],n[2]);passage.endYaw=yaw+Math.atan2(Math.sin(passage.endYaw-yaw),Math.cos(passage.endYaw-yaw));passage.endPitch=Math.atan2(n[1],Math.hypot(n[0],n[2]));}
  yaw=detent(passage.initialYaw+(passage.endYaw-passage.initialYaw)*smooth);pitch=detent(passage.initialPitch+(passage.endPitch-passage.initialPitch)*smooth);
  const u=Math.max(0,(t-.55)/.45);distance=2*u*u*(3-2*u);
  camera=rotatePoint(passage.normal.map(n=>n*distance));camera[2]-=viewDistance*(1-smooth);passage.camera=camera;
 }
 environment.render({yaw,pitch,camera,focal,width:w,height:h});
 projectedFacets=[];renderer.begin({yaw,pitch,roll,camera,focal,width:w,height:h});
 const cell=(offset,opening,highlight,geometry=currentGeometry)=>{renderer.setGeometry(geometry.faces,geometry.points,geometry.edges);renderer.cell(offset,opening,highlight,false,geometry===currentGeometry?currentGeometry.occupiedFacets:geometry.count);};
 function lettering(container,offset,first,omit=-1,geometry=currentGeometry){const territories=[],labels=new Map();
  for(const [i,button]of [...container.querySelectorAll('button')].entries()){
   labels.set(Number(button.dataset.menuItem),button.firstElementChild.textContent);const fi=Number(button.dataset.fixedFacet),face=geometry.menuFaces[fi];
   button.dataset.shape=face.vertices.length===3?'triangle':'polygon';
   button.style.clipPath='polygon('+face.polygon.map(([x,y])=>(x*100)+'% '+(y*100)+'%').join(',')+')';
   const c=rotatePoint(face.center.map((n,k)=>n+offset[k])).map((n,k)=>n-camera[k]),normal=rotatePoint(face.normal);
   const visible=fi!==omit&&c[2]>.12&&dot(c,normal)<-.03;
   const wasVisible=button.style.visibility==='visible';
   button.style.visibility=visible&&geometry.count<=256?'visible':'hidden';button.nextElementSibling.style.display='none';
   button.style.pointerEvents=visible&&!passage&&geometry.count<=256?'auto':'none';button.tabIndex=visible&&!passage&&geometry.count<=256?0:-1;
   button.dataset.facet=fi;if(!visible)continue;
   const base=rotatePoint(face.base.map((n,k)=>n+offset[k])).map((n,k)=>n-camera[k]),ux=rotatePoint(face.ux),vy=rotatePoint(face.vy);
   const m=[focal*ux[0]+cx*ux[2],cy*ux[2]-focal*ux[1],0,ux[2],focal*vy[0]+cx*vy[2],cy*vy[2]-focal*vy[1],0,vy[2],0,0,1,0,focal*base[0]+cx*base[2],cy*base[2]-focal*base[1],0,base[2]];
   if(geometry.count<=256)button.style.transform='matrix3d('+m.join(',')+')';
   if(container===$('choices')&&!passage){
    const vertices=face.vertices.map(p=>rotatePoint(p).map((n,k)=>n-camera[k]));
    const polygon=vertices.map(p=>[cx+focal*p[0]/p[2],cy-focal*p[1]/p[2]]);
    projectedFacets.push({index:Number(button.dataset.menuItem??i),face:fi,text:button.firstElementChild.textContent,x:cx+focal*c[0]/c[2],y:cy-focal*c[1]/c[2],polygon,complete:vertices.every(p=>p[2]>.06)&&polygon.every(([x,y])=>x>=8&&x<=w-8&&y>=8&&y<=h-8)});
   }
   // Keep text orientation stable while its face is visible; reorient behind the shell.
   if(!wasVisible)button.firstElementChild.style.transform=(ux[0]*base[2]-base[0]*ux[2]<0)?'rotate(180deg)':'none';
   // Defer subpixel text until zoom makes the facet readable. All destination
   // hit targets remain present on the single shell at every zoom level.
   const projectedWidth=960*focal*Math.hypot(ux[0]*base[2]-base[0]*ux[2],ux[1]*base[2]-base[1]*ux[2])/(base[2]*base[2]);
   const vertices=face.vertices.map(p=>rotatePoint(p.map((v,k)=>v+offset[k])).map((v,k)=>v-camera[k]));if(vertices.every(p=>p[2]>.06))territories.push({item:Number(button.dataset.menuItem),index:fi,x:cx+focal*c[0]/c[2],y:cy-focal*c[1]/c[2],polygon:vertices.map(p=>[cx+focal*p[0]/p[2],cy-focal*p[1]/p[2]])});

  }
  let labeled=territories;
  if(geometry.count>256){
   let items=new Set();
   if(container===$('choices')&&!passage){updateCallouts(w,h);menuHover.update();items=new Set(callouts.filter(c=>!c.button.hidden).map(c=>Number(c.button.dataset.item)));const hover=$('facet-hover');if(!hover.hidden)items.add(Number(hover.dataset.item));}
   labeled=territories.filter(f=>items.has(f.item));
  }
  renderer.territoryLabels=territoryLabels(renderer,labeled,i=>labels.get(i),selected,w,h,geometry,rotatePoint,camera,focal,offset);
 }
 if(passage?.morph){
  passage.progress=Math.min(1,(now-passage.start)/passage.duration);
  const t=passage.progress,smooth=t*t*(3-2*t),frame=Math.round(smooth*96);
  if(!passage.frames.has(frame))passage.frames.set(frame,morphGeometry(passage.fromGeometry,passage.nextGeometry,frame/96));
  const geometry=passage.frames.get(frame);cell([0,0,0],-1,-1,geometry);
  // Disable old hit targets until the destination's exact faces are installed.
  for(const b of $('choices').children)b.style.visibility='hidden';
  if(passage.fromGeometry===passage.nextGeometry)lettering(t<.5?$('choices'):passage.next,[0,0,0],0,-1,geometry);
  passage.camera=camera;passage.mesh={count:geometry.count,points:geometry.points};
  if(t>=1){const dest=passage.to,orientation={yaw,pitch,viewDistance};showNode(dest);yaw=targetYaw=orientation.yaw;pitch=targetPitch=orientation.pitch;viewDistance=orientation.viewDistance;selectFacing();saveNavigation();}
 }else if(passage){
  const offset=passage.normal.map(n=>n*2);
  cell(offset,-1,-1,passage.nextGeometry);
  if(distance<1)cell([0,0,0],passage.progress<.55?-1:passage.face,-1);
  lettering($('choices'),[0,0,0],baseFace,passage.progress<.55?-1:passage.face);
  lettering(passage.next,offset,passage.face,-1,passage.nextGeometry);
  if(passage.progress>=1){const {to,face}=passage;if(tree[to])showNode(to,true,{face});else void openFeature(to);}
 }else{cell([0,0,0],-1,selected>=0?facetIndex(selected):-1);lettering($('choices'),[0,0,0],baseFace);}
 updateCallouts(w,h);menuHover.update();
}requestAnimationFrame(draw);}requestAnimationFrame(draw);
async function act(method,...args){try{if(!api)throw Error('Feature is still loading.');await api[method](...args);$('status').textContent='';}catch(e){$('status').textContent=e.message;}}
$('play').onclick=()=>act('play');$('pause').onclick=()=>act('pause');$('mute').onclick=async()=>{const v=!last?.muted;await act('mute',v);$('mute').textContent=v?'Unmute':'Mute';$('mute').setAttribute('aria-pressed',String(v));};
$('chapter-progress').oninput=e=>{if(last)act('seek',last.chapter.start+Number(e.target.value)*(last.chapter.end-last.chapter.start));};$('work-progress').oninput=e=>{if(last)act('seek',Number(e.target.value)*last.duration);};
$('share').onclick=()=>window.ArcadeSharing?.open();
async function startContent(id){
 const token=launchToken;
 for(const button of $('content-titles').querySelectorAll('button'))button.disabled=true;
 await act('loadContent',id);
 if(token!==launchToken)return;
 if(api?.snapshot()?.content===id){$('library').hidden=true;orientationDone=true;await act('play');$('feature').contentWindow.focus();}
 else for(const button of $('content-titles').querySelectorAll('button'))button.disabled=false;
}
async function showLibrary(){
 const token=launchToken;orientationDone=true;$('skip-orientation').hidden=true;
 await act('pause');$('orientation').hidden=true;
 if(!library.length){try{const r=await fetch('/arcade/content/catalog.json',{cache:'no-store'});if(!r.ok)throw Error('Content catalog unavailable');library=(await r.json()).filter(x=>x.narration?.available&&x.narration.audio?.length);}catch(e){$('status').textContent=e.message;return;}}
 if(token!==launchToken)return;
 $('content-titles').replaceChildren(...library.map(x=>{const item=document.createElement('li'),button=document.createElement('button');button.textContent=x.title;button.dataset.content=x.id;button.onclick=()=>startContent(x.id);item.append(button);return item;}));
 $('library').hidden=false;
 $('content-titles').querySelector('[data-content="the-source"]')?.focus({preventScroll:true});
}
$('skip-orientation').onclick=showLibrary;
setInterval(()=>{if(!api)return;try{last=api.snapshot();if(!last)return;$('captions').textContent=last.caption||'';$('chapter-progress').value=(last.time-last.chapter.start)/(last.chapter.end-last.chapter.start)||0;$('work-progress').value=last.time/last.duration||0;$('mute').textContent=last.muted?'Unmute':'Mute';if(games.includes(feature)&&!orientationDone){$('orientation-progress').textContent=`Introduction · ${Math.ceil(Math.max(0,last.duration-last.time))} seconds remaining`;if(last.ended){orientationDone=true;void showLibrary();}}if(last.error)$('status').textContent=last.error;}catch(e){$('status').textContent=e.message;}},150);
function fmt(t){return Math.floor((t||0)/60)+':'+String(Math.floor((t||0)%60)).padStart(2,'0');}function route(){const q=new URLSearchParams(location.search),id=q.get('feature');if(id==='imagine-this'){showNode('imagine-this',false);return;}if(titles[id])void openFeature(id,{restore:true,time:q.get('t'),content:q.get('content'),mode:q.get('mode')});else{const room=tree[q.get('room')]?q.get('room'):'foyer';const saved=savedNavigation;showNode(room,false);if(saved?.entered&&saved.node===room&&Number.isFinite(saved.yaw)&&Number.isFinite(saved.pitch)){if(Number.isFinite(saved.viewDistance))viewDistance=clampZoom(saved.viewDistance);yaw=targetYaw=saved.yaw;pitch=targetPitch=saved.pitch;roll=Number.isFinite(saved.roll)?saved.roll:Math.PI/4;baseFace=Number.isInteger(saved.baseFace)?saved.baseFace:0;selectFacing();}savedNavigation=null;}}onpopstate=()=>{if(navigationReady())route();};syncFullscreen();window.Arcade={showNode,openFeature,get state(){return {node,selected,feature,last,yaw,pitch,roll,resting:!pointerAnchor&&performance.now()-lastRotation>=180,upright:idleUpright?{...idleUpright}:null,autoSpinning,idleDelay,idleCycle,idlePause,idleTour:idleTour?{index:idleTour.index,faces:idleTour.options.length,phase:performance.now()-idleTour.start<idleTour.duration?'moving':'paused'}:null,targetYaw,targetPitch,baseFace,viewDistance,rotationStep,stepInterval,momentumDecay:1400,landing,motionMode:pointerAnchor?'drag':Math.hypot(spinYaw,spinPitch)>0?'smooth':'stepped',axisChanges,spinSteps,spin:{yaw:spinYaw,pitch:spinPitch},fullscreen:isFullscreen(),playerFullscreen,entered,passage:passage?{from:passage.from,to:passage.to,face:passage.face,progress:passage.progress,camera:passage.camera,morph:passage.morph,mesh:passage.mesh}:null};},get projectedFacets(){return projectedFacets.map(f=>({...f}));},get renderer(){return {...renderer.diagnostics,environment:environment.state,territoryLabels:renderer.territoryLabels};},routes:featureRoutes,tree,geometryFor,subdivideVE,geometryFromCells,geometryFromPlanes,compactEmptyFacets,facetTerritories,territoryLabels,uprightCorrection,hoverCallout,morphGeometry,refreshGeometry(){useGeometry(node);options(node, $("choices"));},pauseNavigation:haltSpin,get geometry(){return currentGeometry;}};
})();
