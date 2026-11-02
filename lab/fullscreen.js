/* Keep one Arcade-style control available in both the menu and the lab. */
(()=>{
 'use strict';
 const button=document.getElementById('lab-fullscreen'),status=document.getElementById('fullscreen-status');
 const active=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
 function sync(){const on=active();button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Exit fullscreen':'Enter fullscreen');button.title=on?'Exit fullscreen':'Enter fullscreen';}
 button.addEventListener('click',async()=>{
  status.textContent='';
  try{
   if(active()){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);}
   else{const root=document.documentElement,enter=root.requestFullscreen||root.webkitRequestFullscreen;if(!enter)throw new Error('Fullscreen is unavailable in this browser.');await enter.call(root);}
  }catch(error){status.textContent=error.message||'Fullscreen could not open.';}
  sync();
 });
 button.addEventListener('keydown',event=>{if(event.key==='Tab'&&(window.FacetLab?.active||window.Projections?.active)){const host=window.Projections?.active?'#projections':'#facet-lab',controls=[...document.querySelectorAll(host+' button:not([hidden]),'+host+' canvas,'+host+' select')].filter(el=>!el.disabled&&el.getClientRects().length);const target=event.shiftKey?controls.at(-1):controls[0];if(target){event.preventDefault();target.focus();}}});
 for(const name of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(name,sync);
 sync();
})();
