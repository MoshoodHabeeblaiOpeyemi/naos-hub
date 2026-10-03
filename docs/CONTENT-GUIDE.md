# NAOS Hub — Content Guide

Written for **PRO I** and **PRO II**. No coding knowledge needed.

Everything you'll change lives in one folder: `src/data/`

| File | What it controls |
|---|---|
| `site.js` | Association name, motto, slogan, WhatsApp number, email, LinkedIn |
| `executives.js` | The executive list |
| `events.js` | Upcoming events |

---

## The one rule that matters

Change the **words between the quotes**. Keep the quotes. Keep the commas.

```js
// GOOD
name: 'Moshood Habeeblai Opeyemi',

// BAD — missing comma breaks the whole site
name: 'Moshood Habeeblai Opeyemi'

// BAD — missing quote breaks the whole site
name: Moshood Habeeblai Opeyemi
```

If you make a mistake, the site will show a **blank white page**. Nothing will
be half-broken. To fix it: press `Ctrl+Z` until the text is back, then save.
If that fails, ask the developer to check GitHub.

---

## How to change an executive

Open `src/data/executives.js`. Find the person. Change their details:

```js
{
  id: 'gensec',          // do not change this
  name: 'Real Name Here',
  position: 'General Secretary',
  level: '300',
  department: 'Microbiology',
  photo: null,           // see "Adding a photo" below
}
```

**To remove someone:** delete the whole `{ ... }` block, including the comma
after the closing brace.

**To add someone:** copy an existing block, paste it below, and change the
values. Give it a short unique `id` — no spaces.

### Adding a photo

1. Put the image file in `public/images/executives/`
2. Name it after their `id`, lowercase: `gensec.jpg`
3. Set `photo: '/images/executives/gensec.jpg'`

If `photo` stays `null`, the site shows a green circle with their initials.
**This looks deliberate, so photos are not urgent.**

---

## How to add an event

Open `src/data/events.js`. Copy an existing block and edit it:

```js
{
  id: 'freshers-orientation',
  title: 'Freshers Orientation Programme',
  date: '2026-10-17',        // YYYY-MM-DD — always four digits
  time: '14:00',             // 24-hour, HH:MM
  location: 'Main Auditorium, University of Ilorin',
  description: 'One or two sentences about the event.',
  kind: 'general',           // social | sports | academic | general
  photo: null,
}
```

**The date format is the thing people get wrong.** It must be
`year-month-day`: `2026-10-17` is 17 October 2026. `17-10-2026` will not work.

**Past events move themselves.** Any event whose date has passed is no longer
listed as upcoming. Nothing to update by hand.

If you put a future date in, it appears automatically. If every event has
passed, the section shows the most recent ones instead — so it never looks
empty.

---

## Changing the contact details

Open `src/data/site.js`, find `contact`. The WhatsApp number is split across
two fields:

```js
whatsappDisplay: '+234 704 071 7939',   // what people read
whatsappNumber: '2347040717939',        // what the link uses
```

The second one must be the **international format with no `+`, spaces or
dashes** — country code first. For a Nigerian number, start `234` and drop the
leading `0`. For example `0803 123 4567` becomes `2348031234567`.

**If you leave `email: null`, no email button appears.** That is intentional —
better no button than a broken one. Add the address as a value to make it show.

---

## Before you publish

- [ ] No names still say "Placeholder Name"
- [ ] Every event has a real confirmed date and venue
- [ ] WhatsApp number tested by actually opening the link
- [ ] `contentStatus: 'placeholder'` changed to `'verified'` in `site.js`

That last one matters — it is how the site keeps track of whether its content
has been checked by a human. While it is still `'placeholder'`, running
`npm run dev` shows a yellow warning strip at the top of the page so you
cannot miss it. That strip never appears on the live site.

---

## Getting help

**Something is broken:** contact the developer. Include a screenshot and the
name of the file you were editing.

**You want a new feature:** the same. Features are built in stages — see
`docs/ROADMAP.md`. Not everything on that list is being built yet.
