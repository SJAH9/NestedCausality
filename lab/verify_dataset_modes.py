"""Exercise new sources and cardinality modes on the actual production reader."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
results=[]
def ready(page):
 page.wait_for_function('DataSets.state.ready || !!document.querySelector("#data-state").dataset.error',timeout=90000)
 assert not page.locator('#data-state').get_attribute('data-error'),page.locator('#data-state').inner_text()
 return page.evaluate('DataSets.state')
def setting(page,name,value):
 page.get_by_role('combobox',name='Data '+name,exact=True).select_option(str(value));return ready(page)
def toggle(page,key,on=True):
 page.locator('#data-'+key).set_checked(on);return ready(page)
def exact_facets(s,n):
 assert len(s['items'])==n,(len(s['items']),n)
 owners=[i for i in s['geometry']['faceItems'] if i>=0]
 assert sorted(owners)==list(range(n)),(len(owners),n)
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for mobile in (False,True):
  print('Production modes: mobile =',mobile,flush=True)
  ctx=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1050},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(args.url+'#datasets');page.wait_for_function('DataSets.active');assert page.locator('#data-source option').count()==15
  page.locator('#data-source').select_option('4');s=ready(page);assert s['total']==14 and [i['row']['number'] for i in s['items']]==list(range(1,15))
  toggle(page,'rowFacet');s=setting(page,'Rows per geometry',28);assert s['total']==28;exact_facets(s,28)
  s=setting(page,'Rows per geometry',7);assert s['total']==7;exact_facets(s,7)
  s=toggle(page,'cellFacet');assert not s['settings']['rowFacet'] and s['settings']['split'];exact_facets(s,7)
  s=setting(page,'Rows per geometry',112);assert s['total']==112;exact_facets(s,112)
  s=toggle(page,'rowFacet');assert not s['settings']['cellFacet'] and not s['settings']['split']
  # Count bounds generation even when show-all bypasses the display budget.
  s=setting(page,'Facet budget',1);assert len(s['items'])==1 and s['pages']==112
  s=toggle(page,'noPaging');assert s['total']==112 and s['pages']==1;exact_facets(s,112);assert not page.locator('#data-next').is_visible()
  # Repeated rows and empty cells still get exactly one facet in explicit modes.
  csv='name,value,url\n'+''.join('Same,,https://example.org/record\n' for _ in range(50))
  page.locator('#data-add').click();page.locator('#data-file').set_input_files({'name':'fifty.csv','mimeType':'text/csv','buffer':csv.encode()});s=ready(page);assert s['total']==50;exact_facets(s,50)
  toggle(page,'links');s=toggle(page,'cellFacet');exact_facets(s,150);assert sum(bool(i['href']) for i in s['items'])==50;assert sum(i['value']=='' for i in s['items'])==50
  assert page.locator('#data-repeat').is_disabled()
  page.locator('#data-view').click();page.wait_for_function('DataSets.state.focused');page.wait_for_function('document.querySelectorAll(".data-callout:not([hidden])").length===7');assert page.locator('.data-connectors line').count()==6
  assert not page.locator('.data-left').is_visible();page.screenshot(path=str(args.output/('mobile.png' if mobile else 'desktop.png')))
  page.locator('.data-callout button').first.click();assert page.locator('#data-record').is_visible();page.locator('#data-record button').click()
  page.locator('#data-exit-view').click();assert page.get_by_role('combobox',name='Data Facet budget',exact=True).is_disabled();s=toggle(page,'noPaging',False);assert s['pages']==1 and len(s['items'])==150
  toggle(page,'cellFacet',False);toggle(page,'links',False);setting(page,'Facet budget',1792);setting(page,'Rows per geometry',14)
  sources=[]
  # Every newly referenced public source is fetched by the real reader, without an overlay.
  for i in (range(5,14) if not mobile else [5,7]):
   page.locator('#data-source').select_option(str(i));s=ready(page);assert s['total']>0 and len(s['items'])==min(14,s['total']);sources.append({'name':s['source']['name'],'rows':s['total'],'fields':len(s['schema'])});print(sources[-1],flush=True)
  assert not errors,errors
  results.append({'mobile':mobile,'numbers':[7,14,28,112],'strictRows':50,'strictCells':150,'allLoadedBeyondBudget':True,'callouts':7,'sources':sources,'errors':errors});ctx.close()
 browser.close()
(args.output/'verification.json').write_text(json.dumps({'url':args.url,'passed':True,'results':results},indent=2))
print('Production source and facet-mode checks passed.',flush=True)
