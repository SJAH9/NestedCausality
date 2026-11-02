"""Exercise the actual standalone app URL; writes evidence outside the source tree."""
import argparse, hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright


def run(url, output):
    output.mkdir(parents=True, exist_ok=True)
    report = {'url': url, 'checks': []}
    def passed(name, **details):
        report['checks'].append({'check': name, 'passed': True, **details})
        print(name, flush=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True, reduced_motion='reduce')
        page = context.new_page()
        errors, external = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('requestfailed', lambda request: external.append({'url': request.url, 'failure': request.failure}))
        page.goto(url)
        page.wait_for_function('window.FacetLab && window.ContinuumLab && ContinuumLab.state.hits.length > 0')
        initial = page.evaluate('ContinuumLab.state')
        assert initial['items'] == 3 and initial['faces'] == 14 and initial['vertices'] == 12
        assert initial['renderer']['error'] == 0 and initial['renderer']['squares'] == 6 and initial['renderer']['triangles'] == 8
        passed('initial VE: three destinations, 14 faces, 12 vertices, six squares/eight triangles')
        page.screenshot(path=str(output / 'initial-menu.png'))
        hit = next(h for h in initial['hits'] if h['item'] == 0)
        box = page.locator('#ve').bounding_box()
        page.mouse.click(box['x'] + hit['x'], box['y'] + hit['y'])
        page.wait_for_function('FacetLab.active')
        assert page.evaluate('FacetLab.state.count') == 0
        page.get_by_label('3 · Rule / influence', exact=True).select_option('4')
        page.get_by_label('5 · Branching', exact=True).select_option('2')
        page.get_by_label('6 · Facets per item', exact=True).select_option('2')
        page.get_by_role('button', name='+ Facets ↑', exact=True).click()
        page.get_by_role('button', name='+ Facets ↑', exact=True).click()
        configuration = [12, 14, 4, 2, 2, 1]
        assert page.evaluate('FacetLab.state.configuration') == configuration
        assert page.evaluate('FacetLab.state.count') == 28
        native = page.evaluate('JSON.stringify(FacetLab.geometry)')
        page.screenshot(path=str(output / 'configured-lab.png'))
        page.locator('#lab-save').click()
        assert page.evaluate('ContinuumLab.state.items') == 4
        page.locator('#lab-back').click()
        label = ' · '.join(map(str, configuration))
        page.locator('#address-list').get_by_role('button', name=label, exact=True).click()
        assert page.evaluate('FacetLab.state.configuration') == configuration
        assert page.evaluate('FacetLab.state.count') == 28
        assert page.evaluate('JSON.stringify(FacetLab.geometry)') == native
        passed('native controls, Save, actual menu address and identical reopened geometry', mesh_sha256=hashlib.sha256(native.encode()).hexdigest())
        page.locator('#lab-save').click()
        assert page.evaluate('ContinuumLab.state.items') == 4
        page.get_by_role('button', name='+ Facets ↑', exact=True).click()
        page.locator('#lab-back').click()
        page.reload()
        page.wait_for_function('window.ContinuumLab && window.FacetLab')
        assert page.evaluate('ContinuumLab.state.entries[0].count') == 28
        page.locator('#address-list').get_by_role('button', name=label, exact=True).click()
        assert page.evaluate('FacetLab.state.count') == 28
        page.locator('#lab-back').click()
        passed('duplicate Save is idempotent; Back discards unsaved changes; reload preserves collection')
        with page.expect_download() as download:
            page.locator('#export').click()
        export_path = output / 'exported-addresses.json'
        download.value.save_as(str(export_path))
        exported = json.loads(export_path.read_text())
        assert exported['entries'] == [{'configuration': configuration, 'count': 28}]
        bad = {'format': 'continuum-manifold-lab', 'version': 1, 'entries': [{'configuration': [99, 1, 1, 1, 1, 1], 'count': 0}]}
        page.locator('#import').set_input_files({'name': 'bad.json', 'mimeType': 'application/json', 'buffer': json.dumps(bad).encode()})
        page.wait_for_function("document.getElementById('status').textContent.startsWith('Import rejected:')")
        assert page.evaluate('ContinuumLab.state.items') == 4
        passed('portable export; malformed import rejected without collection mutation')
        entries = []
        for number in range(2807):
            value, values = number, [1] * 6
            for field in range(5, -1, -1):
                radix = 12 if field == 0 else 14
                values[field], value = value % radix + 1, value // radix
            entries.append({'configuration': values, 'count': 14})
        collection = {'format': 'continuum-manifold-lab', 'version': 1, 'entries': entries}
        page.locator('#import').set_input_files({'name': 'scale.json', 'mimeType': 'application/json', 'buffer': json.dumps(collection).encode()})
        page.wait_for_function('ContinuumLab.state.items === 2811', timeout=60000)
        state = page.evaluate('ContinuumLab.state')
        assert state['faces'] >= 2809 and state['renderer']['error'] == 0
        assert page.locator('#address-list button').count() <= 51
        page.screenshot(path=str(output / '2811-destination-menu.png'))
        last = entries[-1]['configuration']
        page.locator('#search').fill('-'.join(map(str, last)))
        page.locator('#address-list').get_by_role('button', name=' · '.join(map(str, last)), exact=True).click()
        assert page.evaluate('FacetLab.state.configuration') == last
        assert page.evaluate('FacetLab.state.count') == 14
        page.locator('#lab-back').click()
        page.locator('#ve').focus()
        page.keyboard.press('Home')
        page.keyboard.press('Enter')
        assert page.evaluate('FacetLab.active')
        assert page.evaluate('FacetLab.state.configuration') == [12, 14, 1, 1, 1, 1]
        passed('2,810 destinations on one native shell; address search and keyboard entry', faces=state['faces'])
        page.goto(url + '#12-14-6-1-1-1')
        page.wait_for_function('FacetLab.state.configuration[2] === 6')
        assert page.evaluate('FacetLab.state.count') == 0
        passed('changing configuration hash while lab is active opens the requested geometry')
        assert not errors, errors
        assert not external, external
        passed('no JavaScript errors or failed asset requests')
        context.close()
        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        page = mobile.new_page()
        page.goto(url)
        page.wait_for_function('window.FacetLab && window.ContinuumLab')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#open-selected').tap()
        page.get_by_label('3 · Rule / influence', exact=True).select_option('6')
        page.get_by_role('button', name='+ Facets ↑', exact=True).tap()
        page.locator('#lab-save').tap()
        page.locator('#lab-back').tap()
        assert page.evaluate('ContinuumLab.state.items') == 4
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(output / 'mobile-menu.png'))
        passed('mobile touch entry, native controls, Save and return; no horizontal overflow')
        mobile.close()
        browser.close()
    report['passed'] = True
    (output / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    run(args.url, args.output)
