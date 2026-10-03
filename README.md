# NAOS Unilorin Hub

Official website for the **National Association of Oyo Students**, University
of Ilorin Chapter.

Live site: `naosunilorin.org` · Motto: **AJISE BI OYO LAARI**

---

## Start here

| You want to... | Read |
|---|---|
| Change executives, events or contact details | [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md) — no coding needed |
| Run, deploy or fix the site | [`docs/DEVELOPER-HANDOVER.md`](docs/DEVELOPER-HANDOVER.md) |
| Know what is being built and when | [`docs/ROADMAP.md`](docs/ROADMAP.md) |

**PRO I / PRO II: you only need the Content Guide.** Everything you change
lives in `src/data/`.

---

## Quick start (developer)

```bash
npm install
npm run dev      # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the production site into `dist/` |
| `npm run preview` | Serve the built site locally to check it |
| `npm run lint` | Check code style — must pass before committing |

Requires Node 20+. Push to `main` and the site deploys automatically.

---

## How the site is organised

```
src/
├── App.jsx           page sections, in order
├── index.css         design tokens (the naos-* colours)
├── components/       one file per section
└── data/             ← all content lives here
    ├── site.js       name, motto, slogan, contact, SEO
    ├── executives.js executive list
    └── events.js     event list

public/
├── logos/            NAOS and Unilorin crests
├── images/           og-image, executive photos, event photos
└── docs/             constitution PDF
```

**Editing content never means editing a component.** If you need to change a
name, date or phone number, it belongs in `src/data/`.

---

## ⚠️ Content status

The site is currently running on **placeholder content** — sample executive
names and invented event dates — so the layout can be reviewed.

**It is not ready to publish.** Before launch, replace the placeholder
executive names and contact details with the real ones. See
[`docs/DEVELOPER-HANDOVER.md`](docs/DEVELOPER-HANDOVER.md) §9 for the full
list of open items.

---

## Built with

Vite · React 19 · Tailwind CSS v4

Free hosting. No monthly cost beyond the domain.

---

## Contributing

Run `npm run lint` and `npm run build` before every commit. A broken build
deploys a broken site.

```
feat: add November social evening
fix: correct WhatsApp number in contact section
docs: update handover credentials table
```
