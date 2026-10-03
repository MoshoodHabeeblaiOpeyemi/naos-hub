# Executive portraits

Drop official portraits here.

**Naming:** use the executive's `id` from `src/data/executives.js`, lowercase.
Example: `president.jpg`, `gensec.jpg`, `pro1.jpg`

**Recommended:** square crop, at least 400×400px, under 200KB each.

Then set that exec's `photo` field in `src/data/executives.js` to
`/images/executives/<id>.jpg`.

If `photo` is left as `null`, the site shows a green initials circle instead —
which looks deliberate, so photos are not urgent.
