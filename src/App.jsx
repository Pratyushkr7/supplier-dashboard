import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, Users, Package, Search, ChevronDown, ChevronRight,
  TrendingUp, Filter, FileText, Sparkles,
  ArrowUpRight, Check, X, ThumbsUp, ThumbsDown,
  Activity, Database, Award, AlertCircle, ChevronLeft,
  MapPin, Tag, Loader2, FileUp, Plus, Star, Beaker,
  Link2, Info, FileCheck2, CircleDot,
  Target, BarChart3, Zap, Wand2, Globe2, ShieldCheck, AlertTriangle
} from "lucide-react";

// ---------------------------------------------------------------------------
// SEED DATA  ────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const SUPPLIER = {
  name: "Hexakron Specialty Chemicals",
  code: "HXK-2841",
  country: "Singapore",
  region: "APAC",
  tier: "Tier 1",
  yearsActive: 12,
  certifications: ["ISO 9001", "REACH", "RoHS", "ISO 14001"],
  score: 82,
};

const BENCHMARKS = [
  { label: "Pricing competitiveness", value: 75, peer: "Better than 75% of suppliers", state: "active" },
  { label: "Specs alignment", value: 62, peer: "—", state: "partial" },
  { label: "Compliance coverage", value: 88, peer: "Top quartile", state: "active" },
  { label: "Responsiveness", value: 71, peer: "vs 24 similar suppliers", state: "active" },
];

const QUOTES = [
  { sku: "HXK-SLV-204", product: "Ethyl Acetate 99.5%", price: "$1,240/MT", delta: -8, status: "Won" },
  { sku: "HXK-CTG-118", product: "Acrylic Resin AR-118", price: "$3,810/MT", delta: 12, status: "Negotiation" },
  { sku: "HXK-SLV-091", product: "MEK Industrial Grade", price: "$1,640/MT", delta: -3, status: "Pending" },
  { sku: "HXK-ADD-432", product: "Defoamer DF-432", price: "$5,290/MT", delta: 4, status: "Pending" },
  { sku: "HXK-CTG-119", product: "Polyurethane Dispersion", price: "$4,120/MT", delta: -6, status: "Won" },
  { sku: "HXK-SLV-061", product: "Toluene Reagent", price: "$980/MT", delta: 18, status: "Lost" },
];

const COMPLETENESS_SUGGESTIONS = [
  "Add technical contacts in EU",
  "Upload missing TDS for AR-118",
  "Verify ISO 14001 certificate",
];

const INCOTERMS = [
  { code: "CPT", value: 38 },
  { code: "FOB", value: 27 },
  { code: "CIF", value: 19 },
  { code: "EXW", value: 11 },
  { code: "DAP", value: 5 },
];

const REGIONS = [
  { name: "APAC", value: 54, accent: true },
  { name: "Europe", value: 22 },
  { name: "MEA", value: 14 },
  { name: "Americas", value: 10 },
];

const AI_INSIGHTS = [
  { tag: "Pricing", text: "Strong pricing in APAC solvents", tone: "good" },
  { tag: "Coverage", text: "Low technical contact coverage in EU", tone: "warn" },
  { tag: "Catalogue", text: "Missing 3 high-demand coating SKUs", tone: "warn" },
  { tag: "Activity", text: "RFQ win rate up 14% this quarter", tone: "good" },
  { tag: "Risk", text: "TDS expired on 2 reagent grades", tone: "bad" },
];

const NEXT_ACTIONS = [
  { text: "Add coatings contact – EU", priority: "High" },
  { text: "Update pricing for top 5 SKUs", priority: "Medium" },
  { text: "Re-confirm CIF terms for MEA", priority: "Low" },
];

const SEED_CONTACTS = [
  { id: "c-1", name: "Wei Chen Lim", role: "Sales", email: "wei.lim@hexakron.sg", region: "APAC", tags: ["Primary Contact", "Decision Maker"], phone: "+65 6789 4521", source: "—" },
  { id: "c-2", name: "Anika Raghavan", role: "Technical", email: "a.raghavan@hexakron.sg", region: "APAC", tags: ["Decision Maker"], phone: "+65 6789 4533", source: "—" },
  { id: "c-3", name: "Marcus Holzer", role: "Sales", email: "m.holzer@hexakron-eu.de", region: "Europe", tags: ["Primary Contact"], phone: "+49 211 884 2210", source: "—" },
  { id: "c-4", name: "Priya Subramaniam", role: "Procurement", email: "priya.s@hexakron.sg", region: "APAC", tags: [], phone: "+65 6789 4502", source: "—" },
  { id: "c-5", name: "Hassan Al-Mutairi", role: "Sales", email: "h.almutairi@hexakron-mea.ae", region: "MEA", tags: ["Decision Maker"], phone: "+971 4 322 5511", source: "—" },
];

const SEED_PRODUCTS = [
  { id: "p-1", name: "Ethyl Acetate 99.5%", chemical: "Ethyl acetate", category: "Solvents", application: "Coatings, Inks", grade: "Industrial", cas: "141-78-6", industry: ["Paints", "Adhesives"], demand: "high", top: true, source: "—" },
  { id: "p-2", name: "Acrylic Resin AR-118", chemical: "Polyacrylate copolymer", category: "Resins", application: "Architectural Coatings", grade: "Premium", cas: "9003-01-4", industry: ["Construction"], demand: "high", top: true, source: "—" },
  { id: "p-3", name: "MEK Industrial Grade", chemical: "Methyl ethyl ketone", category: "Solvents", application: "Cleaning, Coatings", grade: "Industrial", cas: "78-93-3", industry: ["Manufacturing"], demand: "medium", source: "—" },
  { id: "p-4", name: "Defoamer DF-432", chemical: "Polysiloxane defoamer", category: "Additives", application: "Process aid", grade: "Specialty", cas: "Unknown", industry: ["Water treatment"], demand: "medium", source: "—" },
  { id: "p-5", name: "Polyurethane Dispersion", chemical: "Aqueous polyurethane dispersion", category: "Resins", application: "Wood, Leather", grade: "Premium", cas: "Unknown", industry: ["Coatings"], demand: "high", top: true, source: "—" },
];

// ---------------------------------------------------------------------------
// DOCUMENT PARSER v3 — column-aware, type-aware, junk-filtered
// ---------------------------------------------------------------------------
// Strategy:
//   1. Load PDF.js, extract per-page items with x/y/width.
//   2. Cluster items into visual lines by y-coordinate.
//   3. Detect document type by sampling first pages for signals.
//   4. Find header rows ("Product", "Trade Name", "INCI", "CAS", "Email"...).
//   5. Use header x-positions to split lines into columns.
//   6. Filter junk (page numbers, marketing prose, disclaimers, addresses).
//   7. Map columns to schema, leave Unknown for missing fields.
// ---------------------------------------------------------------------------

const CDN = {
  pdfjs:    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfjsWk:  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  papa:     "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js",
  xlsx:     "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
};

const loadScript = (src) => new Promise((res, rej) => {
  if ([...document.scripts].some(s => s.src === src)) return res();
  const s = document.createElement("script");
  s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("Failed: " + src));
  document.head.appendChild(s);
});

async function ensurePdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await loadScript(CDN.pdfjs);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWk;
  return window.pdfjsLib;
}
async function ensurePapa()  { if (window.Papa)  return window.Papa;  await loadScript(CDN.papa); return window.Papa; }
async function ensureXLSX()  { if (window.XLSX)  return window.XLSX;  await loadScript(CDN.xlsx); return window.XLSX; }

// --- regex / atomic patterns ----------------------------------------------

const RX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const RX_CAS_LOOSE = /\b\d{2,7}\s*-\s*\d{2}\s*-\s*\d\b/g;
const RX_CAS_STRICT = /^\d{2,7}-\d{2}-\d$/;
const RX_PHONE_INTL = /(?:\+|00)\d[\d\s().-]{6,18}\d/g;
const normalizeCas = (s) => (s || "").replace(/\s+/g, "").trim();

const BRAND_PREFIXES = [
  "DUB", "OXITIVE", "OXIMULSION", "SURFONIC", "ALKEST", "ALKONAT", "ALKOSYNT",
  "ULTRAMINA", "POGOL", "ULTRAPEG", "UNIMAX", "ULTRATINT", "ULTRASOLVE",
  "GLICENAT", "NEOMINOX", "POLYFROTH",
  "BURNOCK", "WATERSOL", "BLUECRYL", "FINEPLUS", "BLUEPUR", "POLURGREEN",
  "POLURENE", "POLURCAST", "POLURENADD", "EPICLON", "PHENOLITE", "DICNATE",
  "DAILUBE", "VONDIC", "HYDRAN", "CERANATE", "REXIN", "UCOPOL",
];
// Brand-prefix pattern: brand name + a code token. Code can be:
//   - alphanumeric like "AC-1218", "L 24-1", "8201", "DBHG"
//   - optional 1-2 letter qualifier suffix ("DUB 50 P", "SURFONIC L 24-9")
// We deliberately stop after the code so we don't swallow description text
// like "9 EO" in "OXITIVE 7254 9 EO".
const BRAND_RX = new RegExp(
  `\\b(${BRAND_PREFIXES.join("|")})(?:\\s+(?:[A-Z][A-Z0-9-]{0,4}\\s+)?[A-Z0-9]+(?:[-][A-Z0-9]+)?(?:\\s+[A-Z]{1,3})?)?\\b`,
  "g"
);

// --- junk filter ----------------------------------------------------------
// Lines matching any of these patterns are discarded outright.
const JUNK_PATTERNS = [
  /^[\s\d.\-_•·=®©™]+$/,
  /^page\s+\d+/i,
  /^\d+\s*\/\s*\d+$/,
  /copyright|all rights reserved/i,
  /^(disclaimer|note that|please note|although|while)/i,
  /no representation or guarantee|no warranty/i,
  /^https?:\/\/|^www\./i,
  /^Sustainable Development|^Industries Catered|^Major Products|^Thank You/i,
  /^Locations\b|^Certifications\b|^Core Competency|^Technical Expertise/i,
  /^Product Categories|^The Journey|^Revenue|^Protecting/i,
  /^Global (Directory|Customer Base)|^Our (Vision|Strengths|Achievements|Clientele)/i,
  /^About\s+(Us|Indorama|SABIC|Alkyl|the)/i,
  /^Through our|^Targeting|^A partner|^Today's environment/i,
  /^Indorama Ventures is a|^Sun Chemical Corporation/i,
  /^(IECIC|PCPC|CosIng|JSCI|JCIC|JCLS|TGA|NOI|IECSC|TSCA|DSL|NDSL|AICS|ENCS|MITI|ECL|KECI|NECI|PICCS|NZIoC|TCSI)\s/,
  /COSMETIC INVENTORY LIST|OTHER INVENTORY LIST/i,
  /^(NATRUE|COSMOS).*Could be used/i,
];
const isJunkLine = (line) => {
  if (!line || line.length < 4) return true;
  if (line.length > 280) return true;
  return JUNK_PATTERNS.some(p => p.test(line));
};
const isTocLine = (line) => /\.{4,}\s*\d{1,3}\s*$/.test(line);

