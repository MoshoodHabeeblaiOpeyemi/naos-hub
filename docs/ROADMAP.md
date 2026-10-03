# NAOS Hub — Internal Roadmap

> **This document is internal.** It is not part of the public website and must
> never be linked from the site. The public site shows what NAOS *is*, not
> what NAOS is *still building*.

---

## Current platform: Vite (React SPA)

Chosen for Stage 0 because it deploys free, loads fast on Nigerian mobile
data, and needs no backend. Adequate while the site is a single public page
plus a future private member dashboard.

---

## Migration trigger: Vite → Astro / Next.js

**We migrate from Vite to a statically-generated framework when NAOS has five
or more public pages that are shared as individual links.**

### Why this rule and not "when traffic grows"

Traffic is the wrong trigger and would have us migrating for no reason.

Our primary distribution channel is **WhatsApp**. WhatsApp's link-preview
crawler **does not execute JavaScript** — it reads the static HTML only. In a
client-rendered app, all page-specific meta tags are injected after load, so a
preview crawler sees the generic site card no matter which link was shared.

Consequence today: one public page, one preview card — correct.

Consequence after Stage 3: sharing a *specific* event, news item or archived
document on WhatsApp would render **the same generic card**, with the wrong
title and no relevant image. The highest-value thing NAOS shares each semester
would look anonymous in the group chat.

Google *does* execute JavaScript, so search indexing largely recovers. WhatsApp
does not. That asymmetry — not SEO rankings — is the reason for this rule.

### Deciding factors (reassess at the trigger, don't treat this list as permanent)

| Factor | Favours staying on Vite | Favours migrating |
|---|---|---|
| Public pages with distinct content | ≤ 4 | ≥ 5 |
| Links shared individually on WhatsApp | Mostly the homepage | Regular event/news/doc links |
| Meta tags that must differ per page | None | Many |
| Public content vs. logged-in app | Nearly all content | Mix of both |
| Team's comfort maintaining the stack | Strong on React | Strong on Astro |

### Keeping the migration cheap

This is the part that actually determines the cost, so it is a rule for the
next tech lead:

> **All site content lives in `src/data/*.js` as plain data — no JSX, no React
> imports, no `fetch()`, no browser APIs.**

Because of that rule, migrating means swapping the data loader and keeping the
components. Without it, the same migration becomes a rewrite of every section.
Do not break this rule while "just making a quick change."

---

## Stages

### Stage 0 — Public landing page *(current)*
One page: hero, about, executives, events, constitution, contact.
Static content only, no login, no database.
**Done when:** a stranger finds the executives and constitution in 10 seconds.

### Stage 1 — Full public site
Multi-page public site (News, Archive, past executives, membership).
GitHub org, custom domain, official email.
**Done when:** PRO I posts an announcement without developer help.

### Stage 2 — Members and roles
Firebase Auth + Firestore. Role-based permissions (President assigns roles).
Registration, RSVP, manual attendance.
**Done when:** PRO II can publish content unsupervised.

> **Engineering warning:** Firestore security rules are the real permission
> system. The role checks in the UI are cosmetic and can be bypassed via
> browser devtools. Budget real time for writing and testing the rules — this
> is the single most likely thing to go wrong in Stage 2.

> **Bootstrap gap (resolve before Stage 2 ships):** no super-admin exists, so
> nobody can create the *first* account. The President cannot assign roles
> until the President has an account. The developer must create the initial
> account directly via the Firebase console, then remove console access from
> the day-to-day workflow. Document this script in
> `docs/DEVELOPER-HANDOVER.md` or the Executive will hit a dead end and have to
> call the developer — the exact dependency we are trying to remove.

### Stage 3 — Archive
Past executives, stewardship reports, handover notes, constitution versions.
Member directory, member-only announcements.
**Likely crosses the migration trigger — re-evaluate the table above.**

### Stage 4 — Only if the system is stable
QR check-in, member map by LGA, certificates of participation.

**Explicitly out of scope until the Executive asks:** dues dashboard, Senate
dashboard, online voting, member-to-member messaging.

---

## Principle

Every feature must justify itself. If it does not serve a member or an
elected officer's job, it does not get built.
