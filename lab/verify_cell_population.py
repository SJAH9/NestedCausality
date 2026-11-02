"""Cell-driven populations on the actual production page; no staged overlays."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
def ready(page):
 page.wait_for_function('DataSets.state.ready || !!document.querySelector("#data-state").dataset.error',timeout=60000)
 assert not page.locator('#data-state').get_attribute('data-error'),page.locator('#data-state').inner_text()
 return page.evaluate('DataSets.state')
def population(page,count):
 s=ready(page);assert s['cellCount']==s['facetCount']==len(s['items'])==count,s
 owners=[i for i in s['geometry']['faceItems'] if i>=0];assert sorted(owners)==list(range(count))
 # Preserve the selected native geometry, including its unassigned closure faces.
 assert s['geometry']['count']==page.evaluate('(s)=>FacetGeometry.addFacets(s.settings.configuration,s.cellCount).count',s)
 return s
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for mobile in [False,True]:
  print('Production cell population:',mobile,flush=True)
  ctx=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1050},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(args.url+'#datasets');page.wait_for_function('DataSets.active')
  page.locator('#data-add').click();csv='name,value,url\n'+''.join('Same,,https://example.org/record\n' for _ in range(30));page.locator('#data-file').set_input_files({'name':'cells.csv','mimeType':'text/csv','buffer':csv.encode()});ready(page)
  page.get_by_role('combobox',name='Data Facet budget',exact=True).select_option('1');ready(page)
  page.locator('#data-cellFacet').check();s=population(page,42);assert s['pageRows']==14 and s['pages']==3;assert page.get_by_role('combobox',name='Data Facet budget',exact=True).is_disabled()
  page.locator('#data-next').click();population(page,42);page.locator('#data-next').click();population(page,6);assert '2 rows × 3 columns' in page.locator('#data-state').inner_text()
  page.get_by_role('combobox',name='Data Rows per geometry',exact=True).select_option('7');population(page,21)
  page.locator('#data-fields').select_option(['name','url']);population(page,14)
  page.locator('#data-links').check();s=population(page,14);assert sum(bool(i['href']) for i in s['items'])==7
  page.locator('#data-noPaging').check();s=population(page,60);assert s['pages']==1
  page.locator('#data-fields').select_option(['name','value','url']);population(page,90)
  page.evaluate('ContinuumLab.save([12,14,4,1,1,1],14)');page.locator('#data-back').click();page.locator('#address-list button').nth(2).click();page.locator('#data-geometry-select').select_option('12-14-4-1-1-1');population(page,90)
  page.locator('#data-view').click();page.wait_for_function('DataSets.state.focused');page.wait_for_function('document.querySelectorAll(".data-callout:not([hidden])").length===7');assert page.locator('.data-connectors line').count()==6
  page.screenshot(path=str(args.output/('mobile.png' if mobile else 'desktop.png')));page.locator('#data-exit-view').click()
  page.locator('#data-rowFacet').check();s=ready(page);assert len(s['items'])==30 and not s['settings']['cellFacet'];assert page.get_by_role('combobox',name='Data Facet budget',exact=True).is_enabled()
  assert not errors,errors;results.append({'mobile':mobile,'cellPopulations':[42,6,21,14,60,90],'budgetOverride':1,'selectedNativeGeometryPreserved':True,'callouts':7,'errors':errors});ctx.close()
 browser.close()
(args.output/'verification.json').write_text(json.dumps({'passed':True,'url':args.url,'results':results},indent=2));print('Cell population production checks passed.',flush=True)