// Strip compliance/inventory tokens from chemical descriptions
const stripInventoryTokens = (s) =>
  (s || "")
    .replace(/\b(NATRUE|COSMOS|IECIC|PCPC|CosIng|JSCI|JCIC|JCLS|TGA|IECSC|TSCA|DSL|NDSL|AICS|ENCS|MITI|ECL|KECI|NECI|PICCS|NZIoC|TCSI|JSQI|REACH|EP|USP|UK|EU|MEKO|HDI|TDI|MDI|IPDI|PUD|PUR|EO|PO|NV|HLB)\b/g, " ")
    .replace(/[®©™]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

// --- chemistry classifiers ------------------------------------------------

const CATEGORY_RULES = [
  { cat: "Solvents",     kw: ["solvent","ethanol","methanol","acetone","toluene","xylene","ethyl acetate","mek","ipa","isopropanol","hexane","thf","acetonitrile","propyl acetate","butyl acetate"] },
  { cat: "Resins",       kw: ["resin","polyester","acrylic","epoxy","polyurethane","alkyd","latex","dispersion","emulsion","polyol"] },
  { cat: "Pigments",     kw: ["pigment","titanium dioxide","iron oxide","carbon black","chromate"] },
  { cat: "Additives",    kw: ["additive","defoamer","surfactant","stabilizer","absorber","wetting","dispersant","thickener","biocide","coalescent","drier","plasticizer","emulsifier","humectant","degreaser","cleaning agent"] },
  { cat: "Surfactants",  kw: ["surfactant","ethoxylate","alkoxylate","sulfate","sulphate","quaternary","betaine","amine ethoxylate","sorbitan ester","polysorbate"] },
  { cat: "Amines",       kw: ["amine","amino","ethylamine","methylamine","propylamine","ethanolamine","propanediamine"] },
  { cat: "Esters",       kw: ["ester","palmitate","stearate","oleate","myristate","laurate","caprylate","caprate","behenate","isostearate","heptanoate","sebacate","adipate"] },
  { cat: "Reagents",     kw: ["reagent","catalyst","intermediate"] },
  { cat: "Hardeners",    kw: ["hardener","crosslinker","isocyanate","prepolymer"] },
  { cat: "Polymers",     kw: ["polymer","polyethylene","polypropylene","pvc","abs","nylon","polycarbonate","copolymer"] },
];
const APP_RULES = [
  { app: "Coatings",        kw: ["coating","paint","powder coat","topcoat","primer","basecoat"] },
  { app: "Adhesives",       kw: ["adhesive","glue","sealant","laminat","bond"] },
  { app: "Pharma",          kw: ["pharma","pharmaceutical","api","usp","drug"] },
  { app: "Cosmetics",       kw: ["cosmetic","personal care","skincare","haircare","emollient","sunscreen","skin"] },
  { app: "Inks",            kw: ["ink","printing","flexo","gravure"] },
  { app: "Plastics",        kw: ["plastic","polymer","compound"] },
  { app: "Construction",    kw: ["construction","concrete","cement","architectural"] },
  { app: "Cleaning",        kw: ["cleaning","detergent","degreas","i&i"] },
  { app: "Agrochemicals",   kw: ["agrochemical","glyphos","herbicide","pesticide"] },
  { app: "Oilfield",        kw: ["oilfield","drilling","oil & gas","oilfield technologies"] },
  { app: "Textiles",        kw: ["textile","fiber","fibre","leather","fabric"] },
];
const GRADE_RULES = [
  /\b(industrial)\b/i,
  /\b(reagent)\b/i,
  /\b(USP|EP|BP|JP|NF\s+grade|pharmaceutical\s+grade|food\s+grade)\b/i,
  /\b(premium)\b/i,
  /\b(specialty|specialist)\b/i,
  /\b(technical\s+grade)\b/i,
  /\b(rutile|anatase)\b/i,
  /\b(electronic\s+grade|cosmetic\s+grade)\b/i,
];

const detectCategory = (text) => {
  const s = (text || "").toLowerCase();
  for (const r of CATEGORY_RULES) if (r.kw.some(k => s.includes(k))) return r.cat;
  return "Unknown";
};
const detectApplication = (text) => {
  const s = (text || "").toLowerCase();
  const hits = APP_RULES.filter(r => r.kw.some(k => s.includes(k))).map(r => r.app);
  return hits.length ? [...new Set(hits)].slice(0, 2).join(", ") : "Unknown";
};
const detectGrade = (text) => {
  for (const rx of GRADE_RULES) {
    const m = (text || "").match(rx);
    if (m) return m[0].replace(/\s+grade$/i, "").replace(/^./, c => c.toUpperCase());
  }
  return "Unknown";
};

// --- region / role classifiers (contacts) ---------------------------------

const ROLE_RULES = [
  { role: "Technical",   kw: ["technical","r&d","research","scientist","chemist","engineer","lab","formulation","qa","quality"] },
  { role: "Procurement", kw: ["procurement","purchas","buyer","sourcing","supply chain"] },
  { role: "Management",  kw: ["ceo","cfo","coo","founder","president","vp","vice president","director","head of","general manager","country manager","managing director"] },
  { role: "Sales",       kw: ["sales","account","business development","commercial","key account"] },
];
const classifyRole = (text) => {
  const s = (text || "").toLowerCase();
  for (const r of ROLE_RULES) if (r.kw.some(k => s.includes(k))) return r.role;
  return "Unknown";
};

const REGION_BY_TLD = {
  sg:"APAC", jp:"APAC", cn:"APAC", kr:"APAC", in:"APAC", au:"APAC", my:"APAC", th:"APAC", id:"APAC", vn:"APAC", ph:"APAC", hk:"APAC", tw:"APAC",
  de:"Europe", fr:"Europe", it:"Europe", es:"Europe", nl:"Europe", be:"Europe", uk:"Europe", ie:"Europe", se:"Europe", no:"Europe", fi:"Europe", dk:"Europe", pl:"Europe", at:"Europe", ch:"Europe", pt:"Europe", gr:"Europe", cz:"Europe",
  ae:"MEA", sa:"MEA", eg:"MEA", za:"MEA", ng:"MEA", ke:"MEA", ma:"MEA", il:"MEA", tr:"MEA", qa:"MEA", kw:"MEA",
  us:"Americas", ca:"Americas", mx:"Americas", br:"Americas", ar:"Americas", cl:"Americas", co:"Americas",
  com:null, net:null, org:null, io:null,
};
const REGION_BY_PHONE = [
  { rx: /^\+?1\D/,                                region: "Americas" },
  { rx: /^\+?(52|54|55|56|57|58|51|591|595|598)/, region: "Americas" },
  { rx: /^\+?(3[0-9]|4[0-689]|420|421)/,          region: "Europe"   },
  { rx: /^\+?(9[6-7][0-9]|2[0-9]{2}|212|213|216|218)/, region: "MEA" },
  { rx: /^\+?(6[0-9]|81|82|84|86|91|92|95|852|886)/,   region: "APAC" },
];
const REGION_BY_KEYWORD = [
  { rx: /\b(singapore|tokyo|shanghai|beijing|seoul|mumbai|delhi|sydney|jakarta|bangkok|kuala\s*lumpur|hong\s*kong|taipei|manila|hanoi|china|japan|korea|india|thailand|indonesia|vietnam|malaysia|philippines|australia)\b/i, region: "APAC" },
  { rx: /\b(berlin|munich|frankfurt|paris|london|madrid|milan|rome|amsterdam|brussels|stockholm|warsaw|vienna|zurich|dublin|germany|france|italy|spain|netherlands|belgium|switzerland|sweden|poland|austria|denmark|norway|finland|portugal|united\s*kingdom)\b/i, region: "Europe" },
  { rx: /\b(dubai|abu\s*dhabi|riyadh|cairo|johannesburg|lagos|nairobi|casablanca|tel\s*aviv|istanbul|doha|uae|saudi|egypt|south\s*africa|israel|turkey|qatar|kuwait|nigeria|kenya|morocco|ethiopia)\b/i, region: "MEA" },
  { rx: /\b(new\s*york|chicago|houston|los\s*angeles|toronto|mexico\s*city|sao\s*paulo|buenos\s*aires|santiago|bogota|usa|united\s*states|canada|mexico|brazil|argentina|chile|colombia|peru)\b/i, region: "Americas" },
  { rx: /\bapac\b/i, region: "APAC" },
  { rx: /\b(europe|emea)\b/i, region: "Europe" },
  { rx: /\bmea\b/i, region: "MEA" },
  { rx: /\b(americas?|latam|north\s*america)\b/i, region: "Americas" },
];
const classifyRegion = ({ email, phone, text }) => {
  if (email) {
    const tld = email.toLowerCase().split(".").pop();
    if (REGION_BY_TLD[tld]) return REGION_BY_TLD[tld];
  }
  if (phone) for (const p of REGION_BY_PHONE) if (p.rx.test(phone.replace(/\s/g,""))) return p.region;
  if (text)  for (const k of REGION_BY_KEYWORD) if (k.rx.test(text)) return k.region;
  return "Unknown";
};

// --- column-aware PDF reader -----------------------------------------------
// Detects multi-column page layouts (directories/brochures with side-by-side
// sections), processes each column independently. For pages where the table
// itself is single-column-wide, this returns columnCount = 1.

function detectColumnsForPage(items, pageWidth) {
  if (items.length < 30) return [0];
  const binSize = 5;
  const bins = new Map();
  for (const it of items) {
    const b = Math.floor(it.x / binSize);
    bins.set(b, (bins.get(b) || 0) + 1);
  }
  const maxBin = Math.max(...bins.values());
  const sortedBins = [...bins.keys()].sort((a, b) => a - b);
  const starts = [];
  let lastDense = -1000;
  for (const b of sortedBins) {
    if (bins.get(b) >= maxBin * 0.15) {
      const x = b * binSize;
      if (x - lastDense > 80) starts.push(x);
      lastDense = x;
    }
  }
  if (!starts.length) return [0];
  const valid = [];
  for (let i = 0; i < starts.length; i++) {
    const a = starts[i];
    const b = starts[i + 1] ?? pageWidth + 100;
    const cnt = items.filter(it => it.x >= a - 5 && it.x < b - 5).length;
    if (cnt >= items.length * 0.04) valid.push(a);
  }
  // Detect if this is a "wide table" rather than page-columns: when a header-like
  // line at the top contains tokens spanning full width with low column count (≤4),
  // or when row spacing is highly regular across all columns, it's one wide table.
  // Heuristic: if average y-density across columns is similar (sample first 20% of items)
  // we treat as wide-table → return single column.
  if (valid.length >= 2 && valid.length <= 4) {
    // Quick check: compare item count per column. If they differ by < 30%, likely wide table.
    const counts = valid.map((a, i) => {
      const b = valid[i + 1] ?? pageWidth + 100;
      return items.filter(it => it.x >= a - 5 && it.x < b - 5).length;
    });
    const min = Math.min(...counts), max = Math.max(...counts);
    if (max > 0 && min / max > 0.4) {
      // similar density across columns → likely a table
      return [0];
    }
  }
  return valid.length ? valid : [0];
}

const assignToColumn = (item, starts) => {
  for (let i = starts.length - 1; i >= 0; i--) if (item.x >= starts[i] - 8) return i;
  return 0;
};

async function readPdfPages(file) {
  const pdfjs = await ensurePdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const items = tc.items
      .filter(it => it.str && it.str.trim())
      .map(it => ({ str: it.str, x: it.transform[4], y: Math.round(it.transform[5]), w: it.width || 0 }));
    const colStarts = detectColumnsForPage(items, pageWidth);
    const colMaps = colStarts.map(() => new Map());
    for (const it of items) {
      const c = assignToColumn(it, colStarts);
      const yk = Math.round(it.y / 8) * 8;          // 8pt tolerance to merge superscripts
      if (!colMaps[c].has(yk)) colMaps[c].set(yk, []);
      colMaps[c].get(yk).push(it);
    }
    const lines = [];
    for (let c = 0; c < colStarts.length; c++) {
      const sorted = [...colMaps[c].entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([y, arr]) => {
          const ss = arr.sort((a, b) => a.x - b.x);
          return { col: c, y, text: ss.map(s => s.str).join(" ").replace(/\s+/g, " ").trim(), items: ss };
        })
        .filter(l => l.text);
      lines.push(...sorted);
    }
    pages.push({ page: i, lines, columnCount: colStarts.length });
  }
  return pages;
}

// --- document type detector ------------------------------------------------

