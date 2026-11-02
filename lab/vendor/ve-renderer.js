/* GPU navigation shell: cuboctahedron shell plus twelve equal-length radial struts. */
(()=>{'use strict';
window.VERenderer=class {
 constructor(canvas,faces,points,edges){
  const gl=this.gl=canvas.getContext('webgl2',{antialias:true,alpha:true});
  if(!gl)throw Error('WebGL 2 is required for Arcade navigation. Enable hardware acceleration and reload.');
  this.canvas=canvas;this.faces=faces;this.points=points;this.edges=edges;this.draws=0;this.init();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});
  canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.init();});
 }
 init(){const g=this.gl;this.meshFaces=null;this.labelProgram=null;this.labelTextures=null;
  const vs=`#version 300 es
  precision highp float;
  in vec3 position;in vec3 normal;in float facet;
  uniform vec2 angles;uniform float roll;uniform vec3 offset;uniform vec3 camera;uniform vec2 scale;
  out vec3 N;out vec3 P;flat out float F;
  vec3 turn(vec3 p){float a=angles.x,b=angles.y;float u=p.x*cos(a)-p.z*sin(a),v=p.z*cos(a)+p.x*sin(a);float y=p.y*cos(b)-v*sin(b);return vec3(u*cos(roll)+y*sin(roll),y*cos(roll)-u*sin(roll),v*cos(b)+p.y*sin(b));}
  void main(){P=turn(position+offset)-camera;N=normalize(turn(normal));F=facet;float near=.04,far=80.;gl_Position=vec4(P.xy*scale,((far+near)/(far-near))*P.z-2.*far*near/(far-near),P.z);}`;
  const fs=`#version 300 es
  precision highp float;
  in vec3 N;in vec3 P;flat in float F;uniform float selected;uniform bool wire;uniform bool surface;uniform bool dense;uniform float panelOpacity;uniform float occupiedCount;uniform bool core;out vec4 color;
  void main(){if(!core&&(surface&&!wire||dense||(!wire&&F>=occupiedCount))&&dot(N,P)>=0.)discard;vec3 lightDirection=normalize(vec3(-.6,.85,-1.));float depth=clamp((P.z-2.5)/4.,0.,1.);if(wire){float glow=mix(1.,.22,depth);color=vec4(vec3(.259,.961,.843)*glow,core?.38:1.);return;}float diffuse=max(0.,dot(normalize(N),lightDirection));float light=.12+.88*diffuse;vec3 base=vec3(.259,.961,.843);if(abs(F-selected)<.1)base=vec3(1.,.141,.616);vec3 ink=base*light;float alpha=.035+.22*diffuse;alpha*=mix(1.,.45,depth);float density=panelOpacity/.9;float opacity=mix(alpha,.9,density);float dynamic=smoothstep(.8,.9,panelOpacity);opacity*=mix(1.,.18+.82*diffuse,dynamic);color=vec4(ink,F>=occupiedCount?.5:min(.9,opacity));}`;
  const shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
  const p=this.program=g.createProgram();g.attachShader(p,shader(g.VERTEX_SHADER,vs));g.attachShader(p,shader(g.FRAGMENT_SHADER,fs));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));
  this.uniforms=Object.fromEntries(['angles','roll','offset','camera','scale','selected','wire','surface','dense','panelOpacity','occupiedCount','core'].map(n=>[n,g.getUniformLocation(p,n)]));
  this.vao=g.createVertexArray();g.bindVertexArray(this.vao);const buffer=this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);this.setGeometry(this.faces,this.points,this.edges);
  for(const [name,size,off]of [['position',3,0],['normal',3,3],['facet',1,6]]){const i=g.getAttribLocation(p,name);g.enableVertexAttribArray(i);g.vertexAttribPointer(i,size,g.FLOAT,false,28,off*4);}
  g.enable(g.DEPTH_TEST);g.disable(g.CULL_FACE);this.compiled=true;
 }
 setGeometry(faces,points,edges,preserveWinding=false){if(this.meshFaces===faces)return;this.meshFaces=faces;this.faces=faces;this.points=points;this.edges=edges;const g=this.gl;
  const mesh=[];this.ranges=[];
  this.faces.forEach((face,i)=>{const a=face[1].map((n,k)=>n-face[0][k]),b=face[2].map((n,k)=>n-face[0][k]),c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];if(!preserveWinding&&c.reduce((s,n,k)=>s+n*face[0][k],0)<0)for(let k=0;k<3;k++)c[k]*=-1;const start=mesh.length/7;for(let j=1;j<face.length-1;j++)for(const v of [face[0],face[j],face[j+1]])mesh.push(...v,...c,i);this.ranges.push([start,mesh.length/7-start]);});
  this.edgeStart=mesh.length/7;for(const [a,b]of this.edges)for(const i of [a,b])mesh.push(...this.points[i],...this.points[a].map((v,k)=>(v+this.points[b][k])/2),-1);
  this.radialStart=mesh.length/7;for(const point of this.points)for(const v of [[0,0,0],point])mesh.push(...v,0,0,1,-1);
  // A canonical VE remains inside every expanded shell, including morphs.
  // Its 24 equal edges and 12 equal radial struts share the shell's transform.
  this.corePoints=[];this.coreEdges=[];
  for(let zero=0;zero<3;zero++)for(const a of [-1,1])for(const b of [-1,1]){const p=[0,0,0];p[(zero+1)%3]=a*.48;p[(zero+2)%3]=b*.48;this.corePoints.push(p);}
  for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)if(Math.abs(Math.hypot(...this.corePoints[a].map((v,k)=>v-this.corePoints[b][k]))-Math.SQRT2*.48)<1e-8)this.coreEdges.push([a,b]);
  this.coreStart=mesh.length/7;
  for(const [a,b]of this.coreEdges)for(const i of [a,b])mesh.push(...this.corePoints[i],0,0,1,-1);
  for(const p of this.corePoints)for(const v of [[0,0,0],p])mesh.push(...v,0,0,1,-1);
  g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(mesh),g.STATIC_DRAW);
 }
 begin({yaw,pitch,roll=Math.PI/4,camera,focal,width,height}){this.cameraDistance=Math.hypot(...camera);this.frameFaceCount=0;if(this.lost)return;const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.useProgram(this.program);g.bindVertexArray(this.vao);g.uniform2f(this.uniforms.angles,yaw,pitch);g.uniform1f(this.uniforms.roll,roll);g.uniform3fv(this.uniforms.camera,camera);g.uniform2f(this.uniforms.scale,2*focal/width,2*focal/height);this.draws=0;}
 cell(offset,opening,selected,surface=false,occupiedCount=this.faces.length){this.frameFaceCount=Math.max(this.frameFaceCount||0,this.faces.length);if(this.lost)return;const g=this.gl,u=this.uniforms;g.useProgram(this.program);g.bindVertexArray(this.vao);g.uniform3fv(u.offset,offset);g.uniform1f(u.selected,selected);g.uniform1i(u.wire,0);g.uniform1i(u.core,0);g.uniform1i(u.surface,surface?1:0);g.uniform1i(u.dense,this.faces.length>14?1:0);this.occupiedCount=occupiedCount;g.uniform1f(u.occupiedCount,occupiedCount);this.panelOpacity=Math.min(.9,Math.max(0,(this.faces.length-14)/60*.9));g.uniform1f(u.panelOpacity,this.panelOpacity);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.depthMask(surface||this.faces.length>14);g.enable(g.POLYGON_OFFSET_FILL);g.polygonOffset(1,1);if(opening<0){g.drawArrays(g.TRIANGLES,0,this.edgeStart);this.draws++;}else this.ranges.forEach(([start,count],i)=>{if(i!==opening){g.drawArrays(g.TRIANGLES,start,count);this.draws++;}});g.disable(g.POLYGON_OFFSET_FILL);g.depthMask(true);g.disable(g.BLEND);g.uniform1i(u.wire,1);g.drawArrays(g.LINES,this.edgeStart,this.edges.length*2);if(!surface&&this.faces.length<=14)g.drawArrays(g.LINES,this.radialStart,this.points.length*2);this.draws+=surface?1:2;if(!surface&&this.faces.length>14){g.uniform1i(u.core,1);g.disable(g.DEPTH_TEST);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.drawArrays(g.LINES,this.coreStart,72);g.disable(g.BLEND);g.enable(g.DEPTH_TEST);g.uniform1i(u.core,0);this.draws++;}}
 // Titles share the shell's WebGL surface, avoiding independently rasterized CSS 3D layers.
 label(matrix,text,square,flipped,selected,width,height,polygon=null,fontSize=112,aspect=1){
  if(this.lost)return;const g=this.gl;
  if(!this.labelProgram){
   const shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
   const p=this.labelProgram=g.createProgram();
   g.attachShader(p,shader(g.VERTEX_SHADER,`#version 300 es
   precision highp float;uniform mat4 plane;uniform vec2 viewport;out vec2 uv;
   void main(){vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));uv=corners[gl_VertexID];vec4 p=plane*vec4(uv*960.,0,1);gl_Position=vec4(2.*p.x/viewport.x-p.w,p.w-2.*p.y/viewport.y,0,p.w);}`));
   g.attachShader(p,shader(g.FRAGMENT_SHADER,`#version 300 es
   precision highp float;in vec2 uv;uniform sampler2D ink;uniform vec3 tint;out vec4 color;
   void main(){color=vec4(tint,texture(ink,uv).a);}`));
   g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));
   this.labelUniforms=Object.fromEntries(['plane','viewport','ink','tint'].map(n=>[n,g.getUniformLocation(p,n)]));this.labelTextures=new Map();this.labelSizes=new Map();this.labelBytes=0;this.labelAnisotropy=g.getExtension('EXT_texture_filter_anisotropic');
  }
  // Lay out in surface units, independently of the texture's pixel grid.
  // A square UV map must not stretch glyphs across a rectangular territory.
  aspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
  const logicalHeight=960/aspect,pixels=n=>Math.max(256,Math.min(1024,2**Math.ceil(Math.log2(n)))),textureWidth=pixels(1024*Math.min(1,aspect)),textureHeight=pixels(1024/Math.max(1,aspect));
  const key=JSON.stringify([text,square,flipped,polygon,textureWidth,textureHeight,fontSize,aspect]);let texture=this.labelTextures.get(key);
  if(texture){this.labelTextures.delete(key);this.labelTextures.set(key,texture);}
  if(!texture){
   const canvas=document.createElement('canvas');canvas.width=textureWidth;canvas.height=textureHeight;const c=canvas.getContext('2d');c.scale(textureWidth/960,textureHeight/logicalHeight);
   if(polygon){c.beginPath();polygon.forEach(([x,y],i)=>i?c.lineTo(x*960,y*logicalHeight):c.moveTo(x*960,y*logicalHeight));c.closePath();c.clip();}
   const poly=polygon||[[0,0],[1,0],[1,1],[0,1]],cx=poly.reduce((s,p)=>s+p[0]/poly.length,0),cy=poly.reduce((s,p)=>s+p[1]/poly.length,0);
   const inside=(x,y)=>{let sign=0;return poly.every((a,i)=>{const b=poly[(i+1)%poly.length],v=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(v)<1e-8)return true;if(!sign)sign=Math.sign(v);return Math.sign(v)===sign;});};
   let hx=.38,hy=.23;while(![-1,1].every(x=>[-1,1].every(y=>inside(cx+x*hx,cy+y*hy)))){hx*=.95;hy*=.95;}
   if(flipped){c.translate(cx*960,cy*logicalHeight);c.rotate(Math.PI);c.translate(-cx*960,-cy*logicalHeight);}
   c.textAlign='center';c.textBaseline='top';c.fillStyle='#fff';const max=hx*1920,words=text.split(/\s+/);let size=fontSize*Math.min(1,1/aspect),lines;
   do{c.font='600 '+size+'px ui-monospace, SFMono-Regular, Consolas, monospace';c.fontVariantCaps='small-caps';lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(line&&c.measureText(next).width>max){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);if((lines.length*size*1.2<=hy*2*logicalHeight&&lines.every(line=>c.measureText(line).width<=max))||size<=4)break;size=Math.max(4,size-2);}while(true);
   lines.forEach((line,i)=>c.fillText(line,cx*960,cy*logicalHeight-lines.length*size*.6+i*size*1.2));
   texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,texture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,canvas);g.generateMipmap(g.TEXTURE_2D);if(this.labelAnisotropy)g.texParameterf(g.TEXTURE_2D,this.labelAnisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,g.getParameter(this.labelAnisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);this.labelTextures.set(key,texture);const bytes=textureWidth*textureHeight*4*4/3;this.labelSizes.set(key,bytes);this.labelBytes+=bytes;while(this.labelBytes>128*1024*1024){const oldest=this.labelTextures.keys().next().value;g.deleteTexture(this.labelTextures.get(oldest));this.labelBytes-=this.labelSizes.get(oldest);this.labelTextures.delete(oldest);this.labelSizes.delete(oldest);}
  }
  const u=this.labelUniforms;g.useProgram(this.labelProgram);g.uniformMatrix4fv(u.plane,false,matrix);g.uniform2f(u.viewport,width,height);g.uniform3fv(u.tint,selected?[1,.82,.92]:[.74,.99,.94]);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,texture);g.uniform1i(u.ink,0);g.disable(g.DEPTH_TEST);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.drawArrays(g.TRIANGLES,0,6);g.disable(g.BLEND);g.enable(g.DEPTH_TEST);this.draws++;
 }
 get diagnostics(){const lengths=this.edges.map(([a,b])=>Math.hypot(...this.points[a].map((n,k)=>n-this.points[b][k])));return {api:'WebGL2',labelRendering:{maximumTextureDimension:1024,aspectCorrect:true,fontWeight:600,fontVariantCaps:'small-caps',anisotropy:!!this.labelAnisotropy,textureBytes:this.labelBytes||0},core:{basis:'vector-equilibrium',vertices:12,edges:24,radialStruts:12,radius:this.faces.length>14?Math.SQRT2*.48:Math.SQRT2,points:this.faces.length>14?this.corePoints:this.points},panelOpacity:this.panelOpacity||0,occupiedFacets:this.occupiedCount,emptyFacets:this.faces.length-(this.occupiedCount??this.faces.length),transparentFacets:0,emptyFacetOpacity:.5,maximumPanelAlpha:.9,lightResponsive:this.panelOpacity>=.8,shadersLinked:this.compiled,contextLost:!!this.lost,drawCalls:this.draws,error:this.gl.getError(),faces:this.faces.length,squares:this.faces.filter(f=>f.length===4).length,triangles:this.faces.filter(f=>f.length===3).length,edges:this.edges.length,radialStruts:this.faces.length>14?0:this.points.length,edgeLength:lengths.every(n=>Math.abs(n-lengths[0])<1e-7)?lengths[0]:null,radius:Math.max(...this.points.map(p=>Math.hypot(...p)))};}
};
})();
