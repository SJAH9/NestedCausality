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


## G₂ inputs from the explorer (configurator 8)

The fourteen-facet selector chooses one operation. Its inputs come from the
completed explorer mesh, after the original symmetry, envelope, Bucky, branching,
occupancy and subdivision operations. Selecting a facet preserves the first six
configuration fields. All original controls and Spin all remain active.
The selector uses the same numerical VE labels and native territory renderer as
the other numerical configurators. No independent radius/angle form replaces
the explorer mesh.

Choices: native explorer, flat R⁷, flat T⁷, G₂ cross product, associative frame,
coassociative complement, cone over S³ × S³, and the seven associative coordinate
planes of the standard positive three-form. Additional initial conditions are
allowed when a construction requires them; the present operations derive their
inputs from the object under study.

The executable contract is in g2.js. For each explorer vertex p=(x,y,z), the
declared seven-coordinate lift is
L(p)=(x,y,z,(x+y)/√2,(y+z)/√2,(z+x)/√2,(x−y+z)/√3).
Incident face normals supply the second vector. Face incidence, vertex positions,
edge lengths and derived angular relationships remain inspectable in the input
mesh; source coordinates, normals and display projections remain attached as
g.g2.samples. This lift and the display projection are lab design choices,
not equations imported from a physical theory.

The cross product uses
φ=e123+e145+e167+e246−e257−e347−e356.
The associative frame uses orthonormal u,v and u×v; radial/normal alignment uses a
deterministic orthogonal-axis fallback. The complement is span(e4,e5,e6,e7).
The torus uses the lift as periodic angles, displayed through sines and the stated
linear projection. The cone uses stereographic S³ charts of position and incident
normal plus the explorer radius, then a declared three-coordinate projection.
Nonlinear operations triangulate before applying the vertex map. Final display
normalization fits the existing viewport. Native six-field geometry remains
unchanged.

These are executable explorer influences and projected constructions. The cone's
nearly Kähler metric, torsion-free metric solutions, physical spectra and vacuum
selection are not computed. They are not replaced with invented scores.

Sources: [Karigiannis, Introduction to G₂ geometry](https://arxiv.org/abs/1909.09717)
and [Atiyah–Witten](https://arxiv.org/abs/hep-th/0107177).

New saved addresses use seven integers: the original six and the selected facet
1–14. Existing six-number addresses are unchanged. Previously saved ten-number
section addresses retain their former equations through mtheory.js, without
silently overwriting or migrating them. Selecting a new configurator-8 facet
creates the new seven-number construction; the earlier address remains in the
collection. Import/export and hash validation accept all three formats.

verify_g2.py checks all fourteen operations, cross-product identities, geometry
dependence, preservation of original settings, active controls and save/reopen.
verify_mtheory.py records the preceding section implementation and is not the
acceptance test for the current configurator interface.

## Phone graphics resources

Touch/coarse-pointer devices and Android use `render-budget.js`: a presentation
adapter around the same native WebGL renderer. All eleven views share **one**
WebGL2 context, buffer, shader programs and bounded 24 MiB label cache. Each pane
keeps its geometry, rotation, hit testing and controls; the native completed frame
is copied to that pane's Canvas2D display. Desktop retains per-view WebGL rendering.
Side labels use at most 256 pixels; main labels at most 512. Phone view buffers
use DPR ≤ 1.5 and at most 1.2 million pixels per visible canvas. These are raster
resource limits, not changes to geometry, topology, calculations or address capacity.

The prior app created eleven contexts at startup, including hidden panes. In
Chromium with an eight-context limit, the menu and central lab contexts were lost.
`verify_fold.py` exercises the actual URL under a **one-context** limit, with
Android Edge user-agent/touch emulation, folded/unfolded/landscape resizing,
nonblank pixel checks, native and M-theory controls, save/reopen, and actual
WEBGL_lose_context loss/restoration. This is emulation, not a claim of running on
physical Pixel Fold hardware or its Android Edge binary. Native context-loss
handlers preserve saved data; graphics startup failures show a readable status.

## Fullscreen

The Arcade-style fullscreen button stays at the lower right in the menu and Facet Lab, including phone safe areas. It enters/exits native browser fullscreen without reloading or changing the selected configuration. Browser exits synchronize the button state. Keyboard focus includes the button in the lab. Fullscreen request failures appear as readable status text. verify_fullscreen.py checks desktop and touch layouts, browser exit and configuration retention against the actual URL.

## Projections

The top-level destination after Facet Lab opens an independent explorer with the
same native camera, gestures, minimum saved geometry and eight VE configurators.
Four are populated; four remain empty. Saved geometries come from the existing
browser address collection and are never modified by projection.

The first configurator offers π, e, φ, √2, √3, √5, √6, √7, √10, √11, √13,
√17, √19 and √23. Expansions start after the decimal point. Mode 1 assigns one
facet to each digit. Mode 2 assigns d consecutive facets to digit d (zero consumes
a decimal position but adds no facets). Modes 3 and 4 use a running digital sum:
r₀ = d₀; rₙ = digital_root(rₙ₋₁ + dₙ). Mode 3 assigns one facet per result;
mode 4 assigns rₙ facets. The final run is truncated at the exact facet budget.

Block values are exactly the author's sequence:
0, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8196, 16392, 32784.
Limit choices are 1–14. Defaults are block 0, limit 1. The product counts labelled
facets, separately from decimal positions consumed. Unoccupied cells remain in
the wireframe; with block 0 the minimum native surface alone is displayed.

`facet-geometry.js` is the shared native Facet Lab construction. Both the lab
and `projection-worker.js` call it. Projections supplies an exact added facet
count through `addFacets`, retaining the saved symmetry, growth, branching and
G₂ rules and native empty-facet compaction. It does not subdivide a frozen saved
minimum surface. Jobs are cancelled when settings change. `projection-renderer.js` extends the native GPU renderer with a batched
digit atlas using the same camera transform. All digit labels are submitted in
one instanced draw, without per-facet DOM nodes or textures. Static panes retain
their drawn image; they redraw for geometry, labels, motion or viewport changes. A native renderer
pool shares one context among the nine projection panes; on mobile they use the
existing global pool. No scores or physical predictions are generated.

`generate_digits.py` reproduces the static fractional digit assets. Square roots
and φ use integer arithmetic; π and e use mpmath with two guard precisions.
`digits/manifest.json` records methods, prefixes and SHA-256 hashes. Decimal
assets support the full selectable budget; no large-block runtime performance
claim is made. Verification is deliberately restricted to small block sizes at
the author's request.

## Arcade environment

`vendor/menu-environment.js` is the unchanged production Arcade environment. Its
analytic infinite plane, horizon, two grid scales, palette and advancing ground
motion are retained. `environment.js` moves one environment canvas between the
menu and the active explorer, supplying its native yaw, pitch, pan and distance.
It draws at up to 30 fps beneath the transparent geometry. Reduced motion stops
ground travel; hidden pages pause. One environment GPU context supplements the
existing geometry context pool on mobile, independently of the pane count.
Source and SHA-256 are recorded in `environment-provenance.json`.

## Projections presets

The four left VE menus provide 56 browser-local preset slots. Clicking an empty
`+` facet saves the current irrational, mode, block size, block limit and native
geometry configuration. Clicking a filled facet restores that snapshot without
overwriting it, even if the original saved geometry is no longer in the menu.
Rotation alone does not select or save a preset. The matching select controls
provide the same actions by keyboard. Presets use their own versioned storage
key and leave Facet Lab addresses unchanged; unavailable browser storage is
reported explicitly.
