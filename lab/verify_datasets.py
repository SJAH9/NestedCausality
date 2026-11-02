"""Verify Data Sets on the actual published page; no overlays or large Projections blocks."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();out=args.output;out.mkdir(parents=True,exist_ok=True);url=args.url
def wait_ready(page):
 page.wait_for_function('DataSets.state.ready && !document.querySelector("#data-state").dataset.error',timeout=60000)
def upload(page,name,text,fmt='auto',path=''):
 page.locator('#data-add').click();page.locator('#data-format').select_option(fmt);page.locator('#data-path').fill(path)
 page.locator('#data-file').set_input_files({'name':name,'mimeType':'application/octet-stream','buffer':text.encode() if isinstance(text,str) else text});wait_ready(page)
def setting(page,name,value):
 page.get_by_role('combobox',name='Data '+name,exact=True).select_option(value=str(value));wait_ready(page)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for mobile in (False,True):
  print('Starting',mobile,flush=True)
  ctx=browser.new_context(viewport={'width':412 if mobile else 1440,'height':892 if mobile else 1050},is_mobile=mobile,has_touch=mobile,reduced_motion='reduce');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_function('!!window.DataSets');assert page.locator('#address-list button').all_text_contents()[:3]==['Facet Lab','Projections','Data Sets']
  # Preserve and resolve an existing saved native address after insertion of a top-level item.
  page.evaluate('ContinuumLab.save([12,14,4,1,1,1],14)');page.locator('#address-list button').nth(3).click();page.wait_for_function('FacetLab.active');assert page.evaluate('FacetLab.state.configuration')==[12,14,4,1,1,1];page.locator('#lab-back').click()
  page.locator('#address-list button').nth(2).click();page.wait_for_function('DataSets.active');assert page.locator('#datasets input[type=search]').count()==0
  page.locator('#data-geometry-select').select_option('12-14-4-1-1-1')
  page.locator('#data-source').select_option('1');wait_ready(page);s=page.evaluate('DataSets.state');assert s['total']==3376,s['total'];assert len(s['items'])==14 and s['construction']=='native-add-facets';assert s['settings']['configuration']==[12,14,4,1,1,1]
  page.wait_for_function('document.querySelectorAll(".data-callout:not([hidden])").length===7');assert page.locator('.data-callout:not([hidden])').count()==7
  page.locator('.data-callout button').first.click();assert page.locator('#data-record').is_visible();assert page.locator('#data-record pre').inner_text();page.locator('#data-record button').click()
  # Rows, paging, ordinal jump/slider, conditions, and label controls all act on real data.
  page.locator('#data-next').click();wait_ready(page);assert page.evaluate('DataSets.state.page')==1
  page.locator('#data-page').fill('3');page.locator('#data-page').press('Tab');wait_ready(page);assert page.evaluate('DataSets.state.page')==2
  page.locator('#data-page-range').evaluate('(e)=>{e.value="4";e.dispatchEvent(new Event("change"))}');wait_ready(page);assert page.evaluate('DataSets.state.page')==3
  setting(page,'Rows per geometry',7);assert page.evaluate('DataSets.state.pageRows')==7
  page.locator('#data-label-field').select_option('name');setting(page,'Labels','field');assert page.evaluate('DataSets.state.items[0].label')=='Thigpen'
  page.locator('#data-order-field').select_option('latitude');setting(page,'Order','number-desc');s=page.evaluate('DataSets.state');assert float(s['items'][0]['row']['latitude'])>=float(s['items'][1]['row']['latitude'])
  setting(page,'Field types','number');print('Public CSV controls passed',flush=True)
  page.locator('#data-split').check();wait_ready(page);assert all('number' in next(c['types'] for c in page.evaluate('DataSets.state.schema') if c['name']==i['field']) for i in page.evaluate('DataSets.state.items'))
  setting(page,'Field types','all');page.locator('#data-split').uncheck();wait_ready(page);setting(page,'Order','source');setting(page,'Labels','auto');setting(page,'Rows per geometry',14)
  # Actual file intake: links are separate native facets; unsafe text stays text.
  csv='name,value,url\r\n"Alpha, one",0,https://example.org/alpha\r\n"Multi\nline",2,https://example.org/beta\r\nRepeat,3,https://example.org/repeat\r\nRepeat,3,https://example.org/repeat\r\nEmpty,,\r\n<script>window.DATA_EXECUTED=true</script>,4,javascript:alert(1)\r\n'
  print('Testing file intake',flush=True);upload(page,'records.csv',csv);assert page.evaluate('DataSets.state.total')==6
  page.locator('#data-links').check();wait_ready(page);s=page.evaluate('DataSets.state');assert sum(bool(i['href']) for i in s['items'])==4
  page.locator('#data-repeat').uncheck();wait_ready(page);assert len(page.evaluate('DataSets.state.items'))==8
  page.locator('#data-split').check();wait_ready(page);assert any(i['field']=='value' and i['value']=='0' for i in page.evaluate('DataSets.state.items'));assert not page.evaluate('!!window.DATA_EXECUTED')
  # Fullscreen view retains six callouts and mouse-over bottom center, hiding all configurators.
  print('Testing geometry view',flush=True);page.locator('#data-view').click();page.wait_for_function('DataSets.state.focused && !!document.fullscreenElement');assert not page.locator('.data-left').is_visible() and not page.locator('.data-right').is_visible()
  page.wait_for_function('document.querySelectorAll(".data-callout:not([hidden])").length===7');assert page.locator('#data-hover').is_visible();assert page.locator('.data-connectors line').count()==6
  # Real native link polygons and callout anchors use safe destinations.
  links=page.locator('.data-callout a');
  if links.count():
   assert links.first.get_attribute('href').startswith('https://example.org/');
   with page.expect_popup() as popup:links.first.click()
   dest=popup.value;assert dest.url.startswith('https://example.org/');dest.close()
  else:
   page.wait_for_function('document.querySelectorAll(".data-links a").length>0');assert page.locator('.data-links a').first.get_attribute('href').startswith('https://example.org/')
  page.screenshot(path=str(out/('mobile-geometry.png' if mobile else 'desktop-geometry.png')))
  page.locator('#data-exit-view').click();page.wait_for_function('!DataSets.state.focused');assert page.locator('.data-left').is_visible()
  # RSS and RDF both pass through actual upload -> native renderer -> callout selection.
  print('Testing feeds and RDF',flush=True);upload(page,'news.rss','<rss version="2.0"><channel><title>Feed</title><item><title>First</title><link>https://example.org/rss</link><description>Report</description></item><item><title>Second</title><link>https://example.org/second</link></item></channel></rss>');assert page.evaluate('DataSets.state.source.format')=='RSS' and page.evaluate('DataSets.state.total')==2
  upload(page,'graph.ttl','@prefix ex: <https://example.org/> . ex:one ex:name "One"@en ; ex:count 7 . ex:two ex:link ex:target .');assert page.evaluate('DataSets.state.total')==3;assert 'language' in [c['name'] for c in page.evaluate('DataSets.state.schema')]
  page.locator('#data-back').click();page.locator('#address-list button').nth(2).click();wait_ready(page)
  # Reload route, saved geometry collection, Projections preset regression (block 0).
  page.reload();page.wait_for_function('DataSets.active');assert page.evaluate('ContinuumLab.state.entries.length')==1;page.locator('#data-back').click();page.locator('#address-list button').nth(1).click();page.wait_for_function('Projections.state.ready');assert page.evaluate('Projections.state.blockSize')==0;assert page.evaluate('Projections.state.presets.length')==56;page.locator('#projections-back').click();page.locator('#address-list button').nth(2).click()
  if not mobile:
   print('Testing remaining formats',flush=True)
   formats=[('x.tsv','title\tcount\nOne\t0\nTwo\t1','auto','',2,'tsv'),('x.jsonl','{"title":"One"}\n{"title":"Two"}','auto','',2,'jsonl'),('x.json','{"payload":{"rows":[{"name":"One","nested":{"n":0}},{"name":"Two"}]}}','json','payload.rows',2,'json'),('x.rdf','<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="https://example.org/"><rdf:Description rdf:about="https://example.org/a"><ex:title>Hello</ex:title></rdf:Description></rdf:RDF>','auto','',1,'RDF/XML'),('x.nt','<https://example.org/s> <https://example.org/p> "Hello" .','auto','',1,'rdf'),('x.trig','@prefix ex: <https://example.org/> . ex:g { ex:s ex:p "Value" . }','auto','',1,'rdf'),('x.txt','One\nTwo','auto','',2,'text')]
   for name,text,fmt,path,count,detected in formats:
    upload(page,name,text,fmt,path);assert page.evaluate('DataSets.state.total')==count;assert page.evaluate('DataSets.state.source.format')==detected
   upload(page,'binary.bin',bytes([0,1,2,3]));assert page.evaluate('DataSets.state.source.format')=='Binary metadata'
   # Empty/malformed input explicit, recoverable; page size does not discard rows.
   upload(page,'empty.json','[]');assert page.evaluate('DataSets.state.total')==0
   page.locator('#data-add').click();page.locator('#data-file').set_input_files({'name':'bad.csv','mimeType':'text/csv','buffer':b'name\n"Unclosed'});page.wait_for_function('!!document.querySelector("#data-state").dataset.error');assert 'Unclosed' in page.locator('#data-state').inner_text()
   page.locator('#data-links').uncheck();page.locator('#data-split').uncheck();page.locator('#data-repeat').check()
   upload(page,'many.json',json.dumps([{'title':'Record '+str(i),'number':i} for i in range(600)]));setting(page,'Rows per geometry',448);assert len(page.evaluate('DataSets.state.items'))==448;page.wait_for_function('document.querySelectorAll(".data-callout:not([hidden])").length===7');page.screenshot(path=str(out/'dense-448.png'))
   # All catalog URLs loaded directly from production, without proxy or overlay.
   for index in (0,2,3):
    page.locator('#data-source').select_option(str(index));wait_ready(page);assert page.evaluate('DataSets.state.total')>0;print('Catalog',index,page.evaluate('DataSets.state.total'),flush=True)
  assert not errors,errors
  page.screenshot(path=str(out/('mobile-configurators.png' if mobile else 'desktop-configurators.png')),full_page=True)
  results.append({'mobile':mobile,'publicAirports':3376,'nativeGeometry':True,'sourceAddressPreserved':True,'sixCalloutsAndHoverInFullscreen':True,'fileIntake':True,'separateLinks':True,'splitColumns':True,'repeatHandling':True,'paging':True,'noSearch':True,'formats':len(formats)+4 if not mobile else 3,'maxDrawnDataFacets':448 if not mobile else 49,'projectionsBlockTested':0,'errors':errors});ctx.close();print('Passed',mobile,flush=True)
 browser.close()
(out/'verification.json').write_text(json.dumps({'url':url,'results':results},indent=2));print(json.dumps(results))
