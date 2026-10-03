# Event photos

Drop event photos here.

**Naming:** use the event's `id` from `src/data/events.js`, lowercase.
Example: `freshers-orientation.jpg`

**Recommended:** 16:9 crop, at least 1200×675px, under 300KB each.

Then set that event's `photo` field in `src/data/events.js` to
`/images/events/<id>.jpg`.

If `photo` is left as `null`, the site shows a gold "NAOS" placeholder tile.

Note: when NAOS has real per-event photos, each event will also need its own
1200×630 preview image so WhatsApp shows that event's picture rather than the
generic site card. See `docs/ROADMAP.md` (migration trigger).
