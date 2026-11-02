"""Production interaction verification. Deliberately uses blocks 0 and 8 ONLY."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def expected(text,mode,budget):
 labels=[];positions=[];previous=0;read=0
 for read,char in enumerate(text,1):
  d=int(char)
  if mode>=3:
   s=previous+d;d=1+(s-1)%9 if s else 0;previous=d
  for _ in range(d if mode in (2,4) else 1):
   if len(labels)<budget:labels.append(d);positions.append(read)
  if len(labels)==budget:return labels,positions,read
 raise AssertionError('insufficient test prefix')

def run(url,out):
 out.mkdir(parents=True,exist_ok=True);records=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for mobile in (False,True):
   context=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1000},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url);page.wait_for_function('window.Projections && window.FacetLab')
   assert page.locator('#address-list button').all_text_contents()[:2]==['Facet Lab','Projections']
   # Save through Facet Lab's normal controls, preserving the existing geometry contract.
   page.locator('#address-list button').nth(0).click();page.get_by_label('3 · Rule / influence',exact=True).select_option('4');page.get_by_role('button',name='Save',exact=True).click();page.locator('#lab-back').click()
   assert page.locator('#address-list button').nth(2).text_content()=='12 · 14 · 4 · 1 · 1 · 1'
   page.locator('#address-list button').nth(1).click();page.wait_for_function('Projections.state.ready')
   state=page.evaluate('Projections.state');assert state['facetBudget']==0 and state['blockLimit']==1 and state['configurators']==8
   assert page.locator('#projections .lab-config').count()==8 and page.locator('#projections .lab-config select').count()==8
   blocks=page.get_by_label('3 · Block size',exact=True);assert blocks.locator('option').all_text_contents()==list(map(str,[0,8,16,32,64,128,256,512,1024,2048,4096,8196,16392,32784]))
   page.get_by_label('Saved Facet Lab geometry',exact=True).select_option('12-14-4-1-1-1');page.wait_for_function('Projections.state.ready');assert page.evaluate('Projections.state.minimumFacets')==6
   await_ready='Projections.state.ready && Projections.state.blockSize===8'
   blocks.select_option(index=1);page.wait_for_function(await_ready)
   print('Mobile' if mobile else 'Desktop','small blocks ready',flush=True)
   actual=page.evaluate('Projections.state');native=page.evaluate('(()=>{const c=Projections.state.configuration,g=FacetLab.geometryForConfiguration(c,8/c[4]);return {count:g.count,faces:g.faces.slice(0,16)};})()');assert actual['construction']=='native-add-facets' and actual['wireframeFacets']==native['count'] and actual['sampleFaces']==native['faces']
   modes=page.get_by_label('2 · Mode',exact=True);digits=Path(__file__).parent.joinpath('digits/pi.txt').read_text().strip()
   for mode in range(1,5):
    modes.select_option(index=mode-1);page.wait_for_function('mode=>Projections.state.ready && Projections.state.mode===mode',arg=mode)
    state=page.evaluate('Projections.state');labels,pos,read=expected(digits[:100],mode,8);assert state['labels']==labels and state['sourcePositions']==pos and state['decimalPositions']==read and state['labelledFacets']==8
   page.get_by_label('4 · Block limit',exact=True).select_option(index=1);page.wait_for_function('Projections.state.ready && Projections.state.labelledFacets===16')
   # Return to 8 facets before checking every constant; never select a large block.
   page.get_by_label('4 · Block limit',exact=True).select_option(index=0);modes.select_option(index=0)
   irr=page.get_by_label('1 · Irrational number',exact=True)
   for i,option in enumerate(irr.locator('option').all_text_contents()):
    irr.select_option(index=i);page.wait_for_function('s=>Projections.state.ready && Projections.state.symbol===s',arg=option)
    print('Mobile' if mobile else 'Desktop',option,'8 facets',flush=True)
    state=page.evaluate('Projections.state');prefix=Path(__file__).parent.joinpath('digits',state['constant']+'.txt').read_text()[:8];assert state['labels']==list(map(int,prefix))
   page.get_by_role('button',name='Enter fullscreen',exact=True).click();page.wait_for_function('!!document.fullscreenElement');page.evaluate('document.exitFullscreen()')
   irr.select_option(index=0);page.wait_for_function('Projections.state.ready && Projections.state.constant==="pi"');page.screenshot(path=str(out/('mobile.png' if mobile else 'desktop.png')),full_page=False)
   # Look for native GPU / shader errors and verify a populated central canvas.
   assert page.evaluate('(()=>{const c=document.getElementById("projection-geometry"),p=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<p.length;i+=4)if(p[i])n++;return n>100;})()')
   if mobile:assert page.evaluate('ManifoldGraphics.contexts')==1
   page.locator('#projections-back').click();page.locator('#address-list button').nth(2).click();assert page.evaluate('FacetLab.state.configuration[2]')==4
   page.locator('#lab-back').click();page.goto(url+'#projections');page.wait_for_function('Projections.active && Projections.state.ready');assert page.evaluate('Projections.state.savedGeometries')==1
   assert not errors,errors
   records.append({'mobile':mobile,'passed':True,'blocksTested':[0,8],'facetBudgetsTested':[0,8,16],'errors':errors,'lastProjection':state});context.close()
  browser.close()
 (out/'verification.json').write_text(json.dumps({'url':url,'results':records,'largeBlocksTested':False},indent=2));print(json.dumps({'passed':True,'largeBlocksTested':False}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);a=parser.parse_args();run(a.url,a.output)