function detectDocumentType(pages) {
  const sample = pages.slice(0, Math.min(6, pages.length))
                      .flatMap(p => p.lines).map(l => l.text).join("\n");
  const lower = sample.toLowerCase();
  let productScore = 0;
  let contactScore = 0;
  if (/\btrade\s*name\b/i.test(sample))            productScore += 4;
  if (/\binci\s*name\b/i.test(sample))             productScore += 5;
  if (/\bcas\s*(no|number|#)?\b/i.test(sample))    productScore += 4;
  if (/\b(application|grade|hlb|melting point)\b/i.test(sample)) productScore += 2;
  if (/(?:product|catalogue|catalog|product\s*list)/i.test(sample)) productScore += 2;
  productScore += Math.min((sample.match(RX_CAS_LOOSE) || []).length, 8);
  const chemHits = ["resin","solvent","ester","amine","ethoxylate","polymer","surfactant","pigment","alcohol","acid","copolymer","oxide","glycol"]
                     .filter(k => lower.includes(k)).length;
  productScore += chemHits;
  contactScore += Math.min((sample.match(RX_EMAIL) || []).length, 12);
  contactScore += Math.min((sample.match(RX_PHONE_INTL) || []).length, 8);
  if (/\b(p\.?o\.?\s*box|street|avenue|building|floor|tower)\b/i.test(sample)) contactScore += 3;
  const capCountries = (sample.match(/\n[A-Z]{4,20}(?:\s[A-Z]{2,})?\n/g) || []).length;
  contactScore += Math.min(capCountries, 6);
  if (productScore >= 6 && productScore > contactScore * 1.3) return "products";
  if (contactScore >= 6 && contactScore > productScore * 1.3) return "contacts";
  return "unknown";
}

// --- product name detection on a single line ------------------------------

function findProductName(text) {
  // Brand-prefixed name takes priority: "OXITIVE 8201", "DUB 50 P", "BURNOCK AC AC-1218"
  const bm = [...text.matchAll(BRAND_RX)];
  if (bm.length) {
    bm.sort((a, b) => b[0].length - a[0].length);
    return bm[0][0].replace(/[®©™]/g, "").replace(/\s{2,}/g, " ").trim();
  }
  // Dash-style SKU
  const dashMatch = text.match(/\b[A-Z]{2,5}-\d{2,5}(?:[A-Z]{1,3})?\b/);
  if (dashMatch) return dashMatch[0];
  // Spaced SKU
  const spaceMatch = text.match(/\b[A-Z]{2,5}\s\d{2,5}(?:\s[A-Z0-9]{1,4})?\b/);
  if (spaceMatch) return spaceMatch[0].trim();
  return null;
}

// --- product extraction ----------------------------------------------------

function extractProductsFromPages(pages) {
  const rows = [];
  const seen = new Set();
  for (const { page, lines } of pages) {
    for (const ln of lines) {
      if (isJunkLine(ln.text) || isTocLine(ln.text)) continue;

      // Look for CAS first (most reliable)
      const casMatches = [...ln.text.matchAll(RX_CAS_LOOSE)];
      const cas = casMatches[0] ? normalizeCas(casMatches[0][0]) : null;

      let name = null;
      let chemical = "";

      if (cas) {
        // CAS-anchored: full text before CAS as name, after as application
        const before = ln.text.split(casMatches[0][0])[0].trim();
        if (before.length < 3) continue;
        name = before
          .replace(/[®©™]/g, "")
          .replace(/\s+\d+%?\s*$/, "")
          .replace(/\s{2,}/g, " ")
          .trim();
        if (name.length > 80) name = name.slice(0, 80).trim();
        const after = ln.text.split(casMatches[0][0])[1] || "";
        chemical = stripInventoryTokens(after);
      } else {
        const sku = findProductName(ln.text);
        if (!sku) continue;
        const desc = ln.text.replace(sku, "").replace(/\s{2,}/g, " ").trim();
        if (desc.length < 10) continue;
        if (!/[a-z]{4,}/.test(desc)) continue;
        // Skip all-caps section headers like "POLYISOCYANATE PREPOLYMERS"
        if (/^[A-Z\s]{15,}$/.test(ln.text.trim())) continue;
        name = sku;
        chemical = stripInventoryTokens(desc).slice(0, 140);
      }
      if (!name || name.length < 2) continue;
      if (/^[\s.,;:•·\-—\d]+$/.test(name)) continue;

      const key = (name + "|" + (cas || "")).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      // Auto-classify category/application/grade only from row's own text
      const rowText = `${name} ${chemical}`;
      const category    = detectCategory(rowText);
      const application = detectApplication(chemical || rowText);
      const grade       = detectGrade(chemical || rowText);

      rows.push({
        name,
        chemical: chemical || "Unknown",
        category,
        application,
        grade,
        cas: cas || "Unknown",
        page,
      });
    }
  }
  return rows;
}

// --- contact extraction ----------------------------------------------------

const PERSON_NAME_RX = /^([A-ZÀ-Ý][a-zà-ÿ'’\-]+(?:[\s'-][A-ZÀ-Ý][a-zà-ÿ'’\-]+){1,3})$/;
const ROLE_LIKE = /\b(sales|technical|procurement|management|director|manager|engineer|chemist|specialist|coordinator|head|chief|ceo|cfo|coo|cto|vp|president|founder|owner|account|business|development|operations|export|import|key|senior|junior|lead|principal|associate|assistant|executive|country|regional|global|primary|customer|service|support|quality|research|laboratory|production|supply|chain|logistics|finance|hr|administration)\b/i;
const COMPANY_LIKE = /\b(ltd|inc|gmbh|pte|co\.|llc|corp|company|corporation|group|industries|chemicals|technologies|solutions|holdings|enterprises|sabic|indorama|ventures|sdn|bhd|sarl|kft|spa)\b/i;
function looksLikePersonName(line) {
  if (!line) return false;
  if (line.length > 60) return false;
  if (ROLE_LIKE.test(line)) return false;
  if (COMPANY_LIKE.test(line)) return false;
  if (/\d/.test(line)) return false;
  return PERSON_NAME_RX.test(line.trim());
}

function extractContactsFromPages(pages) {
  const rows = [];
  const seen = new Set();
  for (const { page, lines } of pages) {
    let currentRegion = null;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const text = ln.text;
      // detect ALL-CAPS region/country header
      if (/^[A-Z][A-Z\s.&-]{3,40}$/.test(text) && !RX_EMAIL.test(text)) {
        RX_EMAIL.lastIndex = 0;
        const r = classifyRegion({ text });
        if (r !== "Unknown") currentRegion = r;
      }
      RX_EMAIL.lastIndex = 0;
      const emails = text.match(RX_EMAIL) || [];
      for (const email of emails) {
        const ctxLines = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 3))
                              .filter(l => l.col === ln.col)         // stay in same column
                              .map(l => l.text);
        const ctx = ctxLines.join(" ");
        // name: scan upward in same column
        let name = "Unknown";
        for (let j = i; j >= Math.max(0, i - 4); j--) {
          if (lines[j].col !== ln.col) continue;
          const t = lines[j].text.replace(email, "").trim();
          if (looksLikePersonName(t)) {
            name = t.match(PERSON_NAME_RX)[1];
            break;
          }
        }
        const phoneMatch = ctx.replace(RX_EMAIL, " ").match(RX_PHONE_INTL);
        const phone = phoneMatch ? phoneMatch[0].trim() : "Unknown";
        const role = classifyRole(ctx);
        const region = classifyRegion({ email, phone: phone !== "Unknown" ? phone : null, text: ctx })
                     || currentRegion || "Unknown";
        const key = email.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          name, role,
          email: email.toLowerCase(),
          phone, region: region || "Unknown",
          tags: [], page,
        });
      }
    }
  }
  return rows;
}

// --- top-level dispatch ---------------------------------------------------

async function parsePdf(file, expectedKind) {
  const pages = await readPdfPages(file);
  const detected = detectDocumentType(pages);

  if (detected === "unknown") {
    throw new Error(
      `Couldn't determine if this is a contacts directory or a product catalogue. ` +
      `Please ensure the PDF contains a clear table with header rows.`
    );
  }
  if (expectedKind === "contacts" && detected === "products") {
    throw new Error(
      `This PDF looks like a product catalogue, not a contacts file. ` +
      `Please upload it under "Catalogue" instead.`
    );
  }
  if (expectedKind === "catalogue" && detected === "contacts") {
    throw new Error(
      `This PDF looks like a contacts directory, not a product catalogue. ` +
      `Please upload it under "Contacts" instead.`
    );
  }

  return detected === "products"
    ? extractProductsFromPages(pages)
    : extractContactsFromPages(pages);
}

// --- CSV / XLSX (unchanged from v2, kept simple) --------------------------

const FIELD_MAP_CONTACTS = {
  name:   ["name","full name","contact","contact name","person"],
  email:  ["email","e-mail","mail"],
  phone:  ["phone","mobile","tel","telephone","contact number"],
  role:   ["role","title","job title","position","designation","function"],
  region: ["region","location","country","territory","area"],
};
const FIELD_MAP_PRODUCTS = {
  name:        ["product","trade name","name","product name","item","description","brand"],
  chemical:    ["chemical","chemical description","chemical name","inci","inci name","short name"],
  category:    ["category","type","class","family"],
  application: ["application","applications","use","uses","function","functionalities","main feature"],
  grade:       ["grade","quality"],
  cas:         ["cas","cas no","cas number","cas#"],
};

