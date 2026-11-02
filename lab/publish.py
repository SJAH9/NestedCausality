"""Scoped publication with concurrent-edit checks and remote byte backups.

Explicit invocation publishes this app to sidhubbard.com/continuum/lab/.
Uses the caller's existing SSH authentication; no credentials are stored here.
"""
import argparse, hashlib, json, shlex, subprocess, tarfile, tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    files = {('continuum/lab/' + str(p.relative_to(source))): p for p in source.rglob('*')
             if p.is_file() and '__pycache__' not in p.parts and '.git' not in p.parts}
    assert files and 'continuum/lab/index.html' in files
    host = 'sjah@sidhubbard.com'
    query = """import pathlib,hashlib,json
root=pathlib.Path('/var/www/virtual/sjah/html')
print(json.dumps({n:hashlib.sha256((root/n).read_bytes()).hexdigest() if (root/n).is_file() else None for n in NAMES}))
""".replace('NAMES', repr(list(files)))
    before = json.loads(subprocess.check_output(['ssh', '-o', 'BatchMode=yes', host, 'python3 -c ' + shlex.quote(query)], text=True))
    changed = {n: p for n, p in files.items() if hashlib.sha256(p.read_bytes()).hexdigest() != before[n]}
    manifest = {n: {'before': before[n], 'after': hashlib.sha256(p.read_bytes()).hexdigest()} for n, p in changed.items()}
    with tempfile.TemporaryDirectory(prefix='continuum-lab-release-') as temp:
        archive = Path(temp) / 'release.tar'
        manifest_file = Path(temp) / 'manifest.json'
        manifest_file.write_text(json.dumps(manifest))
        with tarfile.open(archive, 'w') as tar:
            for n, p in changed.items():
                tar.add(p, arcname=n)
            tar.add(manifest_file, arcname='manifest.json')
        remote_archive = subprocess.check_output(['ssh', '-o', 'BatchMode=yes', host, 'mktemp /home/sjah/continuum-lab-release-XXXXXX.tar'], text=True).strip()
        subprocess.run(['scp', str(archive), host + ':' + remote_archive], check=True)
        script = r'''
from pathlib import Path
import hashlib,json,tarfile,tempfile,os
root=Path('/var/www/virtual/sjah/html')
backup=Path(tempfile.mkdtemp(prefix='continuum-lab-backup-',dir='/home/sjah'))
changes={}
with tarfile.open(ARCHIVE) as tar:
 manifest=json.load(tar.extractfile('manifest.json'))
 for name,expected in manifest.items():
  assert name.startswith('continuum/lab/') and '..' not in Path(name).parts
  path=root/name
  old=path.read_bytes() if path.exists() else None
  assert (hashlib.sha256(old).hexdigest() if old is not None else None)==expected['before'],('Concurrent production edit',name)
  raw=tar.extractfile(name).read()
  assert hashlib.sha256(raw).hexdigest()==expected['after']
  changes[name]=(old,raw)
for name,(old,raw) in changes.items():
 if old is not None:
  saved=backup/name;saved.parent.mkdir(parents=True,exist_ok=True);saved.write_bytes(old)
(backup/'manifest.json').write_text(json.dumps(manifest,indent=2))
for name,(old,raw) in changes.items():
 path=root/name
 assert (path.read_bytes() if path.exists() else None)==old,('Concurrent production edit',name)
 path.parent.mkdir(parents=True,exist_ok=True)
 fd,tmp=tempfile.mkstemp(prefix='.manifold-',dir=path.parent)
 with os.fdopen(fd,'wb') as file:file.write(raw)
 os.chmod(tmp,0o644);os.replace(tmp,path)
Path(ARCHIVE).unlink()
print(json.dumps({'backup':str(backup),'files':len(changes),'manifest':manifest},indent=2))
'''.replace('ARCHIVE', repr(remote_archive))
        receipt = subprocess.check_output(['ssh', '-o', 'BatchMode=yes', host, 'python3 -'], input=script, text=True)
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(receipt)
        data = json.loads(receipt)
        print(json.dumps({k: data[k] for k in ['backup', 'files']}))


if __name__ == '__main__':
    main()
