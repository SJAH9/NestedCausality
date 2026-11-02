/* Mobile presentation adapter: the native renderer draws all panes through one GPU context. */
(()=>{'use strict';
const mobile=matchMedia('(pointer: coarse)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent);
window.ManifoldGraphics={mode:mobile?'shared-native':'native',contexts:0};
function pool(){
const Native=window.VERenderer,buffer=document.createElement('canvas');buffer.width=buffer.height=1;
buffer.addEventListener('webglcontextlost',()=>window.ManifoldGraphicsStatus?.('Graphics paused. Waiting for the browser to restore the display.'));
buffer.addEventListener('webglcontextrestored',()=>window.ManifoldGraphicsStatus?.(''));
let shared=null;
return class {
 constructor(canvas,faces,points,edges){this.canvas=canvas;this.view=canvas.getContext('2d',{alpha:true});if(!this.view)throw Error('Canvas presentation is unavailable.');this.setGeometry(faces,points,edges);this.snapshot={api:'WebGL2',contextLost:false,drawCalls:0,error:0};if(!shared){shared=new Native(buffer,faces,points,edges);shared.labelTextureLimit=512;shared.labelCacheBudget=24*1024*1024;window.ManifoldGraphics.contexts=1;}}
 setGeometry(faces,points,edges,preserveWinding=false){this.faces=faces;this.points=points;this.edges=edges;this.preserveWinding=preserveWinding;}
 begin(options){const w=this.canvas.width,h=this.canvas.height;if(buffer.width<w||buffer.height<h){buffer.width=Math.max(buffer.width,w);buffer.height=Math.max(buffer.height,h);}shared.setGeometry(this.faces,this.points,this.edges,this.preserveWinding);shared.labelTextureLimit=this.canvas.clientWidth<300?256:512;const gl=shared.gl;gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,w,h);shared.begin(options);gl.viewport(0,0,w,h);}
 cell(...args){shared.cell(...args);}
 projection(data){shared.projection(data);}
 label(...args){shared.label(...args);}
 present(){if(shared.lost)return;const w=this.canvas.width,h=this.canvas.height;this.view.clearRect(0,0,w,h);this.view.drawImage(buffer,0,buffer.height-h,w,h,0,0,w,h);this.snapshot=shared.diagnostics;}
 get diagnostics(){return {...this.snapshot,contextLost:!!shared?.lost,sharedContext:true,presentation:'native WebGL → canvas',labelRendering:{...this.snapshot.labelRendering,maximumTextureDimension:this.canvas.clientWidth<300?256:512,cacheBudgetBytes:24*1024*1024}};}
};
}
window.ManifoldGraphics.createRendererPool=()=>mobile?window.VERenderer:pool();
if(mobile)window.VERenderer=pool();
})();
