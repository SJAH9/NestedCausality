# Continuum Manifold Lab

Sid J.A. Hubbard's original Continuum Manifold Lab: a saved-address menu around
an executable local copy of the production Arcade Facet Lab.

Open `index.html` directly in a modern browser with WebGL 2, or serve this entire
folder from any static host. No build step, package installation, API, account,
external asset, server process or paid service is needed. The published location
is https://sidhubbard.com/continuum/lab/.

The initial menu is a canonical VE (12 vertices, 24 edges, six squares and eight
triangles), using the Arcade foyer’s initial yaw, pitch, roll and front-first
facet ordering. **Facet Lab** is the only initial destination. The native Arcade
territory algorithm assigns spare facets to existing destinations: one destination
initially owns all fourteen facets, rather than leaving thirteen unassigned.
Saved addresses receive their own connected territories. Beyond fourteen items,
the menu uses the Arcade [ff] subdivision, empty-cell compaction and territory
assignment, without a preset address-count ceiling.
Machine memory and browser storage are finite; this is not a claim of constant
rendering cost or an infinite materialized mesh.

Open Facet Lab, explore, and **Save**. Each six-number configuration becomes an
address; its preview item count is retained so reopening restores its geometry.
Saving a configuration already present updates its count rather than duplicating
it. Back without Save leaves the collection unchanged. Reload retains saved
addresses in that browser. Export/import provides portable JSON collections and
merges by configuration address. A malformed import is rejected before mutation.
A storage failure retains the collection for the tab and asks the user to export.
Different origins and browsers have separate storage; local-file storage behavior
is browser-specific. There is no cloud synchronization.

The six fields are symmetry (1–12), step (1–14), rule (1–14), branching (1–14),
facets per item (1–14), and Bucky influence (1–14). The original finite configurator
space has 6,453,888 tuples; preview occupancy retains the original 0–2,352 range.
That preview range does not limit the saved-address menu. The menu contains only
addresses actually saved/imported, rather than eagerly generating all tuples.
Hash addresses such as `#12-14-4-2-1-1` open that configuration. A saved address
uses its stored preview count; an unsaved address opens with an empty preview.

## Original executable module

`vendor/facet-lab.css` is a byte-identical copy of the production file.
`vendor/ve-renderer.js` retains the production renderer with one optional
`preserveWinding` argument to `setGeometry`, used only by mathematical sections;
native Arcade calls retain the original radial-normal behavior. Original hashes
are recorded in `provenance.json`. `vendor/arcade.js` is the original,
unloaded reference; `vendor/facet-lab.original.js` retains the unadapted lab. `vendor/arcade-contract.js` extracts the native geometry,
territory, projection and hover functions verbatim. `vendor/facet-lab.js` preserves
all geometry calculations, adapting its host open/close/save contract,
storage namespace, back label and public exports. Configuration VEs additionally
coast after a rotational drag and select the occupied facet with the greatest
visible projected area when momentum stops. Selection updates the corresponding
field and subject geometry once. Explore actions do not auto-activate. Configurator 8 selects the mathematical construction after a spin. Reduced motion selects at release without continued coasting. It does not replace the lab with
a visual approximation. No chapter transcript, narrative renderer or score is involved. Mathematical
sections have an explicit coordinate correspondence; no physical prediction or
universe-selection result is generated.

`menu.js`, `start.js`, `index.html` and `lab.css` supply the standalone host.
The address list is paginated for accessible keyboard/search use while the single
menu shell receives the whole saved inventory. Drag/pinch/wheel control the shell;
arrows select destinations and Enter opens them. The menu has no automatic motion.
The native lab honors reduced-motion preferences.

Browser interaction verification can be run with Python Playwright:

```
python3 verify.py --url http://127.0.0.1:8876/ --output /tmp/manifold-check
```

Serve a local copy with `python3 -m http.server 8876 --bind 127.0.0.1` if desired.
`verify.py` tests the real supplied URL, including production, in isolated browser
storage. It also accepts a local `file:///…/index.html` URL. Checks exercise native
controls, save/reopen geometry, persistence, rejected imports, export, a 2,809-item
menu, keyboard navigation, and mobile layout. Screenshots and JSON evidence go to
the specified output directory. Generated browser state is not part of the app.

