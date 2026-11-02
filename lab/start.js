(()=>{'use strict';
function resolveAddress(){
 let fragment;
 try{fragment=decodeURIComponent(location.hash.slice(1));}catch{document.getElementById('status').textContent='Unknown configuration address.';return;}
 if(fragment==='facet-lab')window.ContinuumLab.open(0);
 else if(fragment==='datasets')window.ContinuumLab.open(2);
 else if(fragment==='projections')window.ContinuumLab.open(1);
 else if(fragment){const configuration=fragment.split('-').map(Number);if(window.MTheorySections.valid(configuration)){const index=window.ContinuumLab.state.entries.findIndex(e=>e.configuration.join('-')===fragment);if(index>=0)window.ContinuumLab.open(index+3);else{window.DataSets?.close(false);window.Projections?.close(false);window.FacetLab.open(configuration,0);}}else document.getElementById('status').textContent='Unknown configuration address.';}
}
window.addEventListener('hashchange',resolveAddress);
resolveAddress();
})();
