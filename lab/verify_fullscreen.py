"""Check the actual fullscreen control, browser exit, layout and retained lab state."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

def run(url,output):
 output.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for mobile in (False,True):
   context=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1000},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url);page.wait_for_function('window.FacetLab && window.ContinuumLab')
   button=page.locator('#lab-fullscreen')
   box=button.bounding_box();assert box and box['width']>=44 and box['height']>=44
   assert page.evaluate('innerWidth')-box['x']-box['width']<=25
   assert page.evaluate('innerHeight')-box['y']-box['height']<=25
   button.click();page.wait_for_function('document.fullscreenElement===document.documentElement')
   assert button.get_attribute('aria-pressed')=='true'
   page.get_by_role('button',name='Exit fullscreen',exact=True).click();page.wait_for_function('!document.fullscreenElement')
   page.locator('#open-selected').click();page.get_by_label('3 · Rule / influence',exact=True).select_option('4')
   page.get_by_role('button',name='+ Facets ↑',exact=True).click()
   last=page.locator('#facet-lab select').last
   last.focus();page.keyboard.press('Tab')
   assert page.locator('#lab-fullscreen').evaluate('e=>e===document.activeElement')
   page.keyboard.press('Tab')
   assert page.locator('#lab-spin-all canvas').evaluate('e=>e===document.activeElement')
   before=page.evaluate('({config:FacetLab.state.configuration,count:FacetLab.state.count})')
   page.get_by_role('button',name='Enter fullscreen',exact=True).click();page.wait_for_function('!!document.fullscreenElement')
   assert page.locator('#lab-fullscreen').is_visible()
   page.screenshot(path=str(output/('mobile.png' if mobile else 'desktop.png')))
   # Browser-driven exit must update the control, too.
   page.evaluate('document.exitFullscreen()');page.wait_for_function('!document.fullscreenElement')
   assert page.get_by_role('button',name='Enter fullscreen',exact=True).get_attribute('aria-pressed')=='false'
   assert page.evaluate('({config:FacetLab.state.configuration,count:FacetLab.state.count})')==before
   assert not errors,errors
   results.append({'mobile':mobile,'entryAndExit':True,'browserExitSync':True,'configurationPreserved':True,'errors':errors})
   context.close()
  browser.close()
 (output/'verification.json').write_text(json.dumps({'url':url,'passed':True,'checks':results},indent=2));print(json.dumps(results))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--url',required=True);a.add_argument('--output',type=Path,required=True);v=a.parse_args();run(v.url,v.output)
