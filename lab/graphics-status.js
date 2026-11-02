(()=>{'use strict';
const notice=document.createElement('div');notice.setAttribute('role','status');notice.hidden=true;Object.assign(notice.style,{position:'fixed',inset:'auto 10px 10px',zIndex:1000,padding:'12px',background:'#07151c',color:'#b9ffee',border:'1px solid #84b7ad',font:'12px monospace'});document.body.append(notice);
window.ManifoldGraphicsStatus=text=>{notice.textContent=text;notice.hidden=!text;};
window.addEventListener('error',e=>{if(/WebGL|Canvas presentation|shader|graphics/i.test(e.message||''))window.ManifoldGraphicsStatus('The graphics display could not start. '+e.message+' Your saved addresses have not been changed.');});
})();