## Spin all

Push the tiny **Spin all** VE in the lab header. It transfers the same angular
increments and release velocity to every configurator box, preserving each
box’s starting orientation. All use the controller’s response and decay for that
gesture, even if a settling selection changes the rule field. The seven setting
controls then select their own most visible facets and update the subject. The M-theory selector rotates too; Explore actions remain explicit. No random numbers,
shuffled configurations or generated impulses are used. Reduced motion applies
the dragged rotation and selects at release without coasting.

Configurator and Spin all inertia use a 4-second decay constant, increased fivefold
from the first spin-control implementation. Release speed comes from the gesture;
for the same release velocity, the coast lasts approximately five times as long
and covers approximately five times the angle before reaching the same stop
threshold. The central subject preview retains its native inertia.

`verify_menu_rules.py --url <app URL> --output <evidence directory>` checks
exact geometry, territory ownership, boundary edges, surface anchors and starting
view against the native Arcade contract at 1, 2, 14, 15 and 2,809 destinations.
It confirms the retained upstream source still matches the production Arcade
and opens an addressed configuration through a real facet at each population.


## M-theory starting conditions (configurator 8)

The construction selector contains Native Arcade, T⁷, S⁷, S⁷/Zₖ and the
conical limit C(S³ × S³). Selecting a construction establishes a reproducible
initial condition: unit radius, section angle 42°, and quotient order 3 for the
Hopf quotient. Native Arcade returns to the original six-field geometry.
Radius, section angle and quotient order are explicit controls, with dimensionless
units. Item count controls section sampling density, not physical population.
Native symmetry/rule/branching/Bucky controls are disabled in section mode because
those aesthetic transformations have no declared action on the physical family.

`mtheory.js` owns the equations, source-coordinate samples and section maps.
All four ambient spaces have dimension seven. Only a specified two-dimensional
section is rendered. The torus uses a T² section of (S¹)⁷ (five fixed angles);
the sphere uses a latitude S² in R⁸; the quotient uses a Hopf T² in C² ⊂ C⁴;
the cone uses one circle in each S³ at fixed positive radial coordinate.
The renderer receives a sampled triangulated embedding of that section via the
existing geometryFromCells contract, using its native surface draw mode.
It is not an isometric embedding of the ambient manifold or an image of all
seven dimensions. Source-coordinate samples remain attached to the mesh.

The quotient obeys z → exp(2πi/k)z. Section coordinates u = k arg(z₁) and
v = arg(z₂/z₁) are invariant; the displayed torus embeds those coordinates.
Changing k changes the quotient identification and source lift while the section
can retain the same displayed shape. This is an actual equivalence relation,
not an arbitrary k-lobed deformation.

The cone entry preserves the product-sphere constraints and radial coordinate.
It supplies a topological section of the conical limit, not the nearly Kähler
metric on its link or a computed torsion-free G₂ metric. No flux background,
field equations, spectrum, vacuum or universe selection is calculated.
No Joyce resolution or twisted connected sum is claimed as generated geometry.

Sources: [M-theory on twisted tori](https://arxiv.org/abs/hep-th/0504108),
[ABJM](https://arxiv.org/abs/0806.1218),
[Atiyah–Witten](https://arxiv.org/abs/hep-th/0107177).
The catalog links each construction to its source in the application.

Old six-number addresses, imports and exports remain valid. New addresses append
four integers: type (1–5), radius index (1–14, divided by 4), angle index (1–14,
multiplied by 6°), and k (1–14). Export format version 1 now accepts either
six or ten values; older app releases reject the extension rather than truncate
it. Reopening, reloading and hash links restore these initial conditions.

Run `verify_mtheory.py --url <URL> --output <directory>` for source equation
residuals, mesh Euler characteristics, closed-edge incidence, quotient orbit
invariance, actual controls, native-mode return, save/reopen/reload, WebGL errors
and mobile overflow checks. These are mathematical/interface checks; this is not
narrative visual work and carries no blind narrative review claim.
