"""Compare the supplied app's menu with the native Arcade geometry contract."""
import argparse, hashlib, json, math, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright


def run(url, output):
    output.mkdir(parents=True, exist_ok=True)
    source = Path(__file__).resolve().parent
    original = (source / 'vendor/arcade.js').read_bytes()
    live = urllib.request.urlopen('https://sidhubbard.com/arcade/arcade.js', timeout=30).read()
    assert original == live, 'Arcade upstream changed; recheck the native contract'
    report = {'url': url, 'arcade_sha256': hashlib.sha256(live).hexdigest(), 'checks': []}
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = browser.new_page(reduced_motion='reduce', viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for count in [2, 3, 14, 15, 2810]:
            page.goto(url)
            page.wait_for_function('window.ContinuumLab && window.FacetLab')
            page.evaluate('''count=>{
                const entries=Array.from({length:count-2},(_,n)=>{let k=n;const configuration=[1,1,1,1,1,1];for(let i=5;i>=0;i--){const radix=i?14:12;configuration[i]=k%radix+1;k=Math.floor(k/radix);}return {configuration,count:14};});
                localStorage.setItem('continuum-manifold-addresses-v1',JSON.stringify({format:'continuum-manifold-lab',version:1,entries}));
            }''', count)
            page.reload()
            page.wait_for_function('ContinuumLab.state.hits.length>0')
            result = page.evaluate('''count=>{
                const A=Arcade,actual=ContinuumLab.geometry;let expected;
                if(count<=14){const seed=A.geometryFor(14),a=Math.PI/4,b=Math.asin(1/Math.sqrt(3));const facing=f=>-(f.normal[2]*Math.cos(a)+f.normal[0]*Math.sin(a))*Math.cos(b)-f.normal[1]*Math.sin(b)-f.normal.reduce((s,n,k)=>s+n*f.center[k],0)/4.5;
                    const menuFaces=seed.menuFaces.slice().sort((a,b)=>facing(b)-facing(a));expected={...seed,menuFaces,faces:menuFaces.map(f=>f.vertices)};
                }else expected=A.compactEmptyFacets(A.subdivideVE(Math.ceil(Math.sqrt(count/14))),count);
                expected=A.facetTerritories(expected,count,1);
                const fields=['points','faces','edges','faceItems','occupiedFacets','territoryAnchors'];
                return {count,faces:actual.count,view:ContinuumLab.state.view,equal:fields.every(k=>JSON.stringify(actual[k])===JSON.stringify(expected[k])),allOwned:actual.faceItems.every(i=>i>=0&&i<count),destinations:new Set(actual.faceItems).size,hitsCorrect:ContinuumLab.state.hits.every(h=>h.item===actual.faceItems[h.index]),rendererError:ContinuumLab.state.renderer.error};
            }''', count)
            assert result['equal'] and result['allOwned'] and result['hitsCorrect'], result
            assert result['destinations'] == count and result['rendererError'] == 0, result
            assert all(math.isclose(result['view'][k], value, abs_tol=1e-14) for k, value in {'yaw': math.pi/4, 'pitch': math.asin(1/math.sqrt(3)), 'roll': math.pi/4, 'distance': 4.5}.items()), result
            # A physical facet may belong to another facet's seeded destination.
            # Exercise the real hit target, not just the address-list shortcut.
            page.evaluate('(count)=>ContinuumLab.choose(count-1)', count)
            page.wait_for_function('(count)=>ContinuumLab.state.hits.some(h=>h.item===count-1)', arg=count)
            hit = page.evaluate('(count)=>ContinuumLab.state.hits.find(h=>h.item===count-1)', count)
            expected = page.evaluate('(count)=>count===2?null:ContinuumLab.state.entries[count-3].configuration', count)
            box = page.locator('#ve').bounding_box()
            page.mouse.click(box['x']+hit['x'], box['y']+hit['y'])
            page.wait_for_function('Projections.active' if count == 2 else 'FacetLab.active')
            if count != 2:assert page.evaluate('FacetLab.state.configuration') == expected
            result['facet_entry_passed'] = True
            result['clicked_facet'] = hit['index']
            report['checks'].append(result)
            print(f'{count} destinations: exact native geometry, edges, territories, anchors and foyer view', flush=True)
        assert not errors, errors
        browser.close()
    report['passed'] = True
    (output / 'menu-rules.json').write_text(json.dumps(report, indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    run(args.url, args.output)
