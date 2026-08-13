# Repository Tools

`verify_repository.py` runs the canonical simulations in a temporary directory,
validates each output as JSON, and checks it against the committed reference
result.

```bash
python3 tools/verify_repository.py
```

The tool uses only the Python standard library and does not modify repository
artifacts.
