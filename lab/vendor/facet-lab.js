/* Facet Lab uses the Arcade's native meshes, GPU renderer and projection contract. */
(()=>{'use strict';
const arcade=window.Arcade,defaults=[12,14,1,1,1,1],storageKey='continuum-manifold-lab-last-v1';
const symmetry=[
 ['Asymmetrical','Unequal axes and shear; no imposed reflection.'],
 ['Central symmetry','Opposite points remain paired.'],
 ['Bilateral · X','Reflection through the YZ plane.'],
 ['Bilateral · Y','Reflection through the XZ plane.'],
 ['Bilateral · Z','Reflection through the XY plane.'],
 ['Axial · 2','Twofold rotation around Z.'],
 ['Axial · 3','Threefold rotation around Z.'],
 ['Axial · 4','Fourfold rotation around Z.'],
 ['Axial · 6','Sixfold rotation around Z.'],
 ['Two mirror planes','Independent X and Y reflections.'],
 ['Orthorhombic','Three mirror planes, unequal axis lengths.'],
 ['Cubic · VE default','Equal axes and the full VE reflection structure.']
];
const rules=[
 ['VE · n²','The original VE planes; integer facet frequencies.'],
 ['T · tetrahedron','A tetrahedral envelope replaces the outer VE.'],
 ['O · octahedron','An octahedral envelope replaces the outer VE.'],
 ['C · cube','A cubic envelope replaces the outer VE.'],
 ['π · sphere','Triangulated radial projection toward a sphere.'],
 ['φ · golden ratio','The Z axis follows the golden ratio.'],
 ['√2 · diagonal','The Z axis grows by the square-root-of-two ratio.'],
 ['θ = kπ(3−√5)','Golden-angle twist increases with height.'],
 ['e · growth rate','Exponential easing changes rotation response.'],
 ['Fₙ · Fibonacci','Growth chooses Fibonacci facet frequencies.'],
 ['H · hexagonal crystal','Hexagonal prism; axial crystal growth with facet count.'],
 ['C³ · cubic crystal','Cubic seed; equal-axis crystal growth with facet count.'],
 ['sin θ · ripple','A radial sinusoid organizes the triangulated surface.'],
 ['τ · rotation rate','τ sets the speed between facet views; each view pauses three seconds.']
];
const controls=['Add facets ↑','Remove facets ↓','Zoom in','Zoom out','Fit view','Centre view','Turn left','Turn right','Tilt up','Tilt down','Settle text upright','Empty geometry','Default settings','Reset view'];
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
const branching=['Unbranched','Binary forks','Ternary forks','Four-way forks','Opposed branches','Axial crown','Radial crown','Helical branches','Fibonacci crown','Prime crown','Alternating forks','Tiered branches','Dominant axis','Tetrahedral forks'].map((name,i)=>[name,i?'Connected radial lobes grow and recede with occupancy; '+name.toLowerCase()+'.':'Preserve the original unbranched envelope.']);
const bucky=[['VE · equilibrium','Native vector equilibrium.'],['T · tetrahedral','Tetrahedral outer support planes.'],['O · octet envelope','Octahedral outer support planes, inspired by octet organization.'],['I · icosahedral','Twenty icosahedral support planes.'],['G · geodesic','Triangulated radial projection onto a sphere.'],['VE · balance','Balance triangular and square VE support planes.'],['R · isotropic','Equalize the outer vertex radii.'],['φ · proportion','Golden-ratio axial proportion.'],['√2 · octet ratio','Square-root-of-two axial proportion.'],['θ · spiral packing','Golden-angle twist about the vertical axis.'],['Tw · countertwist','Opposed upper and lower twisting.'],['2ⁿ · frequency','Double the selected subdivision frequency.'],['T · four lobes','Tetrahedral radial lobes.'],['J · growth phase','Growth-dependent twisting and axial contraction inspired by the jitterbug.']];
const normalize=c=>Array.isArray(c)&&c.length===3?[...c,1,1,1]:c;
const valid=window.MTheorySections.valid;
let saved=null;try{const c=normalize(JSON.parse(localStorage.getItem(storageKey)));if(valid(c))saved=c;}catch{}
let config=saved?.slice()||defaults.slice(),active=false,count=0,unlocked=false,returnFocus=null,entryAllowed=false;
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
function geometry(c,occupied){
 c=normalize(c);if((c[6]||1)>1)return window.MTheorySections.geometry(c,occupied);const itemCount=occupied;occupied*=c[4];
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
 const radius=Math.max(...g.points.map(p=>Math.hypot(...p))),growth=[11,12].includes(c[2])?1+Math.log2(1+occupied/14)*.06:1,scale=Math.SQRT2*growth/radius;
 g=arcade.geometryFromCells(cells.map(f=>({...f,vertices:f.vertices.map(p=>p.map(v=>v*scale))})),frequency);
 g.configuration=c.slice();g=arcade.compactEmptyFacets(g,occupied);g.facetsPerItem=c[4];g.itemCount=itemCount;g.occupiedFacets=occupied;cache.set(key,g);if(cache.size>24)cache.delete(cache.keys().next().value);return g;
}
const el=(tag,attrs={},text='')=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);e.textContent=text;return e;};
const entry=el('button',{id:'facet-lab-entry',hidden:''},'Facet Lab');document.body.append(entry);
const root=el('section',{id:'facet-lab',hidden:'','aria-label':'Facet Lab menu explorer'}),header=el('header'),title=el('strong',{},'FACET LAB'),savedText=el('span',{'aria-live':'polite'}),save=el('button',{id:'lab-save'},'Save'),back=el('button',{id:'lab-back'},'← Manifold menu');header.append(title,savedText,save,back);root.append(header);
const main=el('div',{id:'facet-lab-main'}),aside=el('aside',{id:'facet-lab-tools','aria-label':'Geometry configurators'});const left=el('aside',{id:'facet-lab-left','aria-label':'Branching and Bucky configurators'});root.append(left,main,aside);document.body.append(root);
const notice=el('div',{id:'lab-notice'},'Drag to turn · Shift-drag to move · Wheel / pinch to zoom'),state=el('output',{id:'lab-state','aria-live':'polite'}),actions=el('div',{id:'lab-actions'});main.append(notice,state,actions);
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='lab-connectors';main.append(svg);
const anchors=[[.2,.15],[.8,.15],[.2,.76],[.8,.76],[.15,.45],[.85,.45]],callouts=anchors.map(([x,y])=>{const b=el('button',{class:'lab-callout'+(y===.45?' side-callout':''),hidden:''});b.style.left=x*100+'%';b.style.top=y*100+'%';main.append(b);const line=document.createElementNS(svg.namespaceURI,'line'),circle=document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('r',3);svg.append(line,circle);return {x,y,b,line,circle};});
function inside([x,y],poly){let sign=0;return poly.every((a,i)=>{const b=poly[(i+1)%poly.length],v=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(v)<1e-6)return true;if(!sign)sign=Math.sign(v);return Math.sign(v)===sign;});}
class Pane{
 constructor(host,label,onSelect){this.canvas=el('canvas',{tabindex:'0','aria-label':label});host.prepend(this.canvas);this.renderer=new VERenderer(this.canvas,arcade.geometryFor(14).faces,arcade.geometryFor(14).points,arcade.geometryFor(14).edges);this.roll=Math.PI/4;this.upright=null;this.lastInteraction=performance.now();this.lastRotation=-Infinity;this.yaw=Math.PI/4;this.pitch=Math.asin(1/Math.sqrt(3));this.distance=4.5;this.pan=[0,0];this.hits=[];this.onSelect=onSelect;this.pointers=new Map();this.spin=[0,0];this.selected=-1;this.bind();}
 set(g,labels,occupied,width=1){this.upright=null;this.lastInteraction=performance.now();this.tour=null;g=arcade.facetTerritories(g,occupied/width,width);this.g=g;this.labels=g.faceItems.map(i=>i<0?null:labels[i*width]);this.occupied=g.occupiedFacets;this.renderer.setGeometry(g.faces,g.points,g.edges,!!g.mtheory);}
 focusFacet(i){const f=this.g.menuFaces[i];if(!f)return;const [x,y,z]=f.normal,angle=Math.atan2(x,z)+Math.PI;this.target={yaw:this.yaw+Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw)),pitch:-Math.atan2(y,Math.hypot(x,z))};}
 reset(){this.settlePending=false;this.tour=null;this.target=null;this.roll=Math.PI/4;this.upright=null;this.lastInteraction=performance.now();this.lastRotation=-Infinity;this.yaw=Math.PI/4;this.pitch=Math.asin(1/Math.sqrt(3));this.distance=4.5;this.pan=[0,0];this.spin=[0,0];}
 turn([x,y,z]){const a=this.yaw,b=this.pitch,r=this.roll,u=x*Math.cos(a)-z*Math.sin(a),v=z*Math.cos(a)+x*Math.sin(a),Y=y*Math.cos(b)-v*Math.sin(b);return [u*Math.cos(r)+Y*Math.sin(r),Y*Math.cos(r)-u*Math.sin(r),v*Math.cos(b)+y*Math.sin(b)];}
 bind(){const c=this.canvas;
  for(const type of ['pointerdown','pointermove','pointerup','wheel','keydown'])c.addEventListener(type,()=>{if(type!=='pointermove'||this.pointers.size)this.upright=null;this.lastInteraction=performance.now();},{capture:true,passive:true});
  c.onpointerdown=e=>{this.settlePending=false;this.rotationGesture=false;this.multiGesture=this.pointers.size>0;this.brake=Math.hypot(...this.spin)>.00004;this.tour=null;c.focus();c.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,[e.clientX,e.clientY,e.timeStamp]);this.start=[e.clientX,e.clientY];this.target=null;this.moved=false;this.spin=[0,0];this.spinResponse=null;this.onGestureStart?.();};
  c.onpointermove=e=>{const p=this.pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p[0],dy=e.clientY-p[1];this.moved ||=Math.hypot(e.clientX-this.start[0],e.clientY-this.start[1])>5;
   if(this.pointers.size===2){this.rotationGesture=false;const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(p[0]-other[0],p[1]-other[1]),after=Math.hypot(e.clientX-other[0],e.clientY-other[1]);this.distance=Math.max(1.54,Math.min(12,this.distance*before/Math.max(after,1)));this.moved=true;this.spin=[0,0];}
   else if(e.shiftKey){this.pan[0]+=dx/c.clientHeight*4;this.pan[1]-=dy/c.clientHeight*4;this.spin=[0,0];}else{if(!this.multiGesture&&Math.hypot(e.clientX-this.start[0],e.clientY-this.start[1])>5)this.rotationGesture=true;this.yaw+=dx*.008;this.pitch+=dy*.008;this.onRotation?.(dx*.008,dy*.008);const dt=e.timeStamp-p[2];if(dt>0){const blend=1-Math.exp(-dt/45);this.spin=[dx,dy].map((v,k)=>Math.max(-.018,Math.min(.018,this.spin[k]*(1-blend)+v*.008/dt*blend)));}}
   this.pointers.set(e.pointerId,[e.clientX,e.clientY,e.timeStamp]);};
  const release=e=>{if(!this.pointers.has(e.pointerId))return;const sample=this.pointers.get(e.pointerId);this.pointers.delete(e.pointerId);const held=e.type==='pointercancel'||reduced.matches?0:Math.exp(-Math.max(0,e.timeStamp-sample[2]-50)/80);this.spin=this.spin.map(v=>v*held);if(e.type==='pointercancel')this.settlePending=false;else if(this.spinSelect&&!this.pointers.size&&(this.rotationGesture||this.brake)&&!this.multiGesture)this.settlePending=true;if(!this.moved&&!this.brake&&e.type==='pointerup'){const r=c.getBoundingClientRect(),hit=this.hits.find(f=>inside([e.clientX-r.left,e.clientY-r.top],f.polygon));if(hit)this.onSelect(hit.index);}if(this.pointers.size)this.moved=true;this.onGestureRelease?.(e);};c.onpointerup=release;c.onpointercancel=e=>{this.moved=true;release(e);};
  const wheel=e=>{this.settlePending=false;e.preventDefault();this.distance=Math.max(1.54,Math.min(12,Math.SQRT2+(this.distance-Math.SQRT2)*Math.exp(e.deltaY*.004)));};c.addEventListener('wheel',wheel,{passive:false});
  c.onkeydown=e=>{this.settlePending=false;if(e.metaKey||e.ctrlKey||e.altKey)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();this.spin=[0,0];if(this===central&&e.code==='ArrowUp')step(1);else if(this===central&&e.code==='ArrowDown')step(-1);else if(e.code==='ArrowLeft')this.yaw-=.12;else if(e.code==='ArrowRight')this.yaw+=.12;else if(e.code==='ArrowUp')this.pitch+=.12;else if(e.code==='ArrowDown')this.pitch-=.12;else if(e.code==='Enter'&&this.hits.length)this.onSelect(this.hits.reduce((a,b)=>a.depth<b.depth?a:b).index);}};
 }
 render(dt){const c=this.canvas,w=c.clientWidth,h=c.clientHeight;if(!w||!h||!this.g)return;const dpr=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  if(reduced.matches)this.spin=[0,0];
  const response=this.spinResponse??(config[2]===9?Math.E:1);if(this.target){const ease=1-Math.exp(-dt*response/240);this.yaw+=(this.target.yaw-this.yaw)*ease;this.pitch+=(this.target.pitch-this.pitch)*ease;} if(!this.pointers.size&&!reduced.matches){const momentum=this.spinResponse!=null||this.spinSelect?4000:1400,decay=Math.exp(-dt/momentum),advance=momentum*(1-decay);this.yaw+=this.spin[0]*advance*response;this.pitch+=this.spin[1]*advance*response;this.spin=this.spin.map(v=>v*decay);if(Math.hypot(...this.spin)<.00004)this.spin=[0,0];}
  this.tour=null;
  if(this===central&&!reduced.matches&&!this.pointers.size&&!this.spin.some(Boolean)&&performance.now()-this.lastInteraction>=1200&&(!this.target||Math.hypot(this.target.yaw-this.yaw,this.target.pitch-this.pitch)<1e-6)){
   if(!this.upright)this.upright={start:performance.now(),from:this.roll,to:this.roll+arcade.uprightCorrection(this.g,p=>this.turn(p),[-this.pan[0],-this.pan[1],-this.distance],Math.min(w,h)*1.05,w,h)};
   const t=Math.min(1,(performance.now()-this.upright.start)/900),ease=t*t*(3-2*t);this.roll=this.upright.from+(this.upright.to-this.upright.from)*ease;this.upright.done=t>=1;
  }
  const rotation=[this.yaw,this.pitch,this.roll];if(this.previousRotation&&rotation.some((v,k)=>Math.abs(v-this.previousRotation[k])>1e-8))this.lastRotation=performance.now();this.previousRotation=rotation;
  const a=this.yaw,b=this.pitch,roll=this.roll,turn=([x,y,z])=>{const u=x*Math.cos(a)-z*Math.sin(a),v=z*Math.cos(a)+x*Math.sin(a),Y=y*Math.cos(b)-v*Math.sin(b);return [u*Math.cos(roll)+Y*Math.sin(roll),Y*Math.cos(roll)-u*Math.sin(roll),v*Math.cos(b)+y*Math.sin(b)];},camera=[-this.pan[0],-this.pan[1],-this.distance],focal=Math.min(w,h)*1.05,cx=w/2,cy=h/2;
  const r=this.renderer,g=this.g,territories=[];r.begin({yaw:a,pitch:b,roll,camera,focal,width:w,height:h});r.cell([0,0,0],-1,this.selected,!!g.mtheory,this.occupied);this.hits=[];
  g.menuFaces.forEach((f,index)=>{const normal=turn(f.normal),center=turn(f.center).map((v,k)=>v-camera[k]);if(center[2]<.1||dot(normal,center)>=-.03)return;const vertices=f.vertices.map(p=>turn(p).map((v,k)=>v-camera[k]));if(vertices.some(p=>p[2]<=.06))return;const polygon=vertices.map(p=>[cx+focal*p[0]/p[2],cy-focal*p[1]/p[2]]),x=cx+focal*center[0]/center[2],y=cy-focal*center[1]/center[2],complete=polygon.every(([x,y])=>x>=8&&x<=w-8&&y>=8&&y<=h-8);
   this.hits.push({index,polygon,x,y,complete,depth:center[2]});const text=this.labels[index];if(!text)return;
   const base=turn(f.base).map((v,k)=>v-camera[k]),ux=turn(f.ux),vy=turn(f.vy),m=[focal*ux[0]+cx*ux[2],cy*ux[2]-focal*ux[1],0,ux[2],focal*vy[0]+cx*vy[2],cy*vy[2]-focal*vy[1],0,vy[2],0,0,1,0,focal*base[0]+cx*base[2],cy*base[2]-focal*base[1],0,base[2]];
   territories.push({item:g.faceItems[index],index,x,y,polygon});
  });
  let labeled=territories;
  if(g.count>256||g.mtheory){const items=new Set();if(this===central){labHover.update();const candidates=this.hits.filter(f=>f.complete&&f.index<this.occupied);for(const [x,y]of anchors){const ay=y>.5&&w<600?.68:y,best=candidates.reduce((a,b)=>!a||Math.hypot(b.x-x*w,b.y-ay*h)<Math.hypot(a.x-x*w,a.y-ay*h)?b:a,null);if(best)items.add(g.faceItems[best.index]);}const hover=document.getElementById('lab-hover');if(!hover.hidden)items.add(g.faceItems[Number(hover.dataset.facet)]);}labeled=territories.filter(f=>items.has(f.item));}
  this.territoryLabels=arcade.territoryLabels(r,labeled,i=>this.labels[g.faceItems.indexOf(i)],g.faceItems[this.selected],w,h,g,turn,camera,focal,[0,0,0],this===central?112:240);
  // Choose once, after a deliberate rotational gesture has lost its momentum.
  // Rank occupied facets by their actual visible screen area, including clipping.
  if(this.settlePending&&!this.pointers.size&&!this.spin.some(Boolean)){
   const area=polygon=>{let poly=polygon;for(const [axis,edge,above]of [[0,0,true],[0,w,false],[1,0,true],[1,h,false]]){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=above?a[axis]>=edge:a[axis]<=edge,ib=above?b[axis]>=edge:b[axis]<=edge;if(ia)out.push(a);if(ia!==ib){const t=(edge-a[axis])/(b[axis]-a[axis]);out.push(a.map((v,k)=>v+t*(b[k]-v)));}}poly=out;}return Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-p[1]*q[0];},0))/2;};
   const best=this.hits.filter(f=>g.faceItems[f.index]>=0).map(f=>({...f,area:area(f.polygon)})).sort((a,b)=>b.area-a.area||a.index-b.index)[0];
   this.settlePending=false;
   if(best?.area>0){this.lastSpinSelection={facet:best.index,item:g.faceItems[best.index],area:best.area,view:{yaw:this.yaw,pitch:this.pitch,roll:this.roll,distance:this.distance,pan:this.pan.slice()}};this.onSelect(best.index);}
  }

 }
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let motion=false;
const central=new Pane(main,'Facet Lab geometry. Up and Down add or remove facets; drag to turn; Shift-drag to move.',selectCombination);central.canvas.id='lab-geometry';
for(const type of ['pointerdown','input','change','keydown','wheel'])root.addEventListener(type,e=>{if(e.target.closest('.lab-callout')||e.code==='Tab')return;central.upright=null;central.lastInteraction=performance.now();},{capture:true,passive:true});
const labHover=arcade.hoverCallout(main,'lab-hover',()=>central.hits.filter(f=>central.g.faceItems[f.index]>=0),f=>central.labels[f.index]);
const panels=[];
function panel(name,choices,onSelect,hostColumn=aside){const host=el('section',{class:'lab-config'}),h=el('h3',{},name),select=el('select',{'aria-label':name}),description=el('p');host.append(h);hostColumn.append(host);const pane=new Pane(host,name+' vector equilibrium',i=>{i=pane.g.faceItems[i];if(!select.disabled&&i>=0&&i<choices.length){select.value=String(i+1);select.dispatchEvent(new Event('change'));}});pane.spinSelect=!name.startsWith('4');if(pane.spinSelect)pane.canvas.setAttribute('aria-description','Push and release to spin; the most visible facet is selected when momentum stops.');host.prepend(h);choices.forEach(([label],i)=>select.append(el('option',{value:i+1},(i+1)+' · '+label)));host.append(select,description);select.onchange=()=>{pane.spin=[0,0];pane.settlePending=false;const i=Number(select.value)-1;pane.selected=i;pane.focusFacet(i);description.textContent=choices[i][1]||choices[i][0];onSelect(i+1);};pane.set(arcade.geometryFor(14),choices.map(([label],i)=>name.startsWith('3')?['VE','T','O','C','π','φ','√2','θ','e','Fₙ','H','C³','sin','τ'][i]:String(i+1)),choices.length);panels.push({pane,select,description,choices});return pane;}
panel('1 · Symmetry',symmetry,n=>change(0,n));panel('2 · Facets per step',Array.from({length:14},(_,i)=>[String(i+1),'↑ / ↓ changes the occupied facet count by '+(i+1)+'.']),n=>change(1,n));panel('3 · Rule / influence',rules,n=>change(2,n));panel('4 · Explore',controls.map(s=>[s,s]),n=>control(n));
panel('5 · Branching',branching,n=>change(3,n),left);panel('6 · Facets per item',Array.from({length:14},(_,i)=>[String(i+1),(i+1)+' selectable facets per menu item; capacity follows item count.']),n=>change(4,n),left);panel('7 · Bucky influences',bucky,n=>change(5,n),left);
const constructs=window.MTheorySections.catalog;
const reservedPane=panel('8 · M-theory constructs',constructs.map(x=>[x.name,x.description]),n=>{if(n===1)config=config.slice(0,6);else config=[...defaults,n,4,7,n===4?3:1];central.reset();sync();rebuild();},left);
const theoryHost=panels.at(-1).select.parentElement,theoryDetails=el('details',{id:'mtheory-details'}),theorySummary=el('summary',{},'Initial conditions / section'),theoryInfo=el('p'),theorySource=el('a',{target:'_blank',rel:'noopener'},'Construction source');theoryDetails.append(theorySummary);theoryHost.append(theoryDetails);
const theoryInputs=[];
for(const [label,index,initial]of [['Radius R / ρ',7,4],['Section angle α',8,7],['Quotient order k',9,3]]){const host=el('label',{},label),input=el('select',{'aria-label':label});for(let n=1;n<=14;n++)input.append(el('option',{value:n},index===7?String(n/4):index===8?(n*6)+'°':String(n)));input.value=initial;input.onchange=()=>{config[index]=Number(input.value);sync();rebuild();};host.append(input);theoryDetails.append(host);theoryInputs.push({input,index});}theoryDetails.append(theoryInfo,theorySource);
// One physical gesture supplies identical angular increments and release velocity.
// Each configurator keeps its own starting orientation and native facet selection.
const spinAllHost=el('div',{id:'lab-spin-all'}),spinAllLabel=el('span',{},'Spin all');header.insertBefore(spinAllHost,savedText);
const spinAll=new Pane(spinAllHost,'Spin all configurators vector equilibrium',()=>{});spinAllHost.append(spinAllLabel);spinAll.spinSelect=true;spinAll.set(arcade.geometryFor(14),[],0);
spinAll.canvas.setAttribute('aria-description','Push this VE to apply the same rotation and momentum to every configurator box.');
const followers=()=>panels.map(p=>p.pane);
spinAll.onGestureStart=()=>{const response=config[2]===9?Math.E:1;spinAll.spinResponse=response;spinAll.lastInput={rotation:[0,0],velocity:[0,0],response,controllerStart:[spinAll.yaw,spinAll.pitch],starts:followers().map(p=>[p.yaw,p.pitch])};for(const p of followers()){p.spin=[0,0];p.spinResponse=response;p.target=null;p.settlePending=false;p.upright=null;}};
spinAll.onRotation=(yaw,pitch)=>{spinAll.lastInput.rotation[0]+=yaw;spinAll.lastInput.rotation[1]+=pitch;for(const p of followers()){p.yaw+=yaw;p.pitch+=pitch;p.lastInteraction=performance.now();}};
spinAll.onGestureRelease=e=>{const select=e.type==='pointerup'&&!spinAll.multiGesture&&(spinAll.rotationGesture||spinAll.brake);spinAll.lastInput.velocity=spinAll.spin.slice();for(const p of followers()){p.spin=spinAll.spin.slice();p.settlePending=!!p.spinSelect&&select;}spinAll.settlePending=select;};
const button=(text,fn)=>{const b=el('button',{},text);b.onclick=fn;actions.append(b);return b;};button('− Facets ↓',()=>step(-1));const stepLabel=el('span',{id:'lab-step'});actions.append(stepLabel);button('+ Facets ↑',()=>step(1));button('Zoom +',()=>control(3));button('Zoom −',()=>control(4));button('Fit',()=>control(5));button('Move ←',()=>central.pan[0]-=.15);button('Move →',()=>central.pan[0]+=.15);button('Move ↑',()=>central.pan[1]+=.15);button('Move ↓',()=>central.pan[1]-=.15);
function triple(index){let n=(index*18493)%6453888;const values=Array(6);for(let i=5;i>=0;i--){const radix=i===0?12:14;values[i]=n%radix+1;n=Math.floor(n/radix);}return values;}
function selectCombination(i){if((config[6]||1)>1){central.selected=i;theoryDetails.open=true;theoryInfo.textContent='Selected section triangle '+i+' · first source vertex: ['+central.g.sourceFaces[i][0].map(x=>Number(x.toFixed(5))).join(', ')+']. Display coordinates: ['+central.g.faces[i][0].map(x=>Number(x.toFixed(5))).join(', ')+']. '+(config[6]===5?'Source order: ρ, q₁…q₄, p₁…p₄.':'Source order: real ambient coordinates.');state.textContent=constructs[config[6]-1].name+' · section triangle '+i;return;}const item=central.g.faceItems[i];if(item==null||item<0)return;config=triple(item);central.selected=i;sync();rebuild();central.focusFacet(Math.min(i,central.occupied-1));}
function change(i,n){config[i]=n;sync();rebuild();}
function step(direction){count=Math.max(0,Math.min(2352,count+direction*config[1]));rebuild();}
function sync(){for(let i=0;i<6;i++){const p=panels[i<3?i:i+1];p.select.value=String(config[i]);p.pane.selected=config[i]-1;p.description.textContent=p.choices[config[i]-1][1];}const type=config[6]||1,p=panels.at(-1);for(const i of [0,2,4,5,6]){panels[i].select.disabled=type>1;panels[i].pane.spinSelect=type===1;panels[i].pane.canvas.setAttribute('aria-disabled',String(type>1));}p.select.value=type;p.pane.selected=type-1;p.description.textContent=constructs[type-1].description;theoryDetails.hidden=type===1;for(const {input,index}of theoryInputs){input.value=config[index]||1;input.disabled=index===9&&type!==4;}theorySource.href=constructs[type-1].source;theoryInfo.textContent='7D construction · 2D section. Radius is dimensionless. α fixes the omitted coordinates; k controls the common phase identification. Existing geometry influences apply in Native Arcade mode; section resolution follows item count.';stepLabel.textContent='± '+config[1];}
function rebuild(){if((config[6]||1)>1){const g=geometry(config,count);central.set(g,g.menuFaces.map((_,i)=>constructs[config[6]-1].name+' · section '+i),g.count);state.textContent=constructs[config[6]-1].name+' · 7D / 2D section · R/ρ='+g.mtheory.radius+' · α='+config[8]*6+'°'+(config[6]===4?' · k='+config[9]:'')+' · '+g.count+' triangles';save.dataset.saved='false';return;}const occupied=count*config[4];central.set(geometry(config,count),Array.from({length:occupied},(_,i)=>triple(Math.floor(i/config[4])).join(' · ')),occupied,config[4]);if(central.selected>=occupied)central.selected=-1;state.textContent=config.join(' · ')+'   |   '+count+' items / '+central.occupied+' occupied / '+central.g.count+' cells   |   frequency '+(central.g.subdivision||1);save.dataset.saved='false';}
function control(n){switch(n){case 1:step(1);break;case 2:step(-1);break;case 3:central.distance=Math.max(1.54,central.distance*.85);break;case 4:central.distance=Math.min(12,central.distance/ .85);break;case 5:central.distance=4.5;central.pan=[0,0];break;case 6:central.pan=[0,0];break;case 7:central.yaw-=.2;break;case 8:central.yaw+=.2;break;case 9:central.pitch+=.2;break;case 10:central.pitch-=.2;break;case 11:central.upright=null;central.lastInteraction=-Infinity;break;case 12:count=0;rebuild();break;case 13:config=defaults.slice();sync();rebuild();break;case 14:central.reset();break;}}
function open(configuration=defaults,items=0){if(!valid(configuration))throw Error('Invalid configuration');returnFocus=document.activeElement;arcade.pauseNavigation();active=true;config=configuration.slice();count=items;unlocked=true;save.hidden=false;savedText.textContent='';motion=false;spinAll.reset();for(const p of followers()){p.spin=[0,0];p.spinResponse=null;p.settlePending=false;}central.reset();sync();rebuild();root.hidden=false;entry.hidden=true;document.body.classList.add('facet-lab-open');central.canvas.focus();}
function close(){active=false;root.hidden=true;document.body.classList.remove('facet-lab-open');entry.hidden=true;arcade.refreshGeometry();window.dispatchEvent(new Event('manifold-close'));(returnFocus?.isConnected?returnFocus:document.querySelector('#ve'))?.focus();}
entry.onpointerenter=()=>arcade.pauseNavigation();entry.onfocus=()=>arcade.pauseNavigation();entry.onclick=()=>open();back.onclick=close;save.onclick=()=>{if(!active)return;try{window.ContinuumLab.save(config.slice(),count);savedText.textContent='Saved '+config.join(' · ')+' to manifold menu';save.dataset.saved='true';}catch(error){savedText.textContent=error.message;}};
root.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();close();}if(e.code==='Tab'){const focus=[...root.querySelectorAll('button:not([hidden]),canvas,select')].filter(e=>!e.disabled),first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function same(indices){return indices.length===6&&indices.every(i=>Number.isInteger(i)&&i===indices[0]);}
let previous=0;function draw(now){const dt=Math.min(50,now-previous);previous=now;if(active&&!document.hidden){central.render(dt);labHover.update();spinAll.render(dt);panels.forEach(p=>p.pane.render(dt));if(!spinAll.pointers.size&&!spinAll.spin.some(Boolean)&&!followers().some(p=>p.settlePending||p.spin.some(Boolean))){spinAll.spinResponse=null;for(const p of followers())p.spinResponse=null;}const w=main.clientWidth,h=main.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const ids=[];for(const c of callouts){const ay=c.y>.5&&w<600?.68:c.y;c.b.style.top=ay*100+'%';const candidates=central.hits.filter(f=>f.complete&&f.index<central.occupied),best=candidates.reduce((a,b)=>!a||Math.hypot(b.x-c.x*w,b.y-ay*h)<Math.hypot(a.x-c.x*w,a.y-ay*h)?b:a,null);c.b.hidden=!best||(central.g.count<=256&&((!reduced.matches&&!central.upright?.done)||performance.now()-central.lastRotation<180));c.line.style.display=c.circle.style.display=!c.b.hidden?'':'none';ids.push(best?.index??null);if(!best){delete c.b.dataset.facet;continue;}c.b.dataset.facet=best.index;c.b.textContent=central.labels[best.index];c.b.disabled=false;c.b.onclick=()=>selectCombination(best.index);c.line.setAttribute('x1',best.x);c.line.setAttribute('y1',best.y);c.line.setAttribute('x2',c.x*w);c.line.setAttribute('y2',ay*h);c.circle.setAttribute('cx',best.x);c.circle.setAttribute('cy',best.y);}if(same(ids)){unlocked=true;save.hidden=false;}}requestAnimationFrame(draw);}requestAnimationFrame(draw);
window.FacetLab={open,close,geometryForConfiguration:geometry,get geometry(){return central.g;},get projectedFacets(){return central.hits.map(f=>({...f}));},get active(){return active;},get navigationRate(){return saved?.[2]===9?Math.E:saved?.[2]===14?6/(2*Math.PI):1;},get hasSavedConfiguration(){return !!saved&&saved.join('-')!==defaults.join('-');},get state(){return {configuration:config.slice(),construction:central.g?.mtheory?{...central.g.mtheory,samples:undefined}:null,spinAll:{yaw:spinAll.yaw,pitch:spinAll.pitch,spin:spinAll.spin.slice(),pending:!!spinAll.settlePending,lastInput:spinAll.lastInput||null,reserved:{yaw:reservedPane.yaw,pitch:reservedPane.pitch,spin:reservedPane.spin.slice()}},configurators:panels.map(p=>({name:p.select.getAttribute('aria-label'),spin:p.pane.spin.slice(),pending:!!p.pane.settlePending,selected:Number(p.select.value),yaw:p.pane.yaw,pitch:p.pane.pitch,lastSpinSelection:p.pane.lastSpinSelection||null})),saved:saved?.slice()||null,count,occupiedFacets:central.occupied,territoryLabels:central.territoryLabels,saveUnlocked:unlocked,entryAllowed,frequency:central.g?(central.g.subdivision||1):null,facets:central.g?.count,motion,tour:central.tour?{index:central.tour.index,faces:central.tour.options.length,phase:performance.now()-central.tour.start<central.tour.duration?'moving':'paused'}:null,view:{roll:central.roll,resting:!central.pointers.size&&performance.now()-central.lastRotation>=180,upright:central.upright,yaw:central.yaw,pitch:central.pitch,distance:central.distance,pan:central.pan.slice()},renderers:[central,...panels.map(p=>p.pane)].map(p=>p.renderer.diagnostics)};},observeMenuCallouts(indices){if(active)return;const counts=new Map();for(const item of indices)if(Number.isInteger(item)&&item>=0)counts.set(item,(counts.get(item)||0)+1);entryAllowed=[...counts.values()].some(n=>n>=4);entry.hidden=!entryAllowed||!!arcade.state.feature;},get facetsPerItem(){return saved?.[4]||1;},menuGeometry(required){return geometry(saved,required);}};
// Restore only a configuration explicitly saved by this viewer.
entry.hidden=true;
})();
