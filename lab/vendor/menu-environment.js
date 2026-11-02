/* Arcade's spatial background: an analytic infinite plane, independent of menu ownership. */
(()=>{'use strict';
window.ArcadeEnvironment=class {
 constructor(host){
  this.canvas=document.createElement('canvas');this.canvas.id='arcade-environment';this.canvas.setAttribute('aria-hidden','true');host.prepend(this.canvas);
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.travel=0;this.lastFrame=performance.now();
  this.gl=this.canvas.getContext('webgl2',{alpha:false,antialias:false});if(!this.gl)throw Error('WebGL 2 is required for the Arcade environment.');
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.init();});this.init();
 }
 init(){const g=this.gl,shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
  const p=this.program=g.createProgram();g.attachShader(p,shader(g.VERTEX_SHADER,`#version 300 es
  precision highp float;out vec2 uv;
  void main(){vec2 q=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=q;gl_Position=vec4(q*2.-1.,0,1);}`));
  g.attachShader(p,shader(g.FRAGMENT_SHADER,`#version 300 es
  precision highp float;in vec2 uv;uniform vec2 viewport;uniform float focal;uniform vec4 view;uniform vec3 origin;uniform vec3 paper;uniform vec3 accent;uniform vec3 highlight;out vec4 color;
  float grid(vec2 p){vec2 footprint=max(fwidth(p),vec2(.0001));vec2 line=abs(fract(p-.5)-.5)/footprint;return (1.-min(1.,min(line.x,line.y)))*(1.-smoothstep(.2,.65,max(footprint.x,footprint.y)));}
  void main(){
   vec2 screen=(uv-.5)*viewport/focal;
   vec3 ray=vec3(screen.x,screen.y*cos(view.y)-sin(view.y),cos(view.y)+screen.y*sin(view.y));
   ray.xz=mat2(cos(view.x),-sin(view.x),sin(view.x),cos(view.x))*ray.xz;
   float horizon=abs(ray.y),pixel=1./focal;
   vec3 ink=mix(paper,accent,.025*exp(-horizon*5.));
   ink=mix(ink,highlight,.12*exp(-horizon*25.)+.36*(1.-smoothstep(pixel*.5,pixel*2.,horizon)));
   // Intersect the viewing ray with y = -height: there is no finite far edge.
   float distance=view.z/max(.0001,-ray.y);vec2 point=origin.xz+ray.xz*distance;
   float minor=grid(point),major=grid(point/8.);
   float fade=exp(-length(ray.xz)*distance*.025)*smoothstep(.001,.025,-ray.y);
   vec3 floorInk=mix(paper,accent,.045+.025*exp(-length(point)*.04));
   floorInk=mix(floorInk,accent,(minor*.18+major*.22)*fade);
   floorInk=mix(floorInk,highlight,major*.075*fade);
   float ground=1.-smoothstep(-pixel,pixel,ray.y);
   ink=mix(ink,floorInk,ground*(1.-exp(-horizon*85.)));
   color=vec4(ink,1);
  }`));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));
  this.uniforms=Object.fromEntries(['viewport','focal','view','origin','paper','accent','highlight'].map(n=>[n,g.getUniformLocation(p,n)]));
 }
 render({yaw,pitch,camera,focal,width,height}){
  if(this.lost||!width||!height)return;const g=this.gl,dpr=Math.min(devicePixelRatio||1,2),c=this.canvas;
  if(c.width!==Math.round(width*dpr)||c.height!==Math.round(height*dpr)){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}
  const theme=document.documentElement.dataset.theme||'dark';if(theme!==this.theme){this.theme=theme;const light=theme==='light';this.palette=light?{paper:[247,248,250],accent:[0,111,97],highlight:[178,13,110]}:{paper:[0,0,0],accent:[66,245,215],highlight:[255,36,157]};}
  // Advance the floor slowly into the distance; keep the horizon fixed.
  const now=performance.now(),dt=Math.min(100,Math.max(0,now-this.lastFrame));this.lastFrame=now;
  if(!this.reduced.matches&&!document.hidden)this.travel=this.travel+dt*.00012;
  const a=yaw*.22,b=.06+.10*Math.sin(pitch),heightAbovePlane=2.8+Math.max(0,Math.hypot(...camera)-4.5)*.12,origin=[Math.sin(yaw)*.8+camera[0]*.25,0,camera[2]*.22];
  // Offset along the current ground view so the grid recedes toward its vanishing point.
  origin[0]-=Math.sin(a)*this.travel;origin[2]-=Math.cos(a)*this.travel;
  this.state={infinitePlane:true,groundTravel:this.travel,groundSpeed:this.reduced.matches?0:.12,yaw:a,pitch:b,height:heightAbovePlane,origin,horizonY:height/2-focal*Math.tan(b),width,height,palette:this.palette};
  g.viewport(0,0,c.width,c.height);g.useProgram(this.program);g.uniform2f(this.uniforms.viewport,width,height);g.uniform1f(this.uniforms.focal,focal);g.uniform4f(this.uniforms.view,a,b,heightAbovePlane,0);g.uniform3fv(this.uniforms.origin,origin);
  for(const n of ['paper','accent','highlight'])g.uniform3fv(this.uniforms[n],this.palette[n].map(v=>v/255));g.drawArrays(g.TRIANGLES,0,3);
 }
};
})();
