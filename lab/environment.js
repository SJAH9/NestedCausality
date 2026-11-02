/* Reuse Arcade's native horizon / advancing infinite plane across the active viewport. */
(()=>{'use strict';
let environment=null,lastDraw=0,lastKey='',currentHost=null;
function draw(now){
 if(!document.hidden&&now-lastDraw>=1000/30){
  const source=window.Projections?.active?window.Projections:window.FacetLab?.active?window.FacetLab:window.ContinuumLab;
  const view=source?.environmentView,host=view&&document.getElementById(view.host);
  if(host){
   if(!environment){environment=new ArcadeEnvironment(host);environment.canvas.addEventListener('webglcontextrestored',()=>{lastKey='';});}
   if(currentHost!==host){host.prepend(environment.canvas);currentHost=host;lastKey='';}
   const width=host.clientWidth,height=host.clientHeight,camera=[-(view.pan?.[0]||0),-(view.pan?.[1]||0),-view.distance];
   const key=[view.host,width,height,devicePixelRatio,view.yaw,view.pitch,...camera,document.documentElement.dataset.theme].join(':');
   if(!environment.reduced.matches||key!==lastKey||environment.lost){environment.render({yaw:view.yaw,pitch:view.pitch,camera,focal:Math.min(width,height)*1.05,width,height});lastKey=key;}
   lastDraw=now;
  }
 }
 requestAnimationFrame(draw);
}
window.ManifoldEnvironment={get state(){return environment?{...environment.state,host:currentHost?.id,contextLost:!!environment.lost,native:true}:null;}};
requestAnimationFrame(draw);
})();
