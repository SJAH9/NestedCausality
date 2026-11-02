"""Verify the explorer-to-G2 mesh contract and its real controls."""
import argparse,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright

def run(url,output):
 output.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');page.set_default_timeout(20000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url);page.wait_for_function('window.G2Influences && window.FacetLab')
  math=page.evaluate("""()=>{
   const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),a=[.2,.5,.7,-.3,.8,-.1,.4],b=[.6,-.3,.2,.9,-.2,.1,.5],c=G2Influences.cross(a,b);
   return {orthogonal:Math.max(Math.abs(dot(a,c)),Math.abs(dot(b,c))),normError:Math.abs(dot(c,c)-(dot(a,a)*dot(b,b)-dot(a,b)**2)),terms:G2Influences.terms.length};
  }""")
  assert math['orthogonal']<1e-12 and math['normError']<1e-12 and math['terms']==7,math
  page.locator('#open-selected').click()
  select=page.get_by_label('8 · M-theory constructs',exact=True)
  assert select.locator('option').count()==14
  assert page.locator('#mtheory-details').count()==0
  page.get_by_label('3 · Rule / influence',exact=True).select_option('4')
  page.get_by_role('button',name='+ Facets ↑',exact=True).click()
  before=page.evaluate('FacetLab.state.configuration.slice(0,6)')
  select.select_option('4')
  assert page.evaluate('FacetLab.state.configuration')==before+[4]
  for name in ['1 · Symmetry','2 · Facets per step','3 · Rule / influence','5 · Branching','6 · Facets per item','7 · Bucky influences']:
   assert page.get_by_label(name,exact=True).is_enabled(),name
  variants=page.evaluate("""()=>{
   const out=[];
   for(let type=1;type<=14;type++){
    const c=[12,14,4,1,1,1,type],g=FacetLab.geometryForConfiguration(c,28),changed=FacetLab.geometryForConfiguration([1,14,4,2,2,8,type],28);
    if(!g.points.every(p=>p.every(Number.isFinite))||g.count<28)throw Error('Invalid G2 mesh '+type);
    if(JSON.stringify(g.points)===JSON.stringify(changed.points))throw Error('Explorer inputs ignored '+type);
    out.push({type,faces:g.count,vertices:g.points.length,input:g.g2?{vertices:g.g2.inputVertices,faces:g.g2.inputFaces,meanEdge:g.g2.meanEdge}:null});
   }return out;
  }""")
  # Changing existing explorer controls reaches the active G2 influence.
  mesh=page.evaluate('JSON.stringify(FacetLab.geometry.points)')
  page.get_by_label('5 · Branching',exact=True).select_option('2')
  assert page.evaluate('JSON.stringify(FacetLab.geometry.points)')!=mesh
  for type in range(1,15):
   select.select_option(str(type));page.wait_for_timeout(60)
  assert page.evaluate('FacetLab.state.configuration[6]')==14
  page.locator('#lab-save').click();configuration=page.evaluate('FacetLab.state.configuration')
  page.locator('#lab-back').click();page.locator('#address-list button').nth(3).click()
  assert page.evaluate('FacetLab.state.configuration')==configuration
  page.screenshot(path=str(output/'g2-lab.png'))
  page.reload();page.wait_for_function('window.FacetLab')
  assert page.evaluate('ContinuumLab.state.entries[0].configuration')==configuration
  assert not errors,errors
  report={'url':url,'passed':True,'fourteenChoices':True,'externalParameterForm':False,'inputsPreserved':before,'crossProduct':math,'variants':variants,'saveReopen':configuration,'errors':errors}
  (output/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':True,'variants':len(variants),'crossProduct':math,'errors':errors}));browser.close()
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--url',required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();run(v.url,v.output)
