(()=>{'use strict';
function resolveAddress(){
 let fragment;
 try{fragment=decodeURIComponent(location.hash.slice(1));}catch{document.getElementById('status').textContent='Unknown configuration address.';return;}
 if(fragment==='facet-lab')window.ContinuumLab.open(0);
 else if(fragment){const configuration=fragment.split('-').map(Number);if(configuration.length===6&&configuration.every((n,i)=>Number.isInteger(n)&&n>=1&&n<=(i?14:12))){const index=window.ContinuumLab.state.entries.findIndex(e=>e.configuration.join('-')===fragment);if(index>=0)window.ContinuumLab.open(index+1);else window.FacetLab.open(configuration,0);}else document.getElementById('status').textContent='Unknown configuration address.';}
}
window.addEventListener('hashchange',resolveAddress);
resolveAddress();
})();
