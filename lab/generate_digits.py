"""Reproducible fractional decimal expansions, generated locally (no runtime API).

Roots and phi use exact integer square roots. Pi and e use mpmath with
64 guard digits, with a second precision check. Assets exclude integer parts.
This generates data; it does not exercise any projection block sizes.
"""
from pathlib import Path
import hashlib,json,math,sys
import mpmath as mp
if hasattr(sys,'set_int_max_str_digits'):sys.set_int_max_str_digits(0)
N=458976
root=Path(__file__).resolve().parent/'digits';root.mkdir(exist_ok=True)
manifest={}
def save(name,value,method):
 assert len(value)==N and value.isdigit()
 (root/(name+'.txt')).write_text(value+'\n')
 manifest[name]={'decimalPlaces':N,'sha256':hashlib.sha256((value+'\n').encode()).hexdigest(),'method':method,'prefix':value[:32]}
 print(name,flush=True)
for name,formula in [('pi',lambda:mp.pi),('e',lambda:mp.e)]:
 with mp.workdps(N+64):value=str(mp.nstr(formula(),N+40,strip_zeros=False)).split('.')[1][:N]
 with mp.workdps(N+96):check=str(mp.nstr(formula(),N+40,strip_zeros=False)).split('.')[1][:N]
 assert value==check
 save(name,value,'mpmath '+mp.__version__+'; 64 and 96 guard digits agree')
scale=10**N
for n in [2,3,5,6,7,10,11,13,17,19,23]:
 value=str(math.isqrt(n*scale*scale)).zfill(N+1)[-N:]
 save('sqrt'+str(n),value,'exact floor(sqrt(n * 10^(2N))) using integer isqrt')
phi=(scale+math.isqrt(5*scale*scale))//2
save('phi',str(phi)[-N:],'exact floor((10^N + floor(sqrt(5 * 10^(2N)))) / 2)')
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
