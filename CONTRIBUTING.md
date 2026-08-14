# Contributing to the Nested Causality Atlas

Release 0.1 is scope locked. New feature ideas belong in `ROADMAP.md`; they do
not enter the active release unless required to make a locked feature correct.
Contributions must preserve the distinction between observation, inference,
hypothesis, model output, and mapped source.

## Before changing the map

1. Identify the source observation, text, or definition being mapped.
2. Preserve its first appearance separately from later maturation or correction.
3. State every added assumption in the record or documentation.
4. Do not reverse causal projection or silently replace terminology.
5. Retain exchange residuals and explicit Final Frontier halt conditions.
6. Regenerate web and print outputs from the same canonical data.
7. Add post-0.1 feature discoveries to the roadmap entry template.

## Repository conventions

- Use Markdown for prose resources.
- Use UTF-8 and descriptive filenames.
- Keep generated output under `outputs/` and its source under `data/` or `src/`.
- Include the exact command used to generate a committed result.
- Avoid adding package dependencies when the standard library is sufficient.
- Do not commit caches, virtual environments, editor metadata, or temporary logs.

## Validation

Run the atlas tests and rebuild the chart before submitting a change:

```bash
python3 -m src.generate_star_map
python3 -m unittest discover -s tests
```

If a route, bearing, or reference output changes, explain why and include a
concise before-and-after comparison.

## Design Gates

Release 0.1 requires three independent design cycles. Functional correctness
does not waive visual review. Changes must remain coherent in day, night,
desktop, mobile, and print views without changing the meaning of map symbols.

## Research texts and rights

Do not rewrite mapped research sources as part of code cleanup. Rights and reuse
terms may differ by work; consult [`RIGHTS.md`](RIGHTS.md) and the cited
publication.
