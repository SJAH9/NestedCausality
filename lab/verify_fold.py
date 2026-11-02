"""Chromium mobile context-budget reproduction, fold resize and context restoration."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def run(url,output):
 output.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--max-active-webgl-contexts=1'])
  page=browser.new_page(viewport={'width':412,'height':892},device_scale_factor=2.625,is_mobile=True,has_touch=True,reduced_motion='reduce',user_agent='Mozilla/5.0 (Linux; Android 14; Pixel Fold) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0')
  page.set_default_timeout(20000);errors=[];warnings=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:warnings.append(m.text) if 'Too many active WebGL' in m.text else None)
  page.add_init_script('''window.testGpuContexts=[];const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const r=get.call(this,type,...args);if(r&&type==='webgl2'&&!testGpuContexts.some(x=>x.gl===r))testGpuContexts.push({canvas:this,gl:r});return r;};''')
  print('Loading',flush=True);page.goto(url);page.wait_for_function('window.ContinuumLab?.state.renderer.drawCalls>0')
  def pixels(selector):
   return page.locator(selector).evaluate('''e=>{const a=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let colored=0;for(let i=3;i<a.length;i+=4)if(a[i]>0)colored++;return colored;}''')
  assert pixels('#ve')>100;print('Menu paints',flush=True)
  page.locator('#open-selected').click();page.get_by_label('3 · Rule / influence',exact=True).select_option('4');page.get_by_role('button',name='+ Facets ↑',exact=True).click()
  page.wait_for_function('FacetLab.state.renderers[0].drawCalls>0')
  assert pixels('#lab-geometry')>100
  print('Lab paints',flush=True)
  for w,h,name in [(853,960,'unfolded'),(960,853,'landscape'),(412,892,'folded')]:
   print(name,flush=True);page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(250)
   page.get_by_label('8 · M-theory constructs',exact=True).select_option('4')
   assert pixels('#lab-geometry')>100
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(output/(name+'.png')))
  # Save/reopen remains ordinary UI, and side controls still turn with shared rendering.
  page.locator('#lab-save').click();page.locator('#lab-back').click();page.locator('#address-list button').nth(3).click()
  assert page.evaluate('FacetLab.state.configuration[6]')==4
  # Force a real graphics context loss and restoration without resetting saved state.
  print('Restoration',flush=True);before=page.evaluate('FacetLab.state.configuration')
  page.evaluate("window.testLoss=testGpuContexts[0].gl.getExtension('WEBGL_lose_context');testLoss.loseContext()")
  page.wait_for_function('FacetLab.state.renderers[0].contextLost')
  page.evaluate("testLoss.restoreContext()")
  page.wait_for_function('!FacetLab.state.renderers[0].contextLost && FacetLab.state.renderers[0].error===0')
  page.wait_for_timeout(250)
  assert pixels('#lab-geometry')>100
  assert page.evaluate('FacetLab.state.configuration')==before
  report=page.evaluate('({graphics:ManifoldGraphics,createdContexts:testGpuContexts.length,menu:ContinuumLab.state.renderer,panes:FacetLab.state.renderers})')
  assert report['createdContexts']==1 and not warnings and not errors,(report,warnings,errors)
  assert sum(x['labelRendering'].get('textureBytes',0) for x in [report['panes'][0]])<=24*1024*1024
  report.update(url=url,passed=True,errors=errors,warnings=warnings,hardware='Chromium emulation; physical Pixel Fold / Android Edge not available')
  (output/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':True,'createdContexts':report['createdContexts'],'warnings':warnings,'errors':errors}));browser.close()
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--url',required=True);a.add_argument('--output',type=Path,required=True);args=a.parse_args();run(args.url,args.output)
