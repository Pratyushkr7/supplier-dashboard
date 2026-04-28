# Supplier Workspace

A B2B chemical sourcing intelligence tool — built around a single supplier profile, designed to answer the questions a procurement or sourcing analyst actually asks: *who do I talk to, what do they sell, where are the gaps, and how do they compare?*

This is a working prototype. Drop in real PDFs of supplier catalogues or contact directories and watch the app extract, classify, and analyse them. Everything runs in your browser — no server, no database, no API keys.

![status](https://img.shields.io/badge/status-prototype-amber) ![backend](https://img.shields.io/badge/backend-none-lime) ![cost](https://img.shields.io/badge/cost-%240%2Fmonth-lime)

---

## Why this exists

Sourcing teams typically waste hours every week on three things:

1. **Reading PDFs.** Suppliers send product catalogues and contact directories as PDFs. Someone has to manually transcribe them into a CRM or spreadsheet.
2. **Routing RFQs.** When a buyer asks about a product, who in the supplier's organisation is the right contact? Sales? Technical? In which region?
3. **Spotting weak coverage.** A supplier might have great pricing on solvents but no technical support contact in Europe. You only find that out the hard way.

This prototype tackles all three. It parses real supplier PDFs, scores contact-product fit, surfaces coverage gaps as a heatmap, and benchmarks the supplier against peers.

---

## What it does

### Six functional modules

**Dashboard.** Headline view of one supplier — score out of 100, certifications, benchmarking percentiles, recent RFQ activity, geographic footprint, AI-generated insights, next best actions.

**Contacts Intelligence.** Searchable contact directory with role and region filters. Upload a PDF/CSV/Excel and the parser extracts contacts, classifies their role (Sales / Technical / Procurement / Management), infers their region from email TLD or phone country code, and stamps each row with the source file and page number.

**Product Catalogue.** Same upload pipeline, but for products. Extracts product name, chemical name, category, application, grade, and CAS number. Every Unknown field has a small sparkle button that queries [PubChem](https://pubchem.ncbi.nlm.nih.gov/) (NIH's free chemistry database, no API key needed) to fill in canonical IUPAC names and CAS numbers from a verified source. Falls back to keyword heuristics for category/application when PubChem doesn't apply.

**Recommend.** Type a product name, category, or CAS number. The engine matches it to your loaded contacts and ranks them by fit — weighting role appropriateness, region-vs-product alignment (e.g., coatings in Europe, solvents in MEA, pharma in Americas), decision-maker status, and recent RFQ activity. Confidence scores are tunable with thumb up/down feedback.

**Gap Analysis.** A categories × regions coverage matrix shows where you have products but no regional support — green (covered), amber (single point of failure), red (gap), grey (no SKU). Side panels list contact gaps by region/role and catalogue rows with missing fields.

**Competitive Benchmarking.** Hexakron vs four peer suppliers across pricing, responsiveness, compliance, breadth, and geographic coverage. Percentile bars with peer median markers. Auto-generated strength/weakness lists and negotiation suggestions.

### Document parser

The most engineering-heavy part. Supplier PDFs come in wildly different shapes — Sun Chemical's catalogue is a 4-column-wide table per page with brand-row labels in the left margin; Indorama's directory has rotated `®` superscripts on separate y-coordinates from the product code; SABIC's global directory is a 4-column-of-countries layout that needs to be parsed independently per column; Stéarinerie Dubois has compliance flags (NATRUE, COSMOS, IECIC) that have to be filtered out of chemical descriptions; AACL writes CAS numbers with spaces (`108 - 18 - 9`).

The parser handles all of these by:

- **Detecting page-column layout** before line-grouping. Histogram-based, with a heuristic to distinguish multi-column directories from wide single-table layouts.
- **Anchoring extraction on signals**, not positions. Either a CAS-loose regex match (tolerates internal spaces) or a brand-prefix SKU pattern. About 30 chemical brand prefixes are baked in (DUB, OXITIVE, BURNOCK, SURFONIC, ALKOSYNT, EPICLON, etc.) plus dash-style codes (AC-1218) and spaced codes (MC 6760).
- **Filtering ~25 junk patterns** — page numbers, copyright lines, marketing prose, "About Us" headers, inventory token strings.
- **Document-type detection** — classifies a PDF as `products`, `contacts`, or `unknown` based on weighted signals (CAS density vs email density, table-header keywords, country-section patterns). Refuses to parse a PDF uploaded under the wrong tab.

Tested against 7 real supplier PDFs (Sun Chemical Advanced Materials, Indorama Chemistries for North America, Stéarinerie Dubois Esters, AACL Product List, Alkyl Amines presentation, SABIC Global Directory, Indovinya NA Coatings). Extracts 20–127 clean rows per file with verifiable source-page traceability. The Alkyl Amines slide deck — graphic-heavy, not a real table — falls through to "unknown" gracefully instead of producing garbage.

### AI Suggest

Every Unknown field in the parse-preview drawer has a small lime sparkle button next to it. Clicking it:

1. Calls PubChem's REST API with the product name and chemical name as queries
2. Resolves to a Compound ID, fetches the canonical IUPAC name, molecular formula, and CAS number from the synonyms list
3. Stores the source as `PubChem CID xxxxx` so you know where the value came from
4. For category/application/grade where PubChem doesn't apply, falls back to deterministic keyword inference and tags the source as `Inferred from chemistry keywords`

Verified, attributable, no LLM fabrication, no API keys, no cost.

---

## Stack

- **React 18** + **Vite** — fast dev loop, tiny bundle (72 KB gzipped)
- **Tailwind CSS** — design tokens for the dark theme (`#1a1a1c` background, lime-300 accents only)
- **lucide-react** — icon set
- **PDF.js** — Mozilla's PDF parser, loaded on demand from CDN
- **PapaParse** + **SheetJS** — CSV and Excel parsing, also CDN-loaded on demand
- **PubChem PUG REST** — free public chemistry database, called directly from the browser

No backend. No database. State lives in React. Uploaded files are parsed in the browser and never leave the user's machine.

---

## Running locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Hot reload works.

To build the production bundle:

```bash
npm run build
```

Output goes to `dist/`. Drop that on any static host (Vercel, Netlify, S3, GitHub Pages, your own server) and you're done.

## Deploying to Vercel

The `vercel.json` is pre-configured. If you're a non-coder, see the deployment walkthrough in [README-DEPLOY.md](./README-DEPLOY.md) — covers GitHub signup, drag-and-drop upload, and Vercel import without touching a command line.

If you're comfortable with Git:

```bash
git init && git add . && git commit -m "initial"
gh repo create supplier-workspace --public --source=. --push
# then import in Vercel UI, or:
vercel --prod
```

---

## Project structure

```
supplier-workspace/
├── src/
│   ├── App.jsx              ← the entire app, single file (~2700 lines)
│   ├── main.jsx             ← React root
│   └── index.css            ← Tailwind directives
├── public/
│   └── favicon.svg          ← lime diamond mark
├── index.html               ← entry HTML
├── package.json             ← dependencies
├── vite.config.js           ← build config
├── tailwind.config.js       ← Tailwind config
├── postcss.config.js        ← PostCSS config
├── vercel.json              ← Vercel deployment config
├── README.md                ← this file
└── README-DEPLOY.md         ← non-coder deploy walkthrough
```

`App.jsx` is intentionally a single file. The prototype is meant to be readable end-to-end, easily swapped for production architecture later. The major sections, in order: seed data → parser → helpers → atoms (Card, Pill, Bar) → Sidebar → SupplierHeader → Dashboard → upload pipeline → ContactsModule → CatalogueModule → RecommendModule → GapAnalysisModule → BenchmarkingModule → App root.

---

## What's real vs mocked

To set expectations honestly:

| Component                       | Status                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| PDF/CSV/Excel parsing           | **Real.** Tested on 7 real supplier PDFs.                                                     |
| AI Suggest (PubChem)            | **Real.** Calls live PubChem API, returns verified data with citation.                        |
| Category/application heuristics | **Real.** Deterministic keyword classification.                                               |
| Recommendation engine           | **Real algorithm,** scoring weights and rules are coded, not magic.                           |
| Gap Analysis numbers            | **Real.** Computed from your loaded contacts/products in real time.                           |
| Benchmarking peer data          | **Fixture.** Four hardcoded peer suppliers. Production would need a real peer database feed.  |
| Quotes / RFQ activity           | **Fixture.** Six hardcoded quote rows on the Dashboard.                                       |
| Supplier score (82/100)         | **Fixture.** Production would compute this from platform analytics.                           |
| Geographic footprint percentages| **Fixture.** Static seed values.                                                              |

Everything that's mocked is in clearly-named constants at the top of `App.jsx` (`SUPPLIER`, `QUOTES`, `PEER_SUPPLIERS`, etc.) and ready to be swapped for real data sources.

---

## Known limitations

- **No OCR.** PDFs of scanned documents won't parse — the app only extracts embedded text. Photos of business cards, scanned old catalogues, or image-only PDFs will return "no structured data found."
- **Brand-name SKU edge cases.** Some product codes have trailing qualifiers that get truncated (e.g. `DUB 810 PG M` may parse as `DUB 810 PG`). User can fix in the preview drawer before saving.
- **PubChem coverage.** Proprietary trade names like "BURNOCK AC-1218" aren't in PubChem. The chemistry inference (category/application/grade) still works heuristically.
- **No persistence between sessions.** State lives in React only. Refresh the page and uploaded data is gone. (Production would back this with a database.)
- **Single supplier.** This prototype shows one supplier (Hexakron Specialty Chemicals). Production would have a supplier picker.

---

## Roadmap

If this becomes a real product:

- Persist state to a backend (Postgres + a small API)
- Multi-supplier navigation with a supplier picker
- Real peer benchmarking from platform-wide quote data
- Automated email/calendar integration for the recommended contacts
- Supplier scorecards exported as PDF
- Webhook for inbound RFQs to auto-route via the Recommend engine
- OCR pipeline for scanned PDFs

---

## Credits

PDF parsing powered by [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla). Chemistry data from [PubChem](https://pubchem.ncbi.nlm.nih.gov/) (NIH NLM). Icons from [lucide](https://lucide.dev/). Design language inspired by [Valdera](https://www.valdera.com)'s buyer interface.

## License

MIT — do whatever you want with the code, just don't sue me if it breaks.
