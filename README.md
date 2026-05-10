# Supplier Intelligence Workspace

A decision-grade supplier intelligence cockpit, demoed against **BASF SE** as the reference supplier.

This is a working prototype designed for sourcing teams, category managers, and executive review. It combines a curated knowledge graph of BASF's industrial footprint with PDF parsing, a freeform value-chain canvas, and live competitor benchmarking — all running in your browser, no backend.

![status](https://img.shields.io/badge/status-prototype-amber) ![backend](https://img.shields.io/badge/backend-none-lime) ![cost](https://img.shields.io/badge/cost-%240%2Fmonth-lime)

---

## What this answers

When a sourcing analyst asks: *what does BASF actually make, where do they sit in global chemical chains, and how does any single product compare to alternatives?* — this gives an answer in under thirty seconds.

The hierarchical model is canonical and consistent across every view:

```
Supplier (BASF SE)
  └─ Business Segment   (e.g. Chemicals, Materials, Industrial Solutions, …)
     └─ Chemical        (e.g. Acetone, MDI, Acrylic Dispersion)
        └─ Grade        (e.g. Lupranat M 20 S — Polymeric MDI, NCO 31.5%)
           └─ Application
```

Selecting any entity (chemical, segment, value-chain node) opens a context drawer showing the full cross-linked picture: which BASF division owns it, what BASF grades exist, where it sits upstream/downstream in the chain, and what it's used for.

---

## What it does

### Six functional modules

**Dashboard.** BASF-flavoured headline view — certifications (REACH, ISCC PLUS, Responsible Care), Verbund integration percentile, recent quote activity in EUR, geographic footprint, AI-generated insights aligned to BASF's actual commercial position (energy cost pressure in EU production, battery materials growth, MDI capacity expansion).

**Contacts.** Searchable BASF roster. Upload a PDF/CSV/Excel and the parser extracts contacts, classifies role (Sales / Technical / Procurement / Management), infers region, and stamps each row with source file and page. Manual add form for one-off entries. Hover-to-delete on every row.

**Catalogue.** Hierarchical chemical-first view — only chemical names show at the top level (Acetone, Phenol, Bisphenol A, MDI, …), each with CAS, formula, division, chain stage, and grade count. Click any row to expand the BASF grades inside, with specs and applications. Click "Inspect" to open the full context drawer. Manual add form. Hover-to-delete per grade.

**Segments.** Six BASF operating divisions (Chemicals, Materials, Industrial Solutions, Surface Technologies, Nutrition & Care, Agricultural Solutions) as filter tiles. Each tile shows chemical and grade counts. Click a division to drill into its chemicals; click any chemical to inspect its full context.

**Value Chain.** Freeform canvas — drag, pan, zoom — with one node per chemical, organized into six stage columns (Feedstock → Intermediate → Monomer → Polymer → Additive → Finished). Edges drawn from explicit upstream/downstream relationships in the BASF graph (Phenol→Acetone→Bisphenol A, Ethylene→Ethylene Oxide→{MEG, MEA, Polyols}, Acrylic Acid→{Butyl Acrylate, Acrylic Dispersion, SAP}, MDI→{TPU, Polyurethane Dispersion}, etc.). Click a node to select; double-click to open the context drawer.

**Benchmarking.** Per-product competitor view. For each BASF product, shows competitor companies and their actual product/trade names. Hybrid lookup: curated knowledge base (~50 chemicals, including direct CAS hits for Acetone, MEG, MDI, MEA, Triethanolamine, Acrylic Resin, etc.) plus optional live Google Programmable Search (bring your own free key) for live cross-checking.

---

## How the BASF data is structured

Everything is curated static data inside `App.jsx` (around line 17). No network calls during the demo, no flakiness, no CORS issues.

The graph encodes:

- **6 operating divisions** (post-2024 BASF restructuring)
- **31 representative chemicals** spanning all divisions, with CAS, formula, chain stage, BASF position description, upstream/downstream lists, and applications
- **80+ BASF product grades** with trade names (Lupranat, Lupranol, Acronal, Astacin, Hysorb, Ultramid, Ultradur, Elastollan, Cathoguard, iGloss, Lutavit, Tinosorb, Cetiol, Liberty, Headline, …) and their specs

This is demo-grade — complete enough to convincingly demonstrate BASF's industrial footprint and value chain positioning, not a full data warehouse.

---

## Live competitor search (optional)

The Benchmarking module has a curated competitor database that always works. For live cross-checking, the app supports Google Programmable Search:

1. Open Settings (sidebar footer)
2. Paste your Google API key and Search Engine ID (cx)
3. Both are free — see [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)

Keys are stored in your browser's localStorage only, never sent anywhere except Google's API.

---

## Tech

- React 18 + Vite + Tailwind
- lucide-react icons
- PDF.js for PDF parsing (loaded from CDN at runtime)
- PapaParse + SheetJS for CSV / XLSX parsing (loaded from CDN at runtime)
- No backend, no database, no API keys required for the core experience

Build is around 305 KB minified / 87 KB gzipped.

---

## Running locally

```
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploying

See `README-DEPLOY.md` for a step-by-step Vercel deployment guide aimed at non-developers.
