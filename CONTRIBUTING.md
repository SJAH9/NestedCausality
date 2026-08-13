# Contributing

Contributions should preserve the distinction between a research claim, a
formal definition, a computational implementation, and an exploratory
instrument.

## Before changing a model

1. Identify the source text or definition being implemented.
2. State every added assumption in the code, documentation, or both.
3. Do not silently replace established terminology or equations.
4. Keep deterministic examples deterministic by recording seeds and parameters.
5. Regenerate reference outputs only when model behavior intentionally changes.

## Repository conventions

- Use Markdown for prose resources.
- Use UTF-8 and descriptive filenames.
- Keep generated output beside the model that produces it.
- Include the exact command used to generate a committed result.
- Avoid adding package dependencies when the standard library is sufficient.
- Do not commit caches, virtual environments, editor metadata, or temporary logs.

## Validation

Run the repository verifier before submitting a change:

```bash
python3 tools/verify_repository.py
```

If a reference result changes, explain why and include a concise behavioral
comparison in the commit or pull request.

## Research texts and rights

Do not rewrite research papers as part of code cleanup. Rights and reuse terms
may differ by work; consult [`RIGHTS.md`](RIGHTS.md) and the cited publication.
