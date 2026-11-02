# Continuum Manifold Lab

Sid J.A. Hubbard's original Continuum Manifold Lab: a saved-address menu around
an executable local copy of the production Arcade Facet Lab.

Open `index.html` directly in a modern browser with WebGL 2, or serve this entire
folder from any static host. No build step, package installation, API, account,
external asset, server process or paid service is needed. The published location
is https://sidhubbard.com/continuum/lab/.

The initial menu is a canonical VE (12 vertices, 24 edges, six squares and eight
triangles). Only one face is assigned: **Facet Lab**. Other faces remain unassigned
until configurations are saved. Larger menus use the native Arcade subdivision
and empty-cell compaction functions, without a preset address-count ceiling.
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

`vendor/ve-renderer.js` and `vendor/facet-lab.css` are byte-identical copies of the
production files recorded in `provenance.json`. `vendor/arcade.js` is the original,
unloaded reference; `vendor/facet-lab.original.js` retains the unadapted lab. `vendor/arcade-contract.js` extracts the native geometry,
territory, projection and hover functions verbatim. `vendor/facet-lab.js` preserves
all geometry calculations, adapting its host open/close/save contract,
storage namespace, back label and public exports. Configuration VEs additionally
coast after a rotational drag and select the occupied facet with the greatest
visible projected area when momentum stops. Selection updates the corresponding
field and subject geometry once. Explore actions and the reserved VE do not
auto-activate. Reduced motion selects at release without continued coasting. It does not replace the lab with
a visual approximation. No chapter transcript, narrative renderer or score is
involved; no physical correspondence or universe-selection result is generated.

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
gesture, even if a settling selection changes the rule field. The six setting
controls then select their own most visible facets and update the subject. Explore
and the reserved VE rotate too; Explore actions remain explicit. No random numbers,
shuffled configurations or generated impulses are used. Reduced motion applies
the dragged rotation and selects at release without coasting.

Configurator and Spin all inertia use a 4-second decay constant, increased fivefold
from the first spin-control implementation. Release speed comes from the gesture;
for the same release velocity, the coast lasts approximately five times as long
and covers approximately five times the angle before reaching the same stop
threshold. The central subject preview retains its native inertia.
