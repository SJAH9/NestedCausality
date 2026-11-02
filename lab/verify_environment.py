"""Verify the real production Arcade environment, without selecting projection blocks."""
import argparse,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright

def run(url,out):
 out.mkdir(parents=True,exist_ok=True);results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for mobile in (False,True):
   context=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1000},is_mobile=mobile,has_touch=mobile,reduced_motion='no-preference');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url);page.wait_for_function('ManifoldEnvironment.state?.host==="menu-view"');first=page.evaluate('ManifoldEnvironment.state');page.wait_for_function('x=>ManifoldEnvironment.state.groundTravel>x',arg=first['groundTravel']);second=page.evaluate('ManifoldEnvironment.state');assert second['infinitePlane']
   assert page.locator('#arcade-environment').count()==1
   page.locator('#open-selected').click();page.wait_for_function('ManifoldEnvironment.state?.host==="facet-lab-main"');before=page.evaluate('ManifoldEnvironment.state');geometry=page.locator('#lab-geometry');box=geometry.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+40,box['y']+box['height']/2+20,steps=5);page.mouse.up();page.wait_for_function('x=>Math.abs(ManifoldEnvironment.state.yaw-x)>.005',arg=before['yaw'])
   assert page.evaluate('(()=>{const c=document.getElementById("arcade-environment"),g=c.getContext("webgl2"),p=new Uint8Array(4);g.readPixels(c.width/2,c.height/2,1,1,g.RGBA,g.UNSIGNED_BYTE,p);return g.getError()===0;})()')
   page.screenshot(path=str(out/('mobile-lab.png' if mobile else 'desktop-lab.png')))
   page.locator('#lab-back').click();page.locator('#address-list button').nth(1).click();page.wait_for_function('ManifoldEnvironment.state?.host==="projection-main" && Projections.state.ready');assert page.evaluate('Projections.state.blockSize')==0
   page.screenshot(path=str(out/('mobile-projections.png' if mobile else 'desktop-projections.png')))
   page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);frozen=page.evaluate('ManifoldEnvironment.state.groundTravel');page.wait_for_timeout(300);assert page.evaluate('ManifoldEnvironment.state.groundTravel')==frozen
   page.locator('#projections-back').click();page.wait_for_function('ManifoldEnvironment.state.host==="menu-view"');assert page.locator('#arcade-environment').count()==1
   page.get_by_role('button',name='Enter fullscreen',exact=True).click();page.wait_for_function('!!document.fullscreenElement');page.evaluate('document.exitFullscreen()')
   assert not errors,errors;results.append({'mobile':mobile,'passed':True,'motion':True,'cameraResponse':True,'reducedMotionStopsTravel':True,'viewTransitions':3,'environmentCanvases':1,'projectionBlockTested':0,'errors':errors});context.close()
  browser.close()
 (out/'verification.json').write_text(json.dumps({'url':url,'results':results,'largeBlocksTested':False},indent=2));print(json.dumps(results))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);a=parser.parse_args();run(a.url,a.output)
