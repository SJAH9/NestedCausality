/* Batched decimal labels on the native Arcade camera and GPU context. */
(()=>{'use strict';
const turn=`vec3 turn(vec3 p){float a=angles.x,b=angles.y;float u=p.x*cos(a)-p.z*sin(a),v=p.z*cos(a)+p.x*sin(a);float y=p.y*cos(b)-v*sin(b);return vec3(u*cos(roll)+y*sin(roll),y*cos(roll)-u*sin(roll),v*cos(b)+p.y*sin(b));}`;
VERenderer.prototype.projection=function(data){
 if(this.lost)return;const gl=this.gl,u=this.uniforms;
 if(this.projectionOwner!==this.program){
  this.projectionOwner=this.program;this.projectionSource=null;this.projectionWire=gl.createBuffer();this.projectionInk=gl.createBuffer();this.projectionVAO=gl.createVertexArray();gl.bindVertexArray(this.projectionVAO);gl.bindBuffer(gl.ARRAY_BUFFER,this.projectionWire);
  const position=gl.getAttribLocation(this.program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,12,0);
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const p=this.projectionProgram=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,`#version 300 es
precision highp float;in vec3 center;in vec3 axisU;in vec3 axisV;in vec3 normal;in float digit;uniform vec2 angles;uniform float roll;uniform vec3 camera;uniform vec2 scale;out vec2 uv;out vec3 N;out vec3 P;flat out float D;${turn}
void main(){vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));uv=corners[gl_VertexID];P=turn(center+(uv.x-.5)*axisU+(uv.y-.5)*axisV)-camera;N=turn(normal);D=digit;float near=.04,far=80.;gl_Position=vec4(P.xy*scale,((far+near)/(far-near))*P.z-2.*far*near/(far-near),P.z);}`));
  gl.attachShader(p,shader(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;in vec2 uv;in vec3 N;in vec3 P;flat in float D;uniform sampler2D atlas;out vec4 color;void main(){if(dot(N,P)>=0.)discard;float a=texture(atlas,vec2((D+uv.x)/10.,1.-uv.y)).a;if(a<.02)discard;color=vec4(.74,.99,.94,a);}`));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  this.projectionUniforms=Object.fromEntries(['angles','roll','camera','scale','atlas'].map(n=>[n,gl.getUniformLocation(p,n)]));
  this.projectionLabelVAO=gl.createVertexArray();gl.bindVertexArray(this.projectionLabelVAO);gl.bindBuffer(gl.ARRAY_BUFFER,this.projectionInk);
  for(const [name,size,offset] of [['center',3,0],['axisU',3,3],['axisV',3,6],['normal',3,9],['digit',1,12]]){const i=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,52,offset*4);gl.vertexAttribDivisor(i,1);}
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=80;const c=canvas.getContext('2d');c.font='600 64px monospace';c.textAlign='center';c.textBaseline='middle';c.fillStyle='white';for(let i=0;i<10;i++)c.fillText(String(i),i*64+32,40);
  this.projectionTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.projectionTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 if(this.projectionSource!==data){gl.bindBuffer(gl.ARRAY_BUFFER,this.projectionWire);gl.bufferData(gl.ARRAY_BUFFER,data.wire,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,this.projectionInk);gl.bufferData(gl.ARRAY_BUFFER,data.ink,gl.STATIC_DRAW);this.projectionSource=data;}
 gl.useProgram(this.program);gl.bindVertexArray(this.projectionVAO);gl.vertexAttrib3f(gl.getAttribLocation(this.program,'normal'),0,0,1);gl.vertexAttrib1f(gl.getAttribLocation(this.program,'facet'),-1);gl.uniform3f(u.offset,0,0,0);gl.uniform1i(u.wire,1);gl.uniform1i(u.core,0);gl.uniform1i(u.surface,0);gl.uniform1i(u.dense,0);gl.disable(gl.BLEND);gl.drawArrays(gl.LINES,0,data.wire.length/3);
 const p=this.projectionUniforms;gl.useProgram(this.projectionProgram);gl.bindVertexArray(this.projectionLabelVAO);
 // Read the same camera uniforms that native begin() set for this pane.
 gl.uniform2fv(p.angles,gl.getUniform(this.program,u.angles));gl.uniform1f(p.roll,gl.getUniform(this.program,u.roll));gl.uniform3fv(p.camera,gl.getUniform(this.program,u.camera));gl.uniform2fv(p.scale,gl.getUniform(this.program,u.scale));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.projectionTexture);gl.uniform1i(p.atlas,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.drawArraysInstanced(gl.TRIANGLES,0,6,data.ink.length/13);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);this.draws+=2;
};
})();
