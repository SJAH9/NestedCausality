"""Verify source equations, quotient invariance, section topology and real UI persistence."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def run(url,output):
 output.mkdir(parents=True,exist_ok=True)
 checks=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
  page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_function('window.FacetLab && window.MTheorySections')
  page.locator('#open-selected').click()
  for mode in range(2,6):
   print('Checking construction',mode,flush=True)
   page.get_by_label('8 · M-theory constructs',exact=True).select_option(str(mode))
   page.locator('#mtheory-details summary').click(no_wait_after=True) if not page.locator('#mtheory-details').evaluate('(e)=>e.open') else None
   page.get_by_label('Radius R / ρ',exact=True).select_option('5')
   page.get_by_label('Section angle α',exact=True).select_option('6')
   if mode==4:page.get_by_label('Quotient order k',exact=True).select_option('7')
   result=page.evaluate('''()=>{const c=FacetLab.state.configuration,g=FacetLab.geometry,p=MTheorySections.parameters(c),s=g.mtheory.samples;let residual=0;for(const x of s){if(p.type===2)for(let i=0;i<14;i+=2)residual=Math.max(residual,Math.abs(x[i]**2+x[i+1]**2-p.radius**2));else if(p.type===3||p.type===4)residual=Math.max(residual,Math.abs(x.reduce((a,v)=>a+v*v,0)-p.radius**2));else residual=Math.max(residual,Math.abs(x.slice(1,5).reduce((a,v)=>a+v*v,0)-1),Math.abs(x.slice(5).reduce((a,v)=>a+v*v,0)-1));}const edges=new Map();for(const f of g.faces){const ids=f.map(v=>v.map(x=>Math.round(x*1e8)).join(','));ids.forEach((a,i)=>{const key=[a,ids[(i+1)%3]].sort().join('|');edges.set(key,(edges.get(key)||0)+1);});}return {type:p.type,residual,euler:g.points.length-g.edges.length+g.count,closed:[...edges.values()].every(x=>x===2),finite:g.points.flat().every(Number.isFinite),faces:g.count,config:c};}''')
   assert result['residual']<1e-10,result
   assert result['euler']==(2 if mode==3 else 0) and result['closed'] and result['finite'],result
   page.wait_for_function('FacetLab.projectedFacets.length>0 && FacetLab.state.renderers[0].drawCalls>0')
   assert page.evaluate('FacetLab.state.renderers[0].error')==0
   geometry=page.evaluate('JSON.stringify(FacetLab.geometry)')
   page.locator('#lab-save').click();page.locator('#lab-back').click()
   label=' · '.join(map(str,result['config']))
   page.locator('#address-list').get_by_role('button',name=label,exact=True).click()
   assert page.evaluate('JSON.stringify(FacetLab.geometry)')==geometry
   page.reload();page.wait_for_function('FacetLab.active')
   assert page.evaluate('JSON.stringify(FacetLab.geometry)')==geometry
   page.screenshot(path=str(output/f'construction-{mode}.png'))
   checks.append(result)
  quotient=page.evaluate('''()=>{const c=[12,14,1,1,1,1,4,4,7,7],a=MTheorySections.point(c,.7,1.1),b=MTheorySections.point(c,.7+2*Math.PI,1.1),k=7,t=2*Math.PI/k;return {displayError:Math.max(...a.display.map((v,i)=>Math.abs(v-b.display[i]))),orbitError:Math.max(...[0,2,4,6].flatMap(i=>[Math.abs(b.source[i]-(a.source[i]*Math.cos(t)-a.source[i+1]*Math.sin(t))),Math.abs(b.source[i+1]-(a.source[i]*Math.sin(t)+a.source[i+1]*Math.cos(t)))]))};}''')
  assert max(quotient.values())<1e-10
  page.get_by_label('8 · M-theory constructs',exact=True).select_option('1')
  assert len(page.evaluate('FacetLab.state.configuration'))==6
  assert page.get_by_label('3 · Rule / influence',exact=True).is_enabled()
  page.set_viewport_size({'width':390,'height':844})
  page.get_by_label('8 · M-theory constructs',exact=True).select_option('4')
  page.locator('#mtheory-details summary').click(no_wait_after=True)
  page.get_by_label('Quotient order k',exact=True).select_option('4')
  page.screenshot(path=str(output/'mobile.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  browser.close()
 report={'url':url,'passed':True,'checks':checks,'quotient':quotient,'pageErrors':errors}
 (output/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--url',required=True);a.add_argument('--output',type=Path,required=True);args=a.parse_args();run(args.url,args.output)
