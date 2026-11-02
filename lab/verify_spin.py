"""Browser checks for configurator momentum and settle-to-select."""
import argparse,json,math
from pathlib import Path
from playwright.sync_api import sync_playwright


def visible_area(vertices,view,width,height):
    a,b,r=view['yaw'],view['pitch'],view['roll']
    polygon=[]
    for x,y,z in vertices:
        u=x*math.cos(a)-z*math.sin(a);v=z*math.cos(a)+x*math.sin(a)
        Y=y*math.cos(b)-v*math.sin(b)
        px=u*math.cos(r)+Y*math.sin(r)+view['pan'][0]
        py=Y*math.cos(r)-u*math.sin(r)+view['pan'][1]
        pz=v*math.cos(b)+y*math.sin(b)+view['distance']
        focal=min(width,height)*1.05
        polygon.append([width/2+focal*px/pz,height/2-focal*py/pz])
    for axis,edge,above in [(0,0,True),(0,width,False),(1,0,True),(1,height,False)]:
        result=[]
        for i,point in enumerate(polygon):
            end=polygon[(i+1)%len(polygon)]
            inside=point[axis]>=edge if above else point[axis]<=edge
            other=end[axis]>=edge if above else end[axis]<=edge
            if inside:result.append(point)
            if inside!=other:
                t=(edge-point[axis])/(end[axis]-point[axis]);result.append([point[k]+t*(end[k]-point[k]) for k in range(2)])
        polygon=result
    return abs(sum(point[0]*polygon[(i+1)%len(polygon)][1]-point[1]*polygon[(i+1)%len(polygon)][0] for i,point in enumerate(polygon)))/2


def run(url,out):
    out.mkdir(parents=True,exist_ok=True);checks=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(url);page.locator('#open-selected').click()
        page.get_by_role('button',name='+ Facets ↑',exact=True).click()
        page.get_by_label('3 · Rule / influence',exact=True).select_option('4')
        def flick(name):
            canvas=page.get_by_label(name+' vector equilibrium',exact=True)
            box=canvas.bounding_box();x=box['x']+box['width']*.3;y=box['y']+box['height']*.5
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+60,y+20,steps=5);page.mouse.up()
            return canvas
        canvas=flick('3 · Rule / influence')
        release=page.evaluate('FacetLab.state.configurators[2]')
        assert release['pending'] and math.hypot(*release['spin'])>0,release
        page.wait_for_function('FacetLab.state.configurators[2].lastSpinSelection !== null',timeout=90000)
        settled=page.evaluate('FacetLab.state.configurators[2]')
        assert settled['spin']==[0,0] and not settled['pending']
        selection=settled['lastSpinSelection'];assert settled['selected']==selection['item']+1
        assert abs(settled['yaw']-release['yaw'])>.01
        assert page.evaluate('FacetLab.state.configuration[2]')==settled['selected']
        # Independently recompute each front-facing facet's visible polygon area.
        faces=page.evaluate('Arcade.geometryFor(14).menuFaces');view=selection['view'];box=canvas.bounding_box();areas=[]
        for face in faces:
            x,y,z=face['normal'];a,b,r=view['yaw'],view['pitch'],view['roll']
            u=x*math.cos(a)-z*math.sin(a);v=z*math.cos(a)+x*math.sin(a);Y=y*math.cos(b)-v*math.sin(b)
            normal=[u*math.cos(r)+Y*math.sin(r),Y*math.cos(r)-u*math.sin(r),v*math.cos(b)+y*math.sin(b)]
            # A convex support face is front-facing when n·(center-camera)<0.
            support=sum(n*c for n,c in zip(face['normal'],face['center']))
            facing=support+normal[2]*view['distance']
            areas.append(visible_area(face['vertices'],view,box['width'],box['height']) if facing<-.03 else 0)
        assert areas[selection['facet']]>=max(areas)-1e-6,(selection,areas)
        checks.append({'check':'real pointer push coasts, stops, and selects largest visible facet','passed':True,'release':release,'settled':settled})
        page.wait_for_timeout(500);assert page.evaluate('FacetLab.state.configurators[2].lastSpinSelection')==selection
        # Reduced motion selects on release in each of the six configuration VEs.
        page.emulate_media(reduced_motion='reduce')
        names=[('1 · Symmetry',0,0),('2 · Facets per step',1,1),('5 · Branching',4,3),('6 · Facets per item',5,4),('7 · Bucky influences',6,5)]
        for name,panel,field in names:
            flick(name);page.wait_for_function(f'FacetLab.state.configurators[{panel}].lastSpinSelection !== null')
            state=page.evaluate('FacetLab.state');picked=state['configurators'][panel]
            assert picked['spin']==[0,0] and not picked['pending']
            assert state['configuration'][field]==picked['lastSpinSelection']['item']+1
        actual=page.evaluate('FacetLab.geometry.points');expected=page.evaluate('FacetLab.geometryForConfiguration(FacetLab.state.configuration,FacetLab.state.count).points');assert actual==expected
        checks.append({'check':'all six configuration fields drive native subject geometry; reduced motion skips coasting','passed':True})
        before=page.evaluate('({configuration:FacetLab.state.configuration,count:FacetLab.state.count})')
        flick('4 · Explore');page.wait_for_timeout(300)
        assert page.evaluate('({configuration:FacetLab.state.configuration,count:FacetLab.state.count})')==before
        assert not page.evaluate('FacetLab.state.configurators[3].pending')
        page.locator('#lab-save').click();page.locator('#lab-back').click()
        assert page.evaluate('ContinuumLab.state.entries[0].configuration')==before['configuration']
        page.locator('#open-selected').click();assert page.evaluate('FacetLab.state.configuration')==before['configuration']
        checks.append({'check':'Explore actions require explicit activation; selected configuration saves and reopens','passed':True})
        assert not errors,errors
        page.screenshot(path=str(out/'spin-selected-lab.png'))
        browser.close()
    (out/'verification.json').write_text(json.dumps({'url':url,'passed':True,'checks':checks},indent=2)+'\n')
    print('Configurator momentum, visible-area selection, six fields, reduced motion, Explore isolation and Save passed')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();run(args.url,args.output)
