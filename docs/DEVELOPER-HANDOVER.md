# NAOS Hub — Developer Handover

**Purpose:** everything a successor tech lead needs to keep this site running,
and to build the later stages without the original developer.

**Before Stage 2 is built, sections marked ⚠️ must be filled in.**

---

## 1. What this system is

A one-page public site for NAOS Unilorin Chapter. No backend, no login, no
database at Stage 0 — it is static files served from a CDN.

**Built:** Vite + React 19 + Tailwind CSS v4. Free hosting on Vercel.
Running cost: ₦0 plus the domain.

### The governing principle

> Every feature must justify itself. If it does not serve a member or an
> elected officer's job, it does not get built.

There is deliberately **no super-admin account**. Roles are assigned by the
President and enforced in code, not by a person holding all the keys. The
original developer has no in-app admin account and should not be given one.

---

## 2. Accounts and credentials

⚠️ **Fill this in before handover. Store real values in Bitwarden, never in
this file or in git.**

| Service | Account | Where | Notes |
|---|---|---|---|
| GitHub | ⚠️ | ⚠️ | Currently a **personal** account — must move to an NAOS org |
| Vercel | ⚠️ | ⚠️ | Connected to the GitHub repo, deploys on push |
| Domain registrar | ⚠️ | ⚠️ | Register in NAOS's name, not a personal name |
| Firebase | not created | — | Only needed from Stage 2 |
| Cloudinary | not created | — | Only if needed from Stage 2 |
| Email service | ⚠️ | ⚠️ | Needed once announcements are emailed |

> **Repo ownership is the most important line in this table.** A project owned
> by one student's personal account disappears when that student graduates and
> stops paying for it, or loses access. Create an NAOS organisation on GitHub
> (free) and transfer the repository to it.

---

## 3. Running it locally

```bash
npm install        # once, after cloning
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built site to check it
npm run lint       # check code style — must pass before committing
```

Requires Node 20 or newer. Check with `node --version`.

---

## 4. How to deploy

Push to `main`. Vercel builds and deploys automatically.

```bash
git add .
git commit -m "describe what changed"
git push
```

The site is live in about a minute. Nothing to click.

**Always run `npm run build` and `npm run lint` before pushing.** A broken
build deploys a broken site — your members will see a white page.

### Rolling back

Vercel keeps every previous deployment. In the Vercel dashboard, open
**Deployments**, find the last good one, and click **Promote to Production**.
Takes about a minute and needs no code changes.


---

## 5. Code layout

```
src/
├── App.jsx              section order — everything else follows from here
├── index.css            design tokens; see the naos-* colours below
├── components/          one file per section of the page
└── data/                ALL CONTENT LIVES HERE
    ├── site.js          name, motto, slogan, contact, SEO
    ├── executives.js    the executive list
    └── events.js        the event list
```

### The rule that keeps this maintainable

> `src/data/*.js` must stay **pure data** — no JSX, no React imports, no
> `fetch()`, no browser APIs.

It looks like an unnecessary restriction. It is the reason the Stage 3 migration
to Astro (see `docs/ROADMAP.md`) is a small job instead of a rewrite. A quick
change that breaks this rule will cost far more later.

### Design tokens

Defined in `src/index.css` under `@theme`. Use these classes, never raw hex:

| Class | Colour | Use for |
|---|---|---|
| `naos-green` | `#14532d` | Navbar, hero, section headings |
| `naos-dark` | `#0f3d23` | Footer, hover states |
| `naos-light` | `#166534` | Accents |
| `naos-gold` | `#eab308` | CTAs, highlights, **dark backgrounds only** |
| `naos-gold-dark` | `#854d0e` | Gold text **on white** |

> ⚠️ **Do not use `naos-gold` for body text on a white background.** It scores
> ~1.9:1 contrast and fails the WCAG AA accessibility standard. Use
> `naos-gold-dark` instead. This is not a preference — it is a defect.

---

## 6. ⚠️ Bootstrap script — Stage 2, read this first

There is no super-admin in this system by design. That creates one problem:

> **Nobody can create the first account, because creating accounts requires
> permissions that only come from having an account.**

The President cannot assign roles until the President has an account.

**Resolution:** the developer creates the first account directly via the
Firebase console, assigns the President role as a custom claim, and then
removes console access from the day-to-day workflow. From that point the
President assigns every other role through the app.

Write this as a real, tested script before Stage 2 ships — do not do it by
hand in the console each time. As of this handover it does not exist yet,
because Stage 2 has not been built.


---

## 7. ⚠️ Security rules — Stage 2, the real permission system

**Role checks in the interface are not security.** Anyone can open browser
developer tools and call any function. The only real enforcement is
**Firestore security rules**.

When Stage 2 is built:

- Test rules against a real emulator before deploying.
- Deny by default. A missing rule means anyone may read the collection.
- Never put a role check only in React. It must exist in the rules too.

This is the single most likely thing to go wrong in Stage 2. Budget real time
for it. Rules that look correct and are subtly wrong are worse than no rules,
because the Executive will believe access is controlled when it is not.

---

## 8. Data protection (NDPA 2023)

- Collect only: name, matric number, level, department, LGA, phone, email.
- **Never collect** identity documents — no passports, birth certificates,
  local government certificates, or student ID photos.
- Members must consent on the registration form.
- Restrict member data to the Gen Sec and President.
- Export a backup to CSV monthly and store it in NAOS-controlled storage.

The site currently holds no personal data at all. That changes at Stage 2.

---

## 9. Known open items

| Item | Status | Owner |
|---|---|---|
| Executive names, levels, departments | **Placeholders** | Gen Sec |
| Executive portraits | Missing — initials fallback in use | Gen Sec |
| Event dates and venues | **Placeholders** | Social / Sport Directors |
| WhatsApp, email, LinkedIn | Temporary — developer's own details | President |
| Motto confirmation | "AJISE BI OYO LAARI" pending Exec sign-off | President |
| About objectives wording | Drafted by developer, needs Exec confirmation | President |
| Constitution PDF | Present | — |
| Custom domain `naosunilorin.org` | Not registered | President |
| GitHub org ownership | **Personal account** | President |
| `og-image.jpg` | 1024×541 — acceptable, 1200×630 is ideal | — |

> **Do not launch with placeholder content.** The executive names and contact
> details must be real. Set `contentStatus: 'verified'` in `site.js` only once
> a human has checked them.

---

## 10. Long-term direction

Read `docs/ROADMAP.md` for the stages and the agreed framework migration
trigger.

Short version: stay on Vite until there are five or more public pages that get
shared as individual links, because WhatsApp previews need static HTML. At that
point move to Astro.

---

## 11. Who to contact

**Developer (build + bugs + features):** ⚠️ fill in

**Tech support channel:** ⚠️ a `tech@` address or a dedicated WhatsApp group
for technical issues only.

**Successor tech lead:** ⚠️ identify a member in a lower level who can take
this over, and train them on:
- How to run and deploy the site
- How to edit `src/data/` without breaking it
- How to roll back a bad deploy
- How the role/permission system works

That person should be able to do all four **before** the developer leaves. If
they cannot, the project has a single point of failure and is not finished.