function pickField(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const k = keys.find(kk => kk.toLowerCase().trim() === c);
    if (k && row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  for (const c of candidates) {
    const k = keys.find(kk => kk.toLowerCase().includes(c));
    if (k && row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  return "";
}

async function parseTabular(file, kind) {
  const ext = file.name.toLowerCase().split(".").pop();
  let data = [];
  if (ext === "csv") {
    const Papa = await ensurePapa();
    const text = await file.text();
    data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
  } else if (ext === "xlsx" || ext === "xls") {
    const XLSX = await ensureXLSX();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  if (kind === "contacts") {
    const out = [];
    data.forEach((row, idx) => {
      const name  = pickField(row, FIELD_MAP_CONTACTS.name);
      const email = pickField(row, FIELD_MAP_CONTACTS.email);
      if (!name && !email) return;
      const phone = pickField(row, FIELD_MAP_CONTACTS.phone) || "Unknown";
      const roleTxt = pickField(row, FIELD_MAP_CONTACTS.role);
      const regionTxt = pickField(row, FIELD_MAP_CONTACTS.region);
      out.push({
        name:  name || "Unknown",
        email: email || "Unknown",
        phone,
        role:  roleTxt ? classifyRole(roleTxt) : "Unknown",
        region: regionTxt
          ? (classifyRegion({ text: regionTxt }) !== "Unknown" ? classifyRegion({ text: regionTxt }) : regionTxt)
          : classifyRegion({ email, phone }),
        tags: [],
        page: idx + 1,
      });
    });
    return out;
  }

  // products
  const out = [];
  data.forEach((row, idx) => {
    const name = pickField(row, FIELD_MAP_PRODUCTS.name);
    if (!name) return;
    const chemical    = pickField(row, FIELD_MAP_PRODUCTS.chemical);
    const cas         = pickField(row, FIELD_MAP_PRODUCTS.cas);
    const category    = pickField(row, FIELD_MAP_PRODUCTS.category);
    const application = pickField(row, FIELD_MAP_PRODUCTS.application);
    const grade       = pickField(row, FIELD_MAP_PRODUCTS.grade);
    const allText = JSON.stringify(row);
    out.push({
      name,
      chemical:    chemical || "Unknown",
      category:    category || detectCategory(allText),
      application: application || detectApplication(allText),
      grade:       grade || detectGrade(allText),
      cas:         cas && /^\d{2,7}-\d{2}-\d$/.test(cas.trim()) ? cas.trim() : (normalizeCas(allText.match(RX_CAS_LOOSE)?.[0] || "") || "Unknown"),
      page: idx + 1,
    });
  });
  return out;
}

async function parseContactsFile(file) {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "pdf")                          return await parsePdf(file, "contacts");
  if (["csv","xlsx","xls"].includes(ext))     return await parseTabular(file, "contacts");
  throw new Error(`Unsupported file type: .${ext}. Please upload PDF, CSV or Excel.`);
}

async function parseCatalogueFile(file) {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "pdf")                          return await parsePdf(file, "catalogue");
  if (["csv","xlsx","xls"].includes(ext))     return await parseTabular(file, "products");
  throw new Error(`Unsupported file type: .${ext}. Please upload PDF, CSV or Excel.`);
}

// --- PubChem AI suggest (verified source) ---------------------------------

async function pubchemLookup(name) {
  // 1) Resolve compound name → CIDs
  const url1 = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`;
  let cid;
  try {
    const r = await fetch(url1);
    if (!r.ok) return null;
    const j = await r.json();
    cid = j?.IdentifierList?.CID?.[0];
  } catch { return null; }
  if (!cid) return null;

  // 2) Get IUPAC name + formula
  const url2 = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula/JSON`;
  let iupac, formula;
  try {
    const r = await fetch(url2);
    if (r.ok) {
      const j = await r.json();
      iupac   = j?.PropertyTable?.Properties?.[0]?.IUPACName;
      formula = j?.PropertyTable?.Properties?.[0]?.MolecularFormula;
    }
  } catch {}

  // 3) Get synonyms → CAS (synonyms list contains CAS-like strings near top)
  let cas = null;
  try {
    const r = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
    if (r.ok) {
      const j = await r.json();
      const syns = j?.InformationList?.Information?.[0]?.Synonym || [];
      const casRx = /^\d{2,7}-\d{2}-\d$/;
      cas = syns.find(s => casRx.test(s)) || null;
    }
  } catch {}

  return {
    cid,
    chemical: iupac || null,
    cas: cas,
    formula: formula || null,
    source: `PubChem CID ${cid}`,
  };
}

// Heuristic enrichment for category / application / grade
function heuristicEnrich(name, chemical) {
  const text = `${name} ${chemical || ""}`.toLowerCase();
  return {
    category:    detectCategory(text),
    application: detectApplication(text),
    grade:       detectGrade(text),
  };
}


// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const cx = (...c) => c.filter(Boolean).join(" ");

const statusStyle = (s) => ({
  Won: "text-lime-300 bg-lime-300/10 border-lime-300/20",
  Lost: "text-zinc-400 bg-zinc-800/60 border-zinc-700",
  Pending: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  Negotiation: "text-sky-300 bg-sky-300/10 border-sky-300/20",
}[s]);

const toneDot = (t) => ({
  good: "bg-lime-300",
  warn: "bg-amber-300",
  bad: "bg-rose-300",
}[t]);

function mapProductToContacts(product, contacts) {
  if (!product) return [];
  return contacts.map(c => {
    const reasons = [];
    let score = 0;

    if (c.role === "Technical") { score += 30; reasons.push(`Technical lead — ${product.category}`); }
    if (c.role === "Sales")     { score += 24; reasons.push(`Sales owner — ${product.category}`); }
    if (c.role === "Procurement") score += 8;
    if (c.role === "Management") {
      score += 16;
      if (c.tags.includes("Decision Maker")) reasons.push("Approver on strategic SKUs");
    }

    if (c.tags.includes("Decision Maker")) score += 14;
    if (c.tags.includes("Primary Contact")) score += 8;

    if (c.region === "APAC") score += 10;
    if (c.region === "Europe" && /coating|resin|pigment/i.test(product.category + " " + product.application)) {
      score += 14; reasons.push("EU coatings demand");
    }
    if (c.region === "MEA" && /solvent/i.test(product.category)) {
      score += 10; reasons.push("MEA solvent buyers");
    }
    if (c.region === "Americas" && /pharma|reagent/i.test(product.application + " " + product.grade)) {
      score += 12; reasons.push("Americas pharma fit");
    }

    const rfqActivity = (c.id.charCodeAt(c.id.length - 1) % 5);
    if (rfqActivity >= 3) { score += 10; reasons.push(`${rfqActivity} RFQs last 30d`); }

    const confidence = Math.min(96, Math.max(28, score));

    const chips = [];
    chips.push({ label: `${product.category} match`, kind: "primary" });
    if (rfqActivity >= 3) chips.push({ label: "Recent RFQ", kind: "muted" });
    if (c.region === "APAC" || (c.region === "Europe" && /coating|resin/i.test(product.category))) {
      chips.push({ label: "Region fit", kind: "muted" });
    }
    if (c.role === "Technical") chips.push({ label: "Technical", kind: "muted" });

    return { ...c, confidence, chips, reasons: reasons.slice(0, 3) };
  })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// SHARED ATOMS
// ---------------------------------------------------------------------------

function Card({ title, subtitle, action, children, className }) {
  return (
    <div className={cx("rounded-2xl bg-[#1c1c1e] border border-zinc-800/80 p-5", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-[13px] font-medium text-zinc-100">{title}</h3>}
            {subtitle && <p className="text-[11.5px] text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Pill({ children, tone = "neutral", className }) {
  const tones = {
    neutral: "bg-zinc-800 text-zinc-200 border-zinc-700",
    accent: "bg-lime-300/10 text-lime-300 border-lime-300/20",
    warn: "bg-amber-300/10 text-amber-300 border-amber-300/20",
    bad: "bg-rose-300/10 text-rose-300 border-rose-300/20",
    muted: "bg-zinc-900 text-zinc-400 border-zinc-800",
  };
  return (
    <span className={cx(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] uppercase tracking-wider border",
      tones[tone], className
    )}>{children}</span>
  );
}

function Bar({ value, tone = "accent", className }) {
  const fill = tone === "accent" ? "bg-lime-300" : tone === "muted" ? "bg-zinc-600" : "bg-zinc-500";
  return (
    <div className={cx("h-1.5 rounded-full bg-zinc-800 overflow-hidden", className)}>
      <div className={cx("h-full rounded-full", fill)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function FilterChip({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252528] border border-zinc-800 text-[12px] hover:border-zinc-700"
      >
        <span className="text-zinc-500 text-[10.5px] uppercase tracking-wider">{label}</span>
        <span className="text-zinc-200">{value}</span>
        <ChevronDown className={cx("w-3 h-3 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-20 min-w-[150px] rounded-lg bg-[#1c1c1e] border border-zinc-800 shadow-xl py-1">
            {options.map(o => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={cx("w-full text-left px-3 py-1.5 text-[12px] hover:bg-zinc-800/60 flex items-center justify-between",
                  o === value ? "text-zinc-100" : "text-zinc-400")}
              >
                {o}
                {o === value && <Check className="w-3 h-3 text-lime-300" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PercentileBar({ value, label, peer, state = "active" }) {
  const muted = state === "partial";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-zinc-300">{label}</span>
        <span className="text-[11px] text-zinc-500 tabular-nums">{muted ? "—" : `${value}%`}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="absolute inset-y-0 left-[40%] right-[40%] bg-zinc-700/60" />
        <div
          className={cx("absolute inset-y-0 left-0 rounded-full", muted ? "bg-zinc-700" : "bg-lime-300")}
          style={{ width: `${value}%` }}
        />
        {!muted && (
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-100"
               style={{ left: `calc(${value}% - 4px)` }} />
        )}
      </div>
      <div className="text-[11px] text-zinc-500">{peer}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SIDEBAR
// ---------------------------------------------------------------------------

function Sidebar({ active, onChange, productCount, contactCount }) {
  const items = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "contacts", label: "Contacts", icon: Users, badge: contactCount },
    { id: "catalogue", label: "Catalogue", icon: Package, badge: productCount },
    { id: "recommend", label: "Recommend", icon: Sparkles },
    { id: "gaps", label: "Gap Analysis", icon: AlertCircle },
    { id: "benchmark", label: "Benchmarking", icon: Activity },
  ];

  return (
    <aside className="w-[220px] shrink-0 border-r border-zinc-800/80 bg-[#161618] flex flex-col">
      <div className="px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-lime-300 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#161618]" style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }} />
          </div>
          <div>
            <div className="text-[14px] font-medium text-zinc-100 tracking-tight">Valdera</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Sourcing</div>
          </div>
        </div>
      </div>

      <nav className="px-3 space-y-0.5">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Workspace</div>
        {items.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors",
              active === id ? "bg-zinc-800/80 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
            )}
          >
            <Icon className={cx("w-4 h-4", active === id ? "text-lime-300" : "text-zinc-500")} strokeWidth={1.75} />
            <span className="flex-1 text-left">{label}</span>
            {badge !== undefined && (
              <span className={cx("text-[10px] px-1.5 py-0.5 rounded-md tabular-nums",
                active === id ? "bg-lime-300/15 text-lime-300" : "bg-zinc-800 text-zinc-500")}>{badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-zinc-800 p-3 bg-[#1c1c1e]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-300" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Live data</span>
          </div>
          <div className="text-[11px] text-zinc-400">Synced 2 min ago</div>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// SUPPLIER HEADER
// ---------------------------------------------------------------------------

function SupplierHeader({ supplier }) {
  return (
    <div className="border-b border-zinc-800/80 bg-[#161618]">
      <div className="px-8 py-6">
        <button className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 uppercase tracking-widest mb-3">
          <ChevronLeft className="w-3 h-3" />All Suppliers
        </button>

        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 font-medium text-xl">H</div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[24px] font-medium text-zinc-50 tracking-tight">{supplier.name}</h1>
                <Pill tone="accent">{supplier.tier}</Pill>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-zinc-500">
                <span>{supplier.code}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{supplier.country} • {supplier.region}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{supplier.yearsActive} yrs active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-1.5 max-w-md justify-end">
              {supplier.certifications.map(c => <Pill key={c} tone="muted">{c}</Pill>)}
            </div>
            <div className="pl-4 border-l border-zinc-800">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Score</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-light text-zinc-100 tabular-nums">{supplier.score}</span>
                <span className="text-[11px] text-zinc-600">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

function Dashboard({ contacts, products }) {
  const completeness = useMemo(() => {
    const parts = [
      { label: "Company info", value: 95 },
      { label: "Contacts", value: Math.min(100, 30 + contacts.length * 7) },
      { label: "Product catalogue", value: Math.min(100, 30 + products.length * 7) },
      { label: "Documents", value: 71 },
    ];
    const total = Math.round(parts.reduce((s, p) => s + p.value, 0) / parts.length);
    return { total, parts };
  }, [contacts.length, products.length]);

  return (
    <div className="grid grid-cols-12 gap-5 p-8">
      <div className="col-span-12 lg:col-span-8">
        <Card title="Benchmarking" subtitle="Based on platform quote data • vs 24 similar suppliers"
              action={<Pill tone="muted">Last 90 days</Pill>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {BENCHMARKS.map(b => <PercentileBar key={b.label} {...b} />)}
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-4 lg:row-span-2">
        <Card title="AI Insights" subtitle="Updated 2 min ago"
              action={<Sparkles className="w-4 h-4 text-lime-300" />}
              className="h-full">
          <div className="space-y-1">
            {AI_INSIGHTS.map((i, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-zinc-800/40">
                <div className={cx("mt-1.5 w-1 h-1 rounded-full shrink-0", toneDot(i.tone))} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">{i.tag}</div>
                  <div className="text-[12.5px] text-zinc-200 leading-snug">{i.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Next best actions</div>
            <div className="space-y-1.5">
              {NEXT_ACTIONS.map((a, idx) => (
                <button key={idx} className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#252528] hover:bg-zinc-800 border border-zinc-800 text-left">
                  <span className="text-[12px] text-zinc-200">{a.text}</span>
                  <span className="flex items-center gap-2">
                    <span className={cx("text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                      a.priority === "High" && "text-lime-300 bg-lime-300/10",
                      a.priority === "Medium" && "text-amber-300 bg-amber-300/10",
                      a.priority === "Low" && "text-zinc-400 bg-zinc-800/80")}>{a.priority}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <Card title="Commercial Activity" subtitle={`${QUOTES.length} active RFQs`}
              action={<button className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 uppercase tracking-widest">View all<ChevronRight className="w-3 h-3" /></button>}>
          <div className="overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="text-left pb-3 font-normal">SKU</th>
                  <th className="text-left pb-3 font-normal">Product</th>
                  <th className="text-right pb-3 font-normal">Quoted</th>
                  <th className="text-right pb-3 font-normal">vs Median</th>
                  <th className="text-right pb-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {QUOTES.map(q => (
                  <tr key={q.sku} className="hover:bg-zinc-800/30">
                    <td className="py-3 text-[11px] text-zinc-500 tabular-nums">{q.sku}</td>
                    <td className="py-3 text-zinc-200">{q.product}</td>
                    <td className="py-3 text-right text-zinc-300 tabular-nums">{q.price}</td>
                    <td className={cx("py-3 text-right tabular-nums",
                      q.delta < 0 ? "text-lime-300" : q.delta > 10 ? "text-rose-300" : "text-amber-300")}>
                      {q.delta > 0 ? "+" : ""}{q.delta}%
                    </td>
                    <td className="py-3 text-right">
                      <span className={cx("inline-block px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border", statusStyle(q.status))}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <Card title="Data Completeness" subtitle={`${completeness.total}% complete`}>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#a3e635" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray={`${(completeness.total / 100) * 263.9} 263.9`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-light text-zinc-100 tabular-nums">{completeness.total}<span className="text-[11px] text-zinc-500">%</span></span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {completeness.parts.map(p => (
                <div key={p.label}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[11.5px] text-zinc-300">{p.label}</span>
                    <span className="text-[10px] text-zinc-500 tabular-nums">{p.value}%</span>
                  </div>
                  <Bar value={p.value} />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Suggestions</div>
            <div className="space-y-1.5">
              {COMPLETENESS_SUGGESTIONS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-zinc-300">
                  <Plus className="w-3 h-3 text-lime-300 shrink-0" />{s}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <Card title="Logistics" subtitle="Incoterms distribution">
          <div className="space-y-3">
            {INCOTERMS.map(t => (
              <div key={t.code}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11.5px] uppercase tracking-wider text-zinc-300">{t.code}</span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">{t.value}%</span>
                </div>
                <Bar value={t.value * 2.5} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Shipping regions</div>
            <WorldMap />
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <Card title="Geographic Footprint" subtitle="Volume share by region">
          <div className="space-y-3.5">
            {REGIONS.map(r => (
              <div key={r.name}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cx("w-1.5 h-1.5 rounded-full", r.accent ? "bg-lime-300" : "bg-zinc-600")} />
                    <span className="text-[12px] text-zinc-300">{r.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 tabular-nums">{r.value}%</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={cx("h-3 flex-1 rounded-sm",
                      i < Math.round(r.value / 5)
                        ? r.accent ? "bg-lime-300" : "bg-zinc-500"
                        : "bg-zinc-800")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-zinc-800 grid grid-cols-3 gap-3">
            {[
              { label: "Total volume", value: "12.4k MT" },
              { label: "Lead time", value: "18 d" },
              { label: "On-time", value: "94%" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</div>
                <div className="text-[14px] text-zinc-100 tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorldMap() {
  const dots = [
    { x: 18, y: 35, active: false }, { x: 30, y: 55, active: false },
    { x: 48, y: 30, active: true },  { x: 56, y: 45, active: true },
    { x: 72, y: 38, active: true },  { x: 78, y: 30, active: true },
    { x: 75, y: 60, active: false },
  ];
  return (
    <div className="relative aspect-[2/1] w-full rounded-lg bg-[#141416] border border-zinc-800 overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
          {Array.from({ length: 25 }).map((_, x) =>
            Array.from({ length: 12 }).map((_, y) => (
              <circle key={`${x}-${y}`} cx={x * 4 + 2} cy={y * 4 + 2} r="0.4" fill="#27272a" />
            ))
          )}
        </svg>
      </div>
      {dots.map((d, i) => (
        <div key={i}
             className={cx("absolute rounded-full",
               d.active ? "w-2 h-2 bg-lime-300" : "w-1.5 h-1.5 bg-zinc-700")}
             style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)" }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UPLOAD PIPELINE
// ---------------------------------------------------------------------------

function UploadButton({ label, onFile, disabled }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file"
             accept=".pdf,.csv,.xlsx,.xls"
             className="hidden"
             onChange={(e) => {
               const f = e.target.files?.[0];
               if (f) onFile(f);
               e.target.value = "";
             }} />
      <button
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className={cx("flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-colors",
          disabled ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                   : "bg-lime-300 text-zinc-900 hover:bg-lime-200")}
      >
        <FileUp className="w-3.5 h-3.5" />{label}
      </button>
    </>
  );
}

function ParsePipeline({ stage }) {
  if (!stage) return null;
  const steps = [
    { id: "ocr", label: "Read" },
    { id: "extract", label: "Extract fields" },
    { id: "dedupe", label: "Deduplicate" },
    { id: "ready", label: "Preview ready" },
  ];
  const currentIdx = steps.findIndex(s => s.id === stage);
  return (
    <Card className="!p-3.5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {stage === "ready"
            ? <FileCheck2 className="w-4 h-4 text-lime-300" />
            : <Loader2 className="w-4 h-4 text-lime-300 animate-spin" />}
          <span className="text-[11px] uppercase tracking-widest text-zinc-300">
            {stage === "ready" ? "Preview ready — review before saving" : "Parsing document"}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {steps.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <React.Fragment key={s.id}>
                <div className={cx("flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10.5px]",
                  done && "border-lime-300/30 bg-lime-300/10 text-lime-300",
                  active && "border-zinc-700 bg-zinc-800 text-zinc-200",
                  !done && !active && "border-zinc-800 bg-[#252528] text-zinc-500")}>
                  {done ? <Check className="w-3 h-3" />
                    : active && stage !== "ready" ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CircleDot className="w-3 h-3" />}
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <div className={cx("h-px w-4", done ? "bg-lime-300/30" : "bg-zinc-800")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function PreviewDrawer({ open, kind, fileName, sourceLabel, parsedRows, parseError, parsing, onConfirm, onCancel }) {
  const [rows, setRows] = useState([]);
  const [stage, setStage] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (parsing) {
      setStage("ocr");
      setRows([]);
      return;
    }
    if (parseError) {
      setStage("error");
      setRows([]);
      return;
    }
    // parsing finished — animate through remaining stages briefly so the user
    // sees the pipeline complete, then show real rows.
    setStage("extract");
    const t1 = setTimeout(() => setStage("dedupe"), 350);
    const t2 = setTimeout(() => {
      setStage("ready");
      setRows((parsedRows || []).map((r, i) => ({ ...r, _id: i, _include: true })));
    }, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open, parsing, parseError, parsedRows]);

  if (!open) return null;

  const includedCount = rows.filter(r => r._include).length;
  const toggleInclude = (id) => setRows(rs => rs.map(r => r._id === id ? { ...r, _include: !r._include } : r));
  const updateField = (id, key, val) => setRows(rs => rs.map(r => r._id === id ? { ...r, [key]: val } : r));
  const isContacts = kind === "contacts";

  const handleSuggest = async (id, field) => {
    setRows(rs => rs.map(r => r._id === id ? { ...r, _suggesting: field } : r));
    try {
      const row = rows.find(r => r._id === id);
      if (!row) return;
      // Try PubChem first using product name + chemical
      const queries = [row.chemical, row.name].filter(q => q && q !== "Unknown");
      let pub = null;
      for (const q of queries) {
        pub = await pubchemLookup(q);
        if (pub) break;
      }
      const heur = heuristicEnrich(row.name, row.chemical);
      let value = null, source = "";
      if (field === "cas") {
        if (pub?.cas) { value = pub.cas; source = pub.source; }
      } else if (field === "chemical") {
        if (pub?.chemical) { value = pub.chemical; source = pub.source; }
      } else if (field === "category") {
        value = heur.category !== "Unknown" ? heur.category : null;
        source = "Inferred from chemistry keywords";
      } else if (field === "application") {
        value = heur.application !== "Unknown" ? heur.application : null;
        source = "Inferred from chemistry keywords";
      } else if (field === "grade") {
        value = heur.grade !== "Unknown" ? heur.grade : null;
        source = "Inferred from chemistry keywords";
      }
      if (value) {
        setRows(rs => rs.map(r => r._id === id
          ? { ...r, [field]: value, _suggesting: null, _sources: { ...(r._sources || {}), [field]: source } }
          : r));
      } else {
        setRows(rs => rs.map(r => r._id === id ? { ...r, _suggesting: null } : r));
      }
    } catch {
      setRows(rs => rs.map(r => r._id === id ? { ...r, _suggesting: null } : r));
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="ml-auto relative w-full max-w-[860px] bg-[#161618] border-l border-zinc-800 flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Preview parse</div>
            <h3 className="text-[15px] font-medium text-zinc-100 truncate">{fileName}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Pill tone="muted"><FileText className="w-3 h-3" />{sourceLabel}</Pill>
              {stage === "ready" && (
                <span className="text-[11px] text-zinc-500">{includedCount} of {rows.length} rows selected</span>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-zinc-800">
          <ParsePipeline stage={stage === "error" ? null : stage} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {stage === "error" ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 gap-3 text-center">
              <AlertCircle className="w-6 h-6 text-rose-300" />
              <div className="text-[13px] text-zinc-200">Could not parse this file</div>
              <div className="text-[12px] text-zinc-500 max-w-md">{parseError}</div>
            </div>
          ) : stage !== "ready" ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 text-[12px] uppercase tracking-widest gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-lime-300" />
              {parsing ? "Reading document…" : "Processing…"}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 gap-3 text-center">
              <Info className="w-6 h-6 text-zinc-500" />
              <div className="text-[13px] text-zinc-200">No structured data found</div>
              <div className="text-[12px] text-zinc-500 max-w-md">
                The document parsed but no {isContacts ? "contacts" : "products"} could be extracted.
                {isContacts ? " Make sure the file contains email addresses or a contact table."
                            : " Make sure the file contains product names, CAS numbers, or a catalogue table."}
              </div>
            </div>
          ) : isContacts ? (
            <ContactPreviewTable rows={rows} onToggle={toggleInclude} onEdit={updateField} />
          ) : (
            <ProductPreviewTable rows={rows} onToggle={toggleInclude} onEdit={updateField} onSuggest={handleSuggest} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-[#161618] flex-wrap gap-3">
          <div className="flex items-center gap-2 text-[11.5px] text-zinc-400">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            Nothing is saved until confirmed. Missing fields stay <span className="text-zinc-500">Unknown</span>.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="px-3.5 py-2 rounded-lg text-[12px] text-zinc-300 hover:bg-zinc-800">Cancel</button>
            <button
              onClick={() => onConfirm(rows.filter(r => r._include), fileName)}
              disabled={stage !== "ready" || includedCount === 0}
              className={cx("px-3.5 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2",
                stage === "ready" && includedCount > 0
                  ? "bg-lime-300 text-zinc-900 hover:bg-lime-200"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed")}
            >
              <Check className="w-3.5 h-3.5" />Save {includedCount} {isContacts ? "contacts" : "products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCell({ value, onChange, mono }) {
  const isUnknown = value === "Unknown";
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full bg-transparent border-0 outline-none text-[12.5px] py-1 px-1.5 rounded",
        "focus:bg-zinc-800/80 focus:ring-1 focus:ring-lime-300/40",
        mono && "tabular-nums",
        isUnknown ? "text-zinc-500 italic" : "text-zinc-200"
      )}
    />
  );
}

function ContactPreviewTable({ rows, onToggle, onEdit }) {
  return (
    <table className="w-full text-[12.5px]">
      <thead className="sticky top-0 bg-[#161618] border-b border-zinc-800">
        <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
          <th className="text-left px-4 py-3 font-normal w-8"></th>
          <th className="text-left px-2 py-3 font-normal">Name</th>
          <th className="text-left px-2 py-3 font-normal">Role</th>
          <th className="text-left px-2 py-3 font-normal">Email</th>
          <th className="text-left px-2 py-3 font-normal">Region</th>
          <th className="text-left px-2 py-3 font-normal">Page</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {rows.map(r => (
          <tr key={r._id} className={cx(!r._include && "opacity-40")}>
            <td className="px-4 py-2">
              <input type="checkbox" checked={r._include} onChange={() => onToggle(r._id)}
                     className="accent-lime-300 w-3.5 h-3.5" />
            </td>
            <td className="px-2 py-1"><PreviewCell value={r.name} onChange={(v) => onEdit(r._id, "name", v)} /></td>
            <td className="px-2 py-1">
              <select value={r.role} onChange={(e) => onEdit(r._id, "role", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11.5px] rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-lime-300/40">
                {["Sales", "Technical", "Procurement", "Management"].map(o => <option key={o}>{o}</option>)}
              </select>
            </td>
            <td className="px-2 py-1"><PreviewCell value={r.email} onChange={(v) => onEdit(r._id, "email", v)} mono /></td>
            <td className="px-2 py-1">
              <select value={r.region} onChange={(e) => onEdit(r._id, "region", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11.5px] rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-lime-300/40">
                {["APAC", "Europe", "MEA", "Americas"].map(o => <option key={o}>{o}</option>)}
              </select>
            </td>
            <td className="px-2 py-1 text-zinc-500 tabular-nums text-[11.5px]">p.{r.page}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProductPreviewTable({ rows, onToggle, onEdit, onSuggest }) {
  return (
    <table className="w-full text-[12.5px]">
      <thead className="sticky top-0 bg-[#161618] border-b border-zinc-800">
        <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
          <th className="text-left px-4 py-3 font-normal w-8"></th>
          <th className="text-left px-2 py-3 font-normal">Product</th>
          <th className="text-left px-2 py-3 font-normal">Chemical</th>
          <th className="text-left px-2 py-3 font-normal">Category</th>
          <th className="text-left px-2 py-3 font-normal">Application</th>
          <th className="text-left px-2 py-3 font-normal">Grade</th>
          <th className="text-left px-2 py-3 font-normal">CAS</th>
          <th className="text-left px-2 py-3 font-normal">Page</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {rows.map(r => (
          <tr key={r._id} className={cx(!r._include && "opacity-40")}>
            <td className="px-4 py-2">
              <input type="checkbox" checked={r._include} onChange={() => onToggle(r._id)}
                     className="accent-lime-300 w-3.5 h-3.5" />
            </td>
            <td className="px-2 py-1"><PreviewCell value={r.name} onChange={(v) => onEdit(r._id, "name", v)} /></td>
            <td className="px-2 py-1">
              <SuggestCell value={r.chemical} field="chemical" rowId={r._id}
                           busy={r._suggesting === "chemical"}
                           onChange={(v) => onEdit(r._id, "chemical", v)}
                           onSuggest={() => onSuggest(r._id, "chemical")} />
            </td>
            <td className="px-2 py-1">
              <select value={r.category} onChange={(e) => onEdit(r._id, "category", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11.5px] rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-lime-300/40 max-w-[110px]">
                {["Unknown","Solvents","Resins","Additives","Pigments","Surfactants","Amines","Esters","Reagents","Hardeners","Polymers"].map(o => <option key={o}>{o}</option>)}
              </select>
            </td>
            <td className="px-2 py-1">
              <SuggestCell value={r.application} field="application" rowId={r._id}
                           busy={r._suggesting === "application"}
                           onChange={(v) => onEdit(r._id, "application", v)}
                           onSuggest={() => onSuggest(r._id, "application")} />
            </td>
            <td className="px-2 py-1">
              <SuggestCell value={r.grade} field="grade" rowId={r._id}
                           busy={r._suggesting === "grade"}
                           onChange={(v) => onEdit(r._id, "grade", v)}
                           onSuggest={() => onSuggest(r._id, "grade")} />
            </td>
            <td className="px-2 py-1">
              <SuggestCell value={r.cas} field="cas" rowId={r._id} mono
                           busy={r._suggesting === "cas"}
                           onChange={(v) => onEdit(r._id, "cas", v)}
                           onSuggest={() => onSuggest(r._id, "cas")} />
            </td>
            <td className="px-2 py-1 text-zinc-500 tabular-nums text-[11.5px]">p.{r.page}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SuggestCell({ value, field, rowId, mono, busy, onChange, onSuggest }) {
  const isUnknown = value === "Unknown" || !value;
  return (
    <div className="flex items-center gap-1">
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "flex-1 bg-transparent border-0 outline-none text-[12.5px] py-1 px-1.5 rounded min-w-[80px]",
          "focus:bg-zinc-800/80 focus:ring-1 focus:ring-lime-300/40",
          mono && "tabular-nums",
          isUnknown ? "text-zinc-500 italic" : "text-zinc-200"
        )}
      />
      {isUnknown && (
        <button onClick={onSuggest} disabled={busy}
                title={`Suggest ${field} from PubChem`}
                className={cx(
                  "shrink-0 rounded p-1 transition-colors",
                  busy ? "bg-zinc-700 text-zinc-400" : "bg-lime-300/10 hover:bg-lime-300/20 text-lime-300"
                )}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONTACTS MODULE
// ---------------------------------------------------------------------------

function ContactsModule({ contacts, onIngest }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);

  const handleFile = async (file) => {
    const ext = file.name.toLowerCase().split(".").pop();
    setDrawer({ fileName: file.name, sourceLabel: `.${ext.toUpperCase()} · ${(file.size/1024).toFixed(0)} KB`, parsedRows: [], parsing: true, parseError: null });
    try {
      const rows = await parseContactsFile(file);
      setDrawer(d => d ? { ...d, parsedRows: rows, parsing: false } : null);
    } catch (err) {
      setDrawer(d => d ? { ...d, parsing: false, parseError: err.message || "Unknown error" } : null);
    }
  };

  const handleConfirm = (rows, fileName) => {
    const stamped = rows.map((r, i) => ({
      id: `c-${Date.now()}-${i}`,
      name: r.name, role: r.role, email: r.email, region: r.region,
      tags: r.tags || [], phone: r.phone || "Unknown",
      source: `${fileName} · p.${r.page}`,
      justAdded: true,
    }));
    onIngest(stamped);
    setDrawer(null);
  };

  const filtered = useMemo(() => contacts.filter(c =>
    (roleFilter === "All" || c.role === roleFilter) &&
    (regionFilter === "All" || c.region === regionFilter) &&
    (search === "" || (c.name + c.email).toLowerCase().includes(search.toLowerCase()))
  ), [contacts, roleFilter, regionFilter, search]);

  const counts = {
    total: contacts.length,
    sales: contacts.filter(c => c.role === "Sales").length,
    technical: contacts.filter(c => c.role === "Technical").length,
    decisionMakers: contacts.filter(c => c.tags.includes("Decision Maker")).length,
  };

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Contacts Intelligence</h2>
          <p className="text-[12px] text-zinc-500 mt-1">Upload PDFs, business cards or rosters — review before saving</p>
        </div>
        <UploadButton label="Upload contacts file" onFile={handleFile} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total contacts", value: counts.total, icon: Users },
          { label: "Sales", value: counts.sales, icon: Tag },
          { label: "Technical", value: counts.technical, icon: Beaker },
          { label: "Decision makers", value: counts.decisionMakers, icon: Award },
        ].map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</div>
                <div className="text-2xl font-light text-zinc-100 tabular-nums">{s.value}</div>
              </div>
              <s.icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252528] rounded-lg border border-zinc-800 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search name or email…"
                   className="bg-transparent border-0 outline-none text-[13px] text-zinc-200 placeholder:text-zinc-500 flex-1" />
          </div>
          <FilterChip label="Role" value={roleFilter}
                      options={["All", "Sales", "Technical", "Procurement", "Management"]}
                      onChange={setRoleFilter} />
          <FilterChip label="Region" value={regionFilter}
                      options={["All", "APAC", "Europe", "MEA", "Americas"]}
                      onChange={setRegionFilter} />
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#1c1c1e] border-b border-zinc-800">
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                <th className="text-left px-5 py-3 font-normal">Name</th>
                <th className="text-left px-5 py-3 font-normal">Role</th>
                <th className="text-left px-5 py-3 font-normal">Email</th>
                <th className="text-left px-5 py-3 font-normal">Region</th>
                <th className="text-left px-5 py-3 font-normal">Tags</th>
                <th className="text-left px-5 py-3 font-normal">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(c => (
                <tr key={c.id} className={cx("hover:bg-zinc-800/30 transition-colors",
                                              c.justAdded && "bg-lime-300/[0.04]")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {c.justAdded && <div className="w-1 h-1 rounded-full bg-lime-300" />}
                      <span className="text-zinc-100">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Pill>{c.role}</Pill></td>
                  <td className="px-5 py-3 text-[11.5px] text-zinc-400 tabular-nums">{c.email}</td>
                  <td className="px-5 py-3 text-zinc-300">{c.region}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(t => (
                        <Pill key={t} tone={t === "Decision Maker" ? "accent" : "muted"}>{t}</Pill>
                      ))}
                      {c.tags.length === 0 && <span className="text-zinc-600 text-[11px]">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-zinc-500 max-w-[200px]">
                    {c.source === "—"
                      ? <span className="text-zinc-600">—</span>
                      : <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 shrink-0" /><span className="truncate">{c.source}</span></span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-zinc-500 text-[12px]">No contacts match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PreviewDrawer
        open={!!drawer} kind="contacts"
        fileName={drawer?.fileName}
        sourceLabel={drawer?.sourceLabel}
        parsedRows={drawer?.parsedRows || []}
        parsing={drawer?.parsing}
        parseError={drawer?.parseError}
        onConfirm={handleConfirm}
        onCancel={() => setDrawer(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CATALOGUE MODULE
// ---------------------------------------------------------------------------

function CatalogueModule({ products, contacts, onIngest }) {
  const [catFilter, setCatFilter] = useState("All");
  const [demandFilter, setDemandFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [linkProduct, setLinkProduct] = useState(null);

  const handleFile = async (file) => {
    const ext = file.name.toLowerCase().split(".").pop();
    setDrawer({ fileName: file.name, sourceLabel: `.${ext.toUpperCase()} · ${(file.size/1024).toFixed(0)} KB`, parsedRows: [], parsing: true, parseError: null });
    try {
      const rows = await parseCatalogueFile(file);
      setDrawer(d => d ? { ...d, parsedRows: rows, parsing: false } : null);
    } catch (err) {
      setDrawer(d => d ? { ...d, parsing: false, parseError: err.message || "Unknown error" } : null);
    }
  };

  const handleConfirm = (rows, fileName) => {
    const stamped = rows.map((r, i) => ({
      id: `p-${Date.now()}-${i}`,
      name: r.name,
      chemical: r.chemical || "Unknown",
      category: r.category,
      application: r.application,
      grade: r.grade,
      cas: r.cas,
      industry: r.industry || [],
      demand: r.demand || "low",
      source: `${fileName} · p.${r.page}`,
      sources: r._sources || {},
      justAdded: true,
    }));
    onIngest(stamped);
    setDrawer(null);
  };

  const filtered = useMemo(() => products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (demandFilter === "All" || p.demand === demandFilter.toLowerCase()) &&
    (search === "" || (p.name + p.application + p.cas).toLowerCase().includes(search.toLowerCase()))
  ), [products, catFilter, demandFilter, search]);

  const stats = {
    total: products.length,
    top: products.filter(p => p.top).length,
    high: products.filter(p => p.demand === "high").length,
    cats: new Set(products.map(p => p.category)).size,
  };

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Product Catalogue</h2>
          <p className="text-[12px] text-zinc-500 mt-1">Upload supplier catalogues — review parsed SKUs before saving</p>
        </div>
        <UploadButton label="Upload catalogue file" onFile={handleFile} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total SKUs", value: stats.total, icon: Package },
          { label: "Top products", value: stats.top, icon: Star },
          { label: "High demand", value: stats.high, icon: TrendingUp },
          { label: "Categories", value: stats.cats, icon: Database },
        ].map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</div>
                <div className="text-2xl font-light text-zinc-100 tabular-nums">{s.value}</div>
              </div>
              <s.icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252528] rounded-lg border border-zinc-800 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search product, application or CAS…"
                   className="bg-transparent border-0 outline-none text-[13px] text-zinc-200 placeholder:text-zinc-500 flex-1" />
          </div>
          <FilterChip label="Category" value={catFilter}
                      options={["All", "Solvents", "Resins", "Additives", "Pigments"]}
                      onChange={setCatFilter} />
          <FilterChip label="Demand" value={demandFilter}
                      options={["All", "High", "Medium", "Low"]}
                      onChange={setDemandFilter} />
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#1c1c1e] border-b border-zinc-800">
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                <th className="text-left px-5 py-3 font-normal">Product</th>
                <th className="text-left px-5 py-3 font-normal">Chemical</th>
                <th className="text-left px-5 py-3 font-normal">Category</th>
                <th className="text-left px-5 py-3 font-normal">Application</th>
                <th className="text-left px-5 py-3 font-normal">Grade</th>
                <th className="text-left px-5 py-3 font-normal">CAS</th>
                <th className="text-left px-5 py-3 font-normal">Source</th>
                <th className="text-right px-5 py-3 font-normal w-20">Linked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(p => (
                <tr key={p.id} className={cx("hover:bg-zinc-800/30 transition-colors",
                                              p.justAdded && "bg-lime-300/[0.04]")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {p.justAdded && <div className="w-1 h-1 rounded-full bg-lime-300" />}
                      {p.top && <Star className="w-3 h-3 text-lime-300 fill-lime-300" />}
                      <span className="text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className={cx("px-5 py-3 text-[12px] max-w-[220px] truncate",
                                     p.chemical === "Unknown" || !p.chemical ? "text-zinc-600 italic" : "text-zinc-300")}
                      title={p.chemical}>{p.chemical || "Unknown"}</td>
                  <td className="px-5 py-3 text-zinc-300">{p.category}</td>
                  <td className="px-5 py-3 text-zinc-400">{p.application}</td>
                  <td className="px-5 py-3"><Pill tone="muted">{p.grade}</Pill></td>
                  <td className={cx("px-5 py-3 text-[11.5px] tabular-nums",
                                     p.cas === "Unknown" ? "text-zinc-600 italic" : "text-zinc-400")}>{p.cas}</td>
                  <td className="px-5 py-3 text-[11px] text-zinc-500 max-w-[160px]">
                    {p.source === "—"
                      ? <span className="text-zinc-600">—</span>
                      : <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 shrink-0" /><span className="truncate">{p.source}</span></span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setLinkProduct(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">
                      <Link2 className="w-3 h-3 text-lime-300" />View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-zinc-500 text-[12px]">No products match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PreviewDrawer
        open={!!drawer} kind="catalogue"
        fileName={drawer?.fileName}
        sourceLabel={drawer?.sourceLabel}
        parsedRows={drawer?.parsedRows || []}
        parsing={drawer?.parsing}
        parseError={drawer?.parseError}
        onConfirm={handleConfirm}
        onCancel={() => setDrawer(null)}
      />

      <LinkedContactsDrawer product={linkProduct} contacts={contacts}
                            onClose={() => setLinkProduct(null)} />
    </div>
  );
}

function DemandBadge({ demand }) {
  const map = {
    high:   { dots: 3, color: "bg-lime-300",  text: "text-lime-300",  label: "High" },
    medium: { dots: 2, color: "bg-amber-300", text: "text-amber-300", label: "Med" },
    low:    { dots: 1, color: "bg-zinc-500",  text: "text-zinc-500",  label: "Low" },
  };
  const d = map[demand] || map.low;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={cx("w-1 h-3 rounded-sm", i <= d.dots ? d.color : "bg-zinc-800")} />
        ))}
      </div>
      <span className={cx("text-[10px] uppercase tracking-wider", d.text)}>{d.label}</span>
    </div>
  );
}

function LinkedContactsDrawer({ product, contacts, onClose }) {
  if (!product) return null;
  const linked = mapProductToContacts(product, contacts);
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="ml-auto relative w-full max-w-[560px] bg-[#161618] border-l border-zinc-800 flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Linked contacts</div>
            <h3 className="text-[15px] font-medium text-zinc-100 truncate">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Pill tone="muted">{product.category}</Pill>
              <Pill tone="muted">{product.application}</Pill>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {linked.length === 0 && (
            <div className="text-zinc-500 text-[12px] py-12 text-center">No matching contacts in directory</div>
          )}
          {linked.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-zinc-800 bg-[#1c1c1e] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-zinc-500 tabular-nums">#{i + 1}</span>
                    <span className="text-[14px] text-zinc-100 font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] text-zinc-500">
                    <Pill>{c.role}</Pill>
                    <span>{c.region}</span>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-300 tabular-nums px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">{c.confidence}%</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {c.chips.map((ch, j) => (
                  <Pill key={j} tone={ch.kind === "primary" ? "accent" : "muted"}>{ch.label}</Pill>
                ))}
              </div>
              <div className="space-y-1 mt-2 pt-2 border-t border-zinc-800">
                {c.reasons.map((r, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-[11.5px] text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-lime-300" />{r}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RECOMMENDATION ENGINE
// ---------------------------------------------------------------------------

function RecommendModule({ contacts, products }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [feedback, setFeedback] = useState({});
  const [searching, setSearching] = useState(false);

  const handleSearch = (q) => {
    if (!q.trim()) return;
    setSearching(true);
    setQuery(q);
    setTimeout(() => {
      setSubmitted(q);
      setSearching(false);
    }, 500);
  };

  const matchedProduct = useMemo(() => {
    if (!submitted) return null;
    const q = submitted.toLowerCase();
    return products.find(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.application.toLowerCase().includes(q) ||
      (p.cas && p.cas.toLowerCase().includes(q))
    ) || null;
  }, [submitted, products]);

  const baseResults = useMemo(
    () => matchedProduct ? mapProductToContacts(matchedProduct, contacts) : [],
    [matchedProduct, contacts]
  );

  const results = baseResults.map(r => {
    const fb = feedback[r.id];
    let conf = r.confidence;
    if (fb === "up") conf = Math.min(98, conf + 6);
    if (fb === "down") conf = Math.max(20, conf - 12);
    return { ...r, confidence: conf };
  }).sort((a, b) => b.confidence - a.confidence);

  const suggestions = ["Acrylic Resin", "Ethyl Acetate", "Coatings", "Toluene"];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Product → Contact Recommender</h2>
        <p className="text-[12px] text-zinc-500 mt-1">Match a product to the best contacts in your directory</p>
      </div>

      <Card className="!p-2">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Sparkles className="w-4 h-4 text-lime-300 shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && handleSearch(query)}
                 placeholder="Search a product, category or CAS number…"
                 className="bg-transparent border-0 outline-none text-[14px] text-zinc-100 placeholder:text-zinc-500 flex-1" />
          <button onClick={() => handleSearch(query)} disabled={!query.trim() || searching}
                  className="px-3 py-1.5 rounded-lg bg-lime-300 text-zinc-900 text-[12px] font-medium hover:bg-lime-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}Match
          </button>
        </div>
      </Card>

      {!submitted && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 self-center mr-1">Try:</span>
          {suggestions.map(s => (
            <button key={s} onClick={() => handleSearch(s)}
                    className="px-3 py-1.5 rounded-lg bg-[#252528] hover:bg-zinc-800 text-[12px] text-zinc-300 border border-zinc-800">
              {s}
            </button>
          ))}
        </div>
      )}

      {submitted && !searching && !matchedProduct && (
        <Card className="!p-6 text-center">
          <AlertCircle className="w-5 h-5 text-amber-300 mx-auto mb-2" />
          <div className="text-[13px] text-zinc-200 mb-1">No product matched <span className="text-zinc-100">"{submitted}"</span></div>
          <div className="text-[11.5px] text-zinc-500">Try a category like “Resins” or upload a catalogue first</div>
        </Card>
      )}

      {submitted && !searching && matchedProduct && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Matched product</span>
            <span className="text-[13px] text-zinc-100 font-medium">{matchedProduct.name}</span>
            <Pill tone="muted">{matchedProduct.category}</Pill>
            <span className="text-[10px] text-zinc-600 ml-auto">{results.length} contacts ranked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r, idx) => (
              <RecommendationCard key={r.id} rec={r} rank={idx + 1}
                                  feedback={feedback[r.id]}
                                  onFeedback={(v) => setFeedback(f => ({ ...f, [r.id]: f[r.id] === v ? null : v }))} />
            ))}
          </div>
        </div>
      )}

      {searching && (
        <div className="flex items-center justify-center py-16 gap-3 text-zinc-500 text-[12px] uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin text-lime-300" />Matching contacts…
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec, rank, feedback, onFeedback }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const confTone = rec.confidence >= 80 ? "accent" : rec.confidence >= 60 ? "warn" : "muted";

  return (
    <Card className="!p-4 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="text-[10px] text-zinc-500 mt-1 tabular-nums w-4">#{rank}</div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-medium text-zinc-100 truncate mb-1.5">{rec.name}</h4>
            <div className="flex items-center gap-2 text-[11.5px] text-zinc-500 mb-3">
              <Pill>{rec.role}</Pill>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>{rec.region}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rec.chips.map((c, i) => (
                <Pill key={i} tone={c.kind === "primary" ? "accent" : "muted"}>{c.label}</Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="relative"
               onMouseEnter={() => setTooltipOpen(true)}
               onMouseLeave={() => setTooltipOpen(false)}>
            <Pill tone={confTone}><span className="tabular-nums">{rec.confidence}%</span></Pill>
            {tooltipOpen && rec.reasons.length > 0 && (
              <div className="absolute right-0 top-7 z-10 w-56 rounded-lg bg-[#1c1c1e] border border-zinc-800 shadow-xl p-2.5 space-y-1">
                {rec.reasons.slice(0, 2).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-300">
                    <div className="w-1 h-1 rounded-full bg-lime-300" />{t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Bar value={rec.confidence} tone={confTone === "muted" ? "muted" : "accent"} />
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-[10.5px] text-zinc-500 truncate max-w-[60%] tabular-nums">{rec.email}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onFeedback("up")}
                  className={cx("w-7 h-7 rounded-md flex items-center justify-center",
                    feedback === "up" ? "bg-lime-300/15 text-lime-300" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800")}>
            <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button onClick={() => onFeedback("down")}
                  className={cx("w-7 h-7 rounded-md flex items-center justify-center",
                    feedback === "down" ? "bg-rose-300/15 text-rose-300" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800")}>
            <ThumbsDown className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// GAP ANALYSIS MODULE
// ---------------------------------------------------------------------------

function GapAnalysisModule({ contacts, products }) {
  const REGIONS = ["APAC", "Europe", "MEA", "Americas"];

  // Find all categories present in the catalogue (plus "Unknown" if any)
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return [...cats].sort();
  }, [products]);

  // Build coverage matrix: for each (category, region), how many products and
  // how many regional contacts that could plausibly handle them.
  const matrix = useMemo(() => {
    const m = {};
    for (const cat of categories) {
      m[cat] = {};
      for (const region of REGIONS) {
        const productCount = products.filter(p => p.category === cat).length;
        const contactCount = contacts.filter(c => c.region === region &&
          (c.role === "Sales" || c.role === "Technical" || c.role === "Management")).length;
        // Coverage score: products * contacts in region (proxy for ability to serve)
        let status;
        if (productCount === 0) status = "none";
        else if (contactCount === 0) status = "gap";
        else if (contactCount === 1) status = "thin";
        else status = "ok";
        m[cat][region] = { productCount, contactCount, status };
      }
    }
    return m;
  }, [categories, products, contacts]);

  // Data completeness gaps in catalogue
  const incompleteProducts = useMemo(() => {
    return products
      .map(p => {
        const missing = [];
        if (!p.cas || p.cas === "Unknown") missing.push("CAS");
        if (!p.chemical || p.chemical === "Unknown") missing.push("Chemical");
        if (!p.application || p.application === "Unknown") missing.push("Application");
        if (!p.grade || p.grade === "Unknown") missing.push("Grade");
        return { ...p, _missing: missing };
      })
      .filter(p => p._missing.length > 0)
      .sort((a, b) => b._missing.length - a._missing.length);
  }, [products]);

  // Contact coverage gaps by region/role
  const contactGaps = useMemo(() => {
    const required = ["Sales", "Technical", "Management"];
    const out = [];
    for (const region of REGIONS) {
      for (const role of required) {
        const count = contacts.filter(c => c.region === region && c.role === role).length;
        if (count === 0) out.push({ region, role, severity: "high", reason: "No coverage" });
        else if (count === 1) out.push({ region, role, severity: "medium", reason: "Single point of failure" });
      }
      // Decision makers
      const dm = contacts.filter(c => c.region === region && (c.tags || []).includes("Decision Maker")).length;
      if (dm === 0 && contacts.some(c => c.region === region)) {
        out.push({ region, role: "Decision Maker", severity: "high", reason: "No decision maker identified" });
      }
    }
    return out;
  }, [contacts]);

  const totalGaps = useMemo(() => {
    let n = 0;
    for (const cat of categories) for (const r of REGIONS) {
      if (matrix[cat][r].status === "gap" || matrix[cat][r].status === "thin") n++;
    }
    return n;
  }, [categories, matrix]);

  const completenessScore = useMemo(() => {
    const totalFields = products.length * 4; // CAS, chemical, application, grade
    const missingFields = incompleteProducts.reduce((sum, p) => sum + p._missing.length, 0);
    return totalFields > 0 ? Math.round(((totalFields - missingFields) / totalFields) * 100) : 100;
  }, [products, incompleteProducts]);

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Gap Analysis</h2>
          <p className="text-[12px] text-zinc-500 mt-1">Where your supplier coverage is weak — and what to fix first</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Coverage gaps", value: totalGaps, icon: AlertCircle, tone: totalGaps > 0 ? "warn" : "good" },
          { label: "Data completeness", value: completenessScore + "%", icon: Database, tone: completenessScore >= 80 ? "good" : "warn" },
          { label: "Incomplete SKUs", value: incompleteProducts.length, icon: Package, tone: incompleteProducts.length > 0 ? "warn" : "good" },
          { label: "Contact gaps", value: contactGaps.length, icon: Users, tone: contactGaps.length > 0 ? "warn" : "good" },
        ].map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</div>
                <div className="text-2xl font-light text-zinc-100 tabular-nums">{s.value}</div>
              </div>
              <s.icon className={cx("w-4 h-4", s.tone === "good" ? "text-lime-300" : "text-amber-300")} strokeWidth={1.5} />
            </div>
          </Card>
        ))}
      </div>

      {/* Coverage matrix */}
      <Card title="Coverage matrix" subtitle="Categories × regions — where you have products but no regional support">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-[12px]">Upload catalogue data to see coverage</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 px-2 font-normal">Category</th>
                  {REGIONS.map(r => (
                    <th key={r} className="text-center py-2 px-2 font-normal">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {categories.map(cat => (
                  <tr key={cat}>
                    <td className="py-2.5 px-2 text-zinc-200">{cat}</td>
                    {REGIONS.map(r => {
                      const cell = matrix[cat][r];
                      const styles = {
                        none: "bg-zinc-800/40 text-zinc-600",
                        gap: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
                        thin: "bg-amber-300/10 text-amber-300 border border-amber-300/20",
                        ok: "bg-lime-300/10 text-lime-300 border border-lime-300/20",
                      };
                      return (
                        <td key={r} className="py-2 px-2">
                          <div className={cx("rounded-md px-2.5 py-1.5 text-center text-[11px]", styles[cell.status])}>
                            <div className="font-medium tabular-nums">{cell.productCount} × {cell.contactCount}</div>
                            <div className="text-[9.5px] uppercase tracking-widest mt-0.5 opacity-70">
                              {cell.status === "gap" && "no contact"}
                              {cell.status === "thin" && "single point"}
                              {cell.status === "ok" && "covered"}
                              {cell.status === "none" && "no SKU"}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-[10.5px] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-lime-300/30 border border-lime-300/40" />Covered</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-300/30 border border-amber-300/40" />Thin</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500/30 border border-rose-500/40" />Gap</span>
              <span className="text-zinc-600 ml-2">Cell shows: products × regional contacts</span>
            </div>
          </div>
        )}
      </Card>

      {/* Two-column: contact gaps + data gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Contact gaps" subtitle="Regions / roles needing coverage">
          {contactGaps.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-[12px] flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-lime-300" />Coverage looks complete
            </div>
          ) : (
            <div className="space-y-2">
              {contactGaps.map((g, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#252528] rounded-lg border border-zinc-800">
                  <div className={cx("w-1 h-1 rounded-full",
                    g.severity === "high" ? "bg-rose-300" : "bg-amber-300")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-zinc-200">
                      <span className="text-zinc-400">{g.region}</span>
                      <span className="text-zinc-600 mx-1.5">·</span>
                      <span>{g.role}</span>
                    </div>
                    <div className="text-[10.5px] text-zinc-500 mt-0.5">{g.reason}</div>
                  </div>
                  <Pill tone={g.severity === "high" ? "warn" : "muted"}>{g.severity}</Pill>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Catalogue data gaps" subtitle={`${incompleteProducts.length} SKU${incompleteProducts.length === 1 ? "" : "s"} have missing fields`}>
          {incompleteProducts.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-[12px] flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-lime-300" />All products fully specified
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {incompleteProducts.slice(0, 12).map(p => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/40 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-zinc-200 truncate">{p.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p._missing.map(m => (
                        <span key={m} className="text-[9.5px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-300/10 text-amber-300 border border-amber-300/20">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {incompleteProducts.length > 12 && (
                <div className="text-center text-[11px] text-zinc-500 py-2">
                  + {incompleteProducts.length - 12} more — open Catalogue to fix inline
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPETITIVE BENCHMARKING MODULE
// ---------------------------------------------------------------------------

const PEER_SUPPLIERS = [
  { name: "Hexakron Specialty Chemicals", code: "HXK-2841", region: "APAC", tier: "Tier 1",
    pricing: 75, responsiveness: 71, compliance: 88, breadth: 68, geographic: 64,
    leadDays: 18, certifications: 4, isSelf: true },
  { name: "Polyform Industrial", code: "PFI-1192", region: "Europe", tier: "Tier 1",
    pricing: 62, responsiveness: 84, compliance: 92, breadth: 81, geographic: 78,
    leadDays: 14, certifications: 6 },
  { name: "Aqualyte Chemicals", code: "AQL-0473", region: "Americas", tier: "Tier 2",
    pricing: 81, responsiveness: 58, compliance: 70, breadth: 54, geographic: 49,
    leadDays: 24, certifications: 3 },
  { name: "Sino-Bright Chemicals", code: "SBC-7820", region: "APAC", tier: "Tier 2",
    pricing: 88, responsiveness: 49, compliance: 61, breadth: 72, geographic: 55,
    leadDays: 28, certifications: 2 },
  { name: "Nordix Materials", code: "NDX-3318", region: "Europe", tier: "Tier 1",
    pricing: 58, responsiveness: 79, compliance: 95, breadth: 76, geographic: 82,
    leadDays: 12, certifications: 7 },
];

const BENCH_DIMENSIONS = [
  { key: "pricing",        label: "Pricing competitiveness",  invertColor: false },
  { key: "responsiveness", label: "Responsiveness",            invertColor: false },
  { key: "compliance",     label: "Compliance coverage",       invertColor: false },
  { key: "breadth",        label: "Catalogue breadth",         invertColor: false },
  { key: "geographic",     label: "Geographic coverage",       invertColor: false },
];

function BenchmarkingModule({ supplier, contacts, products }) {
  const self = PEER_SUPPLIERS.find(p => p.isSelf);
  const peers = PEER_SUPPLIERS.filter(p => !p.isSelf);

  // For each dimension compute self percentile vs peer median
  const dimensionStats = useMemo(() => {
    return BENCH_DIMENSIONS.map(d => {
      const peerValues = peers.map(p => p[d.key]).sort((a, b) => a - b);
      const median = peerValues[Math.floor(peerValues.length / 2)];
      const max = Math.max(...peerValues);
      const selfVal = self[d.key];
      const beatCount = peerValues.filter(v => selfVal > v).length;
      const percentile = Math.round((beatCount / peerValues.length) * 100);
      return { ...d, selfVal, median, max, percentile };
    });
  }, [self, peers]);

  // Overall standing
  const overallScore = Math.round(
    BENCH_DIMENSIONS.reduce((sum, d) => sum + self[d.key], 0) / BENCH_DIMENSIONS.length
  );
  const overallPercentile = Math.round(
    dimensionStats.reduce((sum, d) => sum + d.percentile, 0) / dimensionStats.length
  );

  // Strengths and weaknesses
  const strengths = dimensionStats.filter(d => d.percentile >= 60).sort((a, b) => b.percentile - a.percentile);
  const weaknesses = dimensionStats.filter(d => d.percentile < 40).sort((a, b) => a.percentile - b.percentile);

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Competitive Benchmarking</h2>
          <p className="text-[12px] text-zinc-500 mt-1">{supplier.name} vs {peers.length} peer suppliers — pricing, response, compliance, breadth</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="muted">Refreshed weekly</Pill>
          <Pill tone="accent"><Activity className="w-3 h-3" />Live data</Pill>
        </div>
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Composite score</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{overallScore}<span className="text-[14px] text-zinc-500">/100</span></div>
          <div className="text-[10.5px] text-zinc-500 mt-1">Avg across 5 dimensions</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Peer percentile</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{overallPercentile}<span className="text-[14px] text-zinc-500">th</span></div>
          <div className="text-[10.5px] text-zinc-500 mt-1">Better than {overallPercentile}% of peers</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Lead time</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{self.leadDays}<span className="text-[14px] text-zinc-500"> days</span></div>
          <div className="text-[10.5px] text-zinc-500 mt-1">Peer median {Math.round(peers.reduce((s,p)=>s+p.leadDays,0)/peers.length)}d</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Certifications</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{self.certifications}</div>
          <div className="text-[10.5px] text-zinc-500 mt-1">Peer max {Math.max(...peers.map(p => p.certifications))}</div>
        </Card>
      </div>

      {/* Dimension benchmarks */}
      <Card title="Dimension comparison" subtitle="Self value vs peer median (across 4 peers)">
        <div className="space-y-3.5">
          {dimensionStats.map(d => {
            const isStrong = d.percentile >= 60;
            const isWeak = d.percentile < 40;
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200">{d.label}</span>
                    <span className={cx("text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded",
                      isStrong ? "bg-lime-300/15 text-lime-300" :
                      isWeak ? "bg-rose-500/15 text-rose-300" : "bg-zinc-800 text-zinc-400")}>
                      {d.percentile}th pctl
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] tabular-nums">
                    <span className="text-zinc-500">Median {d.median}</span>
                    <span className="text-zinc-200 font-medium">{d.selfVal}</span>
                  </div>
                </div>
                <div className="relative h-2 bg-[#252528] rounded-full overflow-hidden">
                  {/* peer median marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-zinc-500"
                       style={{ left: `${d.median}%` }} />
                  {/* self value bar */}
                  <div className={cx("h-full rounded-full",
                    isStrong ? "bg-lime-300" :
                    isWeak ? "bg-rose-400" : "bg-zinc-400")}
                    style={{ width: `${d.selfVal}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Strengths / Weaknesses + Peer table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Strengths" className="lg:col-span-1">
          {strengths.length === 0 ? (
            <div className="py-6 text-center text-zinc-500 text-[12px]">No clear advantages identified</div>
          ) : (
            <div className="space-y-2">
              {strengths.map(s => (
                <div key={s.key} className="flex items-center gap-2.5 px-3 py-2 bg-lime-300/[0.04] border border-lime-300/15 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-lime-300" />
                  <div className="flex-1 text-[12.5px] text-zinc-200">{s.label}</div>
                  <span className="text-[11px] text-lime-300 tabular-nums">+{s.selfVal - s.median}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Weaknesses" className="lg:col-span-1">
          {weaknesses.length === 0 ? (
            <div className="py-6 text-center text-zinc-500 text-[12px] flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-lime-300" />No weak spots
            </div>
          ) : (
            <div className="space-y-2">
              {weaknesses.map(w => (
                <div key={w.key} className="flex items-center gap-2.5 px-3 py-2 bg-rose-500/[0.05] border border-rose-500/15 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-rose-300" />
                  <div className="flex-1 text-[12.5px] text-zinc-200">{w.label}</div>
                  <span className="text-[11px] text-rose-300 tabular-nums">{w.selfVal - w.median}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recommended action" className="lg:col-span-1">
          <div className="space-y-2.5">
            {weaknesses.length > 0 && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#252528] border border-zinc-800 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-lime-300 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-zinc-300 leading-snug">
                  Negotiate on <span className="text-zinc-100">{weaknesses[0].label.toLowerCase()}</span> — peer median is {weaknesses[0].median} vs your {weaknesses[0].selfVal}.
                </div>
              </div>
            )}
            {strengths.length > 0 && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#252528] border border-zinc-800 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-lime-300 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-zinc-300 leading-snug">
                  Lock in long-term contract — {strengths[0].label.toLowerCase()} significantly outperforms peers.
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#252528] border border-zinc-800 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-lime-300 shrink-0 mt-0.5" />
              <div className="text-[11.5px] text-zinc-300 leading-snug">
                Compare {peers[0].name.split(" ")[0]} for {weaknesses[0]?.label.toLowerCase() || "category overlap"} — better median scores.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Peer table */}
      <Card title="Peer suppliers" subtitle={`${peers.length} alternatives in similar categories`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="border-b border-zinc-800">
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                <th className="text-left py-2.5 px-3 font-normal">Supplier</th>
                <th className="text-left py-2.5 px-3 font-normal">Region</th>
                <th className="text-left py-2.5 px-3 font-normal">Tier</th>
                <th className="text-right py-2.5 px-3 font-normal">Pricing</th>
                <th className="text-right py-2.5 px-3 font-normal">Response</th>
                <th className="text-right py-2.5 px-3 font-normal">Compliance</th>
                <th className="text-right py-2.5 px-3 font-normal">Breadth</th>
                <th className="text-right py-2.5 px-3 font-normal">Lead</th>
                <th className="text-right py-2.5 px-3 font-normal">Certs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {PEER_SUPPLIERS.map(s => (
                <tr key={s.code} className={cx("hover:bg-zinc-800/30 transition-colors",
                                                  s.isSelf && "bg-lime-300/[0.04]")}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {s.isSelf && <div className="w-1 h-1 rounded-full bg-lime-300" />}
                      <span className={cx(s.isSelf ? "text-zinc-100 font-medium" : "text-zinc-200")}>{s.name}</span>
                      {s.isSelf && <span className="text-[9.5px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-lime-300/15 text-lime-300">You</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">{s.region}</td>
                  <td className="py-2.5 px-3"><Pill tone="muted">{s.tier}</Pill></td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 tabular-nums">{s.pricing}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 tabular-nums">{s.responsiveness}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 tabular-nums">{s.compliance}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-300 tabular-nums">{s.breadth}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 tabular-nums">{s.leadDays}d</td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 tabular-nums">{s.certifications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROOT
// ---------------------------------------------------------------------------

export default function App() {
  const [view, setView] = useState("home");
  const [contacts, setContacts] = useState(SEED_CONTACTS);
  const [products, setProducts] = useState(SEED_PRODUCTS);

  const ingestContacts = (rows) => {
    setContacts(prev => {
      const existingEmails = new Set(prev.map(c => c.email).filter(e => e !== "Unknown"));
      const newOnes = rows.filter(r => !existingEmails.has(r.email));
      const cleaned = prev.map(c => ({ ...c, justAdded: false }));
      return [...newOnes, ...cleaned];
    });
  };

  const ingestProducts = (rows) => {
    setProducts(prev => {
      const existing = new Set(prev.map(p => p.name.toLowerCase()));
      const newOnes = rows.filter(r => !existing.has(r.name.toLowerCase()));
      const cleaned = prev.map(p => ({ ...p, justAdded: false }));
      return [...newOnes, ...cleaned];
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1c] text-zinc-100 antialiased flex"
         style={{ fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&display=swap');
        body { background: #1a1a1c; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3d; }
      `}</style>

      <Sidebar active={view} onChange={setView}
               contactCount={contacts.length} productCount={products.length} />

      <main className="flex-1 min-w-0 bg-[#1a1a1c]">
        <SupplierHeader supplier={SUPPLIER} />

        <div className="border-b border-zinc-800/80 px-8 py-3 flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest">
            <span className="text-zinc-500">Supplier</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-200">
              {view === "home" && "Dashboard"}
              {view === "contacts" && "Contacts Intelligence"}
              {view === "catalogue" && "Product Catalogue"}
              {view === "recommend" && "Recommendation Engine"}
              {view === "gaps" && "Gap Analysis"}
              {view === "benchmark" && "Competitive Benchmarking"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <Activity className="w-3 h-3 text-lime-300" />
            <span>3 RFQs active</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Updated 2m ago</span>
          </div>
        </div>

        {view === "home" && <Dashboard contacts={contacts} products={products} />}
        {view === "contacts" && <ContactsModule contacts={contacts} onIngest={ingestContacts} />}
        {view === "catalogue" && <CatalogueModule products={products} contacts={contacts} onIngest={ingestProducts} />}
        {view === "recommend" && <RecommendModule contacts={contacts} products={products} />}
        {view === "gaps" && <GapAnalysisModule contacts={contacts} products={products} />}
        {view === "benchmark" && <BenchmarkingModule supplier={SUPPLIER} contacts={contacts} products={products} />}
      </main>
    </div>
  );
}
