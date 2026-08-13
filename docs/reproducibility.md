# Reproducibility

## Requirements

- Python 3.10 or newer
- No third-party Python packages
- A modern browser for HTML instruments

## Verify everything

From the repository root:

```bash
python3 tools/verify_repository.py
```

The verifier uses a temporary directory and does not overwrite committed
results.

## Canonical simulations

```bash
python3 "Continuum Game Theory/enclosure_game.py" \
  --rounds 30 --seed 42 \
  --json-out /tmp/enclosure_game_results.json

python3 "Continuum Game Theory/ncm_prisoners_dilemma.py" \
  --rounds 20 --seed 42 \
  --json-out /tmp/ncm_prisoners_dilemma_results.json

python3 "Continuum Game Theory/enclosure_nash_infinite.py" \
  --N 15 --rounds 25 \
  --json-out /tmp/enclosure_nash_infinite_results.json
```

With the current source, each output should match its corresponding committed
JSON file byte-for-byte.

## Intentional result changes

When model logic or canonical parameters change:

1. retain the old result until the behavioral difference is understood;
2. run both versions with identical parameters;
3. document the changed assumption;
4. regenerate the canonical output;
5. run the verifier;
6. commit source, documentation, and output together.
