"""Verify one actual master-VE gesture drives identical configurator physics."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright


def run(url,out):
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(url);page.locator('#open-selected').click();page.get_by_role('button',name='+ Facets ↑',exact=True).click()
        # Different current orientations and the e response rule exercise shared physics.
        page.get_by_label('1 · Symmetry',exact=True).select_option('3')
        page.get_by_label('3 · Rule / influence',exact=True).select_option('9')
        page.get_by_label('5 · Branching',exact=True).select_option('4')
        before=page.evaluate('({count:FacetLab.state.count,explore:FacetLab.state.configurators[3].selected})')
        c=page.get_by_label('Spin all configurators vector equilibrium',exact=True);box=c.bounding_box();x=box['x']+box['width']*.25;y=box['y']+box['height']*.4
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+30,y+12,steps=5);page.mouse.up()
        coast_started=page.evaluate('performance.now()')
        release=page.evaluate('FacetLab.state');indices=[0,1,2,4,5,6]
        assert release['spinAll']['lastInput']['response']>2
        assert any(release['spinAll']['spin'])
        for i in indices:
            assert release['configurators'][i]['pending']
            assert release['configurators'][i]['spin']==release['spinAll']['spin']
        assert release['configurators'][3]['spin']==release['spinAll']['spin']
        assert release['spinAll']['reserved']['spin']==release['spinAll']['spin']
        page.wait_for_function('FacetLab.state.configurators.filter((_,i)=>i!==3).every(p=>p.lastSpinSelection&&!p.pending&&!p.spin.some(Boolean))',timeout=90000)
        coast_elapsed=page.evaluate('performance.now()')-coast_started
        assert coast_elapsed>=4000,coast_elapsed
        final=page.evaluate('FacetLab.state');source=final['spinAll'];delta=[source['yaw']-source['lastInput']['controllerStart'][0],source['pitch']-source['lastInput']['controllerStart'][1]]
        for k,i in enumerate(indices):
            picked=final['configurators'][i]['lastSpinSelection'];start=source['lastInput']['starts'][i]
            assert abs(picked['view']['yaw']-start[0]-delta[0])<1e-8
            assert abs(picked['view']['pitch']-start[1]-delta[1])<1e-8
            assert final['configuration'][k]==picked['item']+1
        for i,rotor in [(3,final['configurators'][3]),(7,source['reserved'])]:
            start=source['lastInput']['starts'][i]
            assert abs(rotor['yaw']-start[0]-delta[0])<1e-8
            assert abs(rotor['pitch']-start[1]-delta[1])<1e-8
        assert final['count']==before['count'] and final['configurators'][3]['selected']==before['explore']
        assert page.evaluate('JSON.stringify(FacetLab.geometry.points)===JSON.stringify(FacetLab.geometryForConfiguration(FacetLab.state.configuration,FacetLab.state.count).points)')
        page.screenshot(path=str(out/'spin-all-desktop.png'))
        page.locator('#lab-save').click();page.locator('#lab-back').click();page.locator('#open-selected').click()
        assert page.evaluate('FacetLab.state.configuration')==final['configuration']
        # A phone viewport keeps the top control reachable and avoids overflow.
        page.set_viewport_size({'width':390,'height':844});page.emulate_media(reduced_motion='reduce')
        c=page.get_by_label('Spin all configurators vector equilibrium',exact=True);assert c.is_visible()
        box=c.bounding_box();assert box['y']>=0 and box['x']+box['width']<=390
        prior=page.evaluate('FacetLab.state.spinAll.lastInput')
        page.mouse.move(box['x']+12,box['y']+18);page.mouse.down();page.mouse.move(box['x']+35,box['y']+30,steps=3);page.mouse.up()
        page.wait_for_function('!FacetLab.state.spinAll.pending && FacetLab.state.configurators.filter((_,i)=>i!==3).every(p=>!p.pending)')
        mobile=page.evaluate('FacetLab.state');assert mobile['spinAll']['lastInput']!=prior
        assert not any(mobile['spinAll']['spin'])
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert page.locator('#facet-lab').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        page.screenshot(path=str(out/'spin-all-mobile.png'))
        assert not errors,errors
        browser.close()
    (out/'verification.json').write_text(json.dumps({'url':url,'passed':True,'checks':['actual master gesture supplies identical angular velocities to all six configurators','all six stopped angular displacements exactly match controller, including e response','each selects its own visible facet and updates native subject geometry','Explore untouched; Save and reopen retain resulting configuration','mobile header control visible; reduced motion; no horizontal overflow'],'release':release['spinAll'],'final':source,'configuration':final['configuration'],'observed_coast_ms':coast_elapsed},indent=2)+'\n')
    print('Spin all: shared input, identical physics, six selections, geometry, persistence and mobile checks passed')

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--url',required=True);a.add_argument('--output',type=Path,required=True);args=a.parse_args();run(args.url,args.output)
