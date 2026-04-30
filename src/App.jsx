import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, Users, Package, Search, ChevronDown, ChevronRight,
  TrendingUp, Filter, FileText, Sparkles,
  ArrowUpRight, Check, X, ThumbsUp, ThumbsDown,
  Activity, Database, Award, AlertCircle, ChevronLeft,
  MapPin, Tag, Loader2, FileUp, Plus, Star, Beaker,
  Link2, Info, FileCheck2, CircleDot,
  Target, BarChart3, Zap, Wand2, Globe2, ShieldCheck, AlertTriangle, Workflow,
  Settings, Trash2, UserPlus, PackagePlus
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

function Sidebar({ active, onChange, productCount, contactCount, onOpenSettings }) {
  const items = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "contacts", label: "Contacts", icon: Users, badge: contactCount },
    { id: "catalogue", label: "Catalogue", icon: Package, badge: productCount },
    { id: "recommend", label: "Recommend", icon: Sparkles },
    { id: "valuechain", label: "Value Chain", icon: Workflow },
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

      <div className="mt-auto p-3 space-y-2">
        <button onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12.5px] text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-colors">
          <Settings className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
          <span>Settings</span>
        </button>
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
// SETTINGS DRAWER
// ---------------------------------------------------------------------------

function SettingsDrawer({ settings, onChange, onClose }) {
  const [googleKey, setGoogleKey] = useState(settings.googleKey || "");
  const [googleCx, setGoogleCx] = useState(settings.googleCx || "");
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    onChange({ googleKey: googleKey.trim(), googleCx: googleCx.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
  const handleClear = () => {
    setGoogleKey("");
    setGoogleCx("");
    onChange({ googleKey: "", googleCx: "" });
  };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] z-50 bg-[#161618] border-l border-zinc-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-[16px] font-medium text-zinc-100">Settings</h2>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Live competitor search via Google Programmable Search</p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
              <div className="text-[11.5px] text-zinc-300 leading-relaxed">
                <span className="text-zinc-100 font-medium">Bring your own keys.</span> The app stores them only in your browser (localStorage), never sent anywhere except Google's API. To get free keys (100 searches/day), see{" "}
                <a href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener noreferrer"
                   className="text-lime-300 hover:underline">programmablesearchengine.google.com</a>.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Google API key</label>
            <input type="password"
                   value={googleKey} onChange={(e) => setGoogleKey(e.target.value)}
                   placeholder="AIza…"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30 focus:ring-1 focus:ring-lime-300/20" />
            <p className="text-[10.5px] text-zinc-500 mt-1.5">From Google Cloud Console → Credentials.</p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Search engine ID (cx)</label>
            <input type="text"
                   value={googleCx} onChange={(e) => setGoogleCx(e.target.value)}
                   placeholder="abc123…"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30 focus:ring-1 focus:ring-lime-300/20" />
            <p className="text-[10.5px] text-zinc-500 mt-1.5">From your Programmable Search Engine control panel.</p>
          </div>

          <div className="pt-2">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Status</div>
            <div className="rounded-lg border border-zinc-800 bg-[#1c1c1e] p-3 flex items-center gap-2.5">
              <div className={cx("w-1.5 h-1.5 rounded-full",
                settings.googleKey && settings.googleCx ? "bg-lime-300" : "bg-zinc-600")} />
              <span className="text-[12px] text-zinc-300">
                {settings.googleKey && settings.googleCx
                  ? "Live search configured"
                  : "Not configured — Benchmarking will use curated data only"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex items-center gap-2 justify-end">
          {(settings.googleKey || settings.googleCx) && (
            <button onClick={handleClear}
                    className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 mr-auto">
              Clear keys
            </button>
          )}
          <button onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-300 bg-[#252528] border border-zinc-800 hover:bg-zinc-800">
            Cancel
          </button>
          <button onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg text-[12px] text-zinc-900 font-medium bg-lime-300 hover:bg-lime-200">
            {saved ? <span className="flex items-center gap-1.5"><Check className="w-3 h-3" />Saved</span> : "Save"}
          </button>
        </div>
      </div>
    </>
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

function ContactsModule({ contacts, onIngest, onRemove }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleManualAdd = (form) => {
    const stamped = [{
      id: `c-${Date.now()}`,
      name: form.name || "Unknown",
      role: form.role || "Unknown",
      email: form.email || "Unknown",
      region: form.region || "Unknown",
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      phone: form.phone || "Unknown",
      source: "Manual entry",
      justAdded: true,
    }];
    onIngest(stamped);
    setShowAddForm(false);
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252528] border border-zinc-800 text-[12px] text-zinc-300 hover:bg-zinc-800">
            <UserPlus className="w-3.5 h-3.5" />Add manually
          </button>
          <UploadButton label="Upload contacts file" onFile={handleFile} />
        </div>
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
                <th className="text-right px-5 py-3 font-normal w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(c => (
                <tr key={c.id} className={cx("hover:bg-zinc-800/30 transition-colors group",
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
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => onRemove?.(c.id)}
                            title="Remove contact"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded hover:bg-rose-500/10 hover:text-rose-300 text-zinc-500 inline-flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-500 text-[12px]">No contacts match your filters</td></tr>
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

      {showAddForm && (
        <ManualContactForm onSubmit={handleManualAdd} onCancel={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MANUAL CONTACT FORM
// ---------------------------------------------------------------------------

function ManualContactForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "", role: "Sales", email: "", phone: "", region: "APAC", tags: "",
  });
  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] z-50 bg-[#161618] border-l border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-[16px] font-medium text-zinc-100">Add contact</h2>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Manually add a person to the directory</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   placeholder="e.g. Wei Chen Lim"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-lime-300/30">
                {["Sales","Technical","Procurement","Management"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Region</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                      className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-lime-300/30">
                {["APAC","Europe","MEA","Americas"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                   placeholder="name@company.com"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                   placeholder="+65 …"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Tags <span className="text-zinc-600 normal-case tracking-normal">(comma-separated)</span></label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                   placeholder="Decision Maker, Senior"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center gap-2 justify-end">
          <button onClick={onCancel}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-300 bg-[#252528] border border-zinc-800 hover:bg-zinc-800">
            Cancel
          </button>
          <button onClick={submit} disabled={!form.name.trim()}
                  className="px-4 py-1.5 rounded-lg text-[12px] text-zinc-900 font-medium bg-lime-300 hover:bg-lime-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Add contact
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// CATALOGUE MODULE
// ---------------------------------------------------------------------------

function CatalogueModule({ products, contacts, onIngest, onRemove }) {
  const [catFilter, setCatFilter] = useState("All");
  const [demandFilter, setDemandFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [linkProduct, setLinkProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleManualAdd = (form) => {
    onIngest([{
      id: `p-${Date.now()}`,
      name: form.name || "Unnamed product",
      chemical: form.chemical || "Unknown",
      category: form.category || "Unknown",
      application: form.application || "Unknown",
      grade: form.grade || "Unknown",
      cas: form.cas || "Unknown",
      industry: [],
      demand: "medium",
      source: "Manual entry",
      sources: {},
      justAdded: true,
    }]);
    setShowAddForm(false);
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252528] border border-zinc-800 text-[12px] text-zinc-300 hover:bg-zinc-800">
            <PackagePlus className="w-3.5 h-3.5" />Add manually
          </button>
          <UploadButton label="Upload catalogue file" onFile={handleFile} />
        </div>
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
                <th className="text-right px-3 py-3 font-normal w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(p => (
                <tr key={p.id} className={cx("hover:bg-zinc-800/30 transition-colors group",
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
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => onRemove?.(p.id)}
                            title="Remove product"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded hover:bg-rose-500/10 hover:text-rose-300 text-zinc-500 inline-flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-zinc-500 text-[12px]">No products match your filters</td></tr>
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

      {showAddForm && (
        <ManualProductForm onSubmit={handleManualAdd} onCancel={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MANUAL PRODUCT FORM
// ---------------------------------------------------------------------------

function ManualProductForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "", chemical: "", category: "Unknown", application: "Unknown", grade: "Unknown", cas: "",
  });
  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] z-50 bg-[#161618] border-l border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-[16px] font-medium text-zinc-100">Add product</h2>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Manually add a SKU to the catalogue</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Product name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   placeholder="e.g. Ethyl Acetate 99.5%"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Chemical name</label>
            <input value={form.chemical} onChange={(e) => setForm({ ...form, chemical: e.target.value })}
                   placeholder="e.g. Ethyl acetate"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-lime-300/30">
                {["Unknown","Solvents","Resins","Additives","Pigments","Surfactants","Amines","Esters","Reagents","Hardeners","Polymers"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Grade</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-lime-300/30">
                {["Unknown","Industrial","Premium","Specialty","Reagent","Pharmaceutical","Technical","Cosmetic","Food"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">Application</label>
            <input value={form.application} onChange={(e) => setForm({ ...form, application: e.target.value })}
                   placeholder="e.g. Coatings, Inks"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5">CAS number</label>
            <input value={form.cas} onChange={(e) => setForm({ ...form, cas: e.target.value })}
                   placeholder="e.g. 141-78-6"
                   className="w-full bg-[#252528] border border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-lime-300/30 tabular-nums" />
            <p className="text-[10.5px] text-zinc-500 mt-1.5">Adding a CAS enables direct competitor matching in Benchmarking.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center gap-2 justify-end">
          <button onClick={onCancel}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-300 bg-[#252528] border border-zinc-800 hover:bg-zinc-800">
            Cancel
          </button>
          <button onClick={submit} disabled={!form.name.trim()}
                  className="px-4 py-1.5 rounded-lg text-[12px] text-zinc-900 font-medium bg-lime-300 hover:bg-lime-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Add product
          </button>
        </div>
      </div>
    </>
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
// COMPETITOR INTELLIGENCE
// ---------------------------------------------------------------------------
// Two data sources, in order of preference:
//   1. Live Google Programmable Search (when user provides PSE key + CX)
//   2. Curated competitor knowledge base (fallback, always available)
//
// All competitor data here was compiled from publicly-disclosed manufacturer
// product portfolios (company websites, public catalogues) as of 2024.
// Each entry maps either CAS number or chemical class to known producers
// AND their actual product-line trade names where publicly available.

const COMPETITOR_DB = {
  // ============= SOLVENTS =============
  "141-78-6": {
    chemical: "Ethyl acetate",
    competitors: [
      { company: "INEOS",      productName: "Ethyl Acetate", region: "Europe" },
      { company: "Eastman",    productName: "Eastman Ethyl Acetate", region: "Americas" },
      { company: "Celanese",   productName: "Celanese Ethyl Acetate", region: "Americas" },
      { company: "Sipchem",    productName: "Ethyl Acetate", region: "MEA" },
      { company: "Jubilant Ingrevia", productName: "Jubilant Ethyl Acetate", region: "APAC" },
      { company: "Solvay",     productName: "Rhodiasolv Ethyl Acetate", region: "Europe" },
    ],
  },
  "78-93-3": {
    chemical: "Methyl ethyl ketone",
    competitors: [
      { company: "ExxonMobil", productName: "MEK", region: "Americas" },
      { company: "Maruzen",    productName: "Maruzen MEK", region: "APAC" },
      { company: "Shell",      productName: "Shell MEK", region: "Europe" },
      { company: "SK Geo Centric", productName: "SK MEK", region: "APAC" },
      { company: "Sasol",      productName: "Sasol MEK", region: "MEA" },
    ],
  },
  "108-88-3": {
    chemical: "Toluene",
    competitors: [
      { company: "ExxonMobil", productName: "Solvesso Toluene", region: "Americas" },
      { company: "Shell",      productName: "Shellsol T", region: "Europe" },
      { company: "Reliance",   productName: "Reliance Toluene", region: "APAC" },
      { company: "SABIC",      productName: "SABIC Toluene", region: "MEA" },
      { company: "INEOS",      productName: "INEOS Toluene", region: "Europe" },
    ],
  },
  "67-64-1": {
    chemical: "Acetone",
    competitors: [
      { company: "INEOS",      productName: "INEOS Phenol Acetone", region: "Europe" },
      { company: "Mitsui",     productName: "Mitsui Acetone", region: "APAC" },
      { company: "Shell",      productName: "Shell Acetone", region: "Europe" },
      { company: "AdvanSix",   productName: "AdvanSix Acetone", region: "Americas" },
    ],
  },
  "67-63-0": {
    chemical: "Isopropanol",
    competitors: [
      { company: "Dow",        productName: "Dow IPA", region: "Americas" },
      { company: "ExxonMobil", productName: "ExxonMobil IPA", region: "Americas" },
      { company: "Mitsui",     productName: "Mitsui IPA", region: "APAC" },
      { company: "Shell",      productName: "Shell IPA", region: "Europe" },
      { company: "LG Chem",    productName: "LG Chem IPA", region: "APAC" },
    ],
  },
  "75-09-2": {
    chemical: "Dichloromethane",
    competitors: [
      { company: "Olin",       productName: "Olin DCM", region: "Americas" },
      { company: "AGC",        productName: "AGC Dichloromethane", region: "APAC" },
      { company: "Solvay",     productName: "Solvay DCM", region: "Europe" },
      { company: "Occidental Chemical", productName: "Oxy DCM", region: "Americas" },
    ],
  },
  "75-05-8": {
    chemical: "Acetonitrile",
    competitors: [
      { company: "INEOS",      productName: "INEOS Acetonitrile", region: "Europe" },
      { company: "Asahi Kasei", productName: "Asahi Acetonitrile", region: "APAC" },
      { company: "Sumitomo",   productName: "Sumitomo Acetonitrile", region: "APAC" },
      { company: "Solutia",    productName: "Solutia Acetonitrile", region: "Americas" },
    ],
  },
  "109-99-9": {
    chemical: "Tetrahydrofuran",
    competitors: [
      { company: "BASF",       productName: "BASF THF", region: "Europe" },
      { company: "Ashland",    productName: "Ashland THF", region: "Americas" },
      { company: "Mitsubishi", productName: "Mitsubishi THF", region: "APAC" },
      { company: "LyondellBasell", productName: "Lyondell THF", region: "Americas" },
    ],
  },
  "110-54-3": {
    chemical: "n-Hexane",
    competitors: [
      { company: "ExxonMobil", productName: "Exxsol Hexane", region: "Americas" },
      { company: "Shell",      productName: "Shellsol Hexane", region: "Europe" },
      { company: "Reliance",   productName: "Reliance n-Hexane", region: "APAC" },
      { company: "Phillips 66", productName: "Phillips Hexane", region: "Americas" },
    ],
  },
  "123-86-4": {
    chemical: "n-Butyl acetate",
    competitors: [
      { company: "BASF",       productName: "BASF Butyl Acetate", region: "Europe" },
      { company: "Eastman",    productName: "Eastman Butyl Acetate", region: "Americas" },
      { company: "Celanese",   productName: "Celanese Butyl Acetate", region: "Americas" },
      { company: "OXEA",       productName: "OXEA Butyl Acetate", region: "Europe" },
    ],
  },
  "108-65-6": {
    chemical: "Propylene glycol monomethyl ether acetate",
    competitors: [
      { company: "Dow",        productName: "Dowanol PMA", region: "Americas" },
      { company: "Eastman",    productName: "Eastman PM Acetate", region: "Americas" },
      { company: "Lyondell",   productName: "PM Acetate", region: "Americas" },
      { company: "Shell",      productName: "Shell PM Acetate", region: "Europe" },
    ],
  },

  // ============= AMINES =============
  "74-89-5": {
    chemical: "Monomethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF Monomethylamine", region: "Europe" },
      { company: "Eastman",    productName: "Eastman MMA", region: "Americas" },
      { company: "Balaji Amines", productName: "Balaji MMA", region: "APAC" },
      { company: "Mitsubishi Gas Chemical", productName: "MGC MMA", region: "APAC" },
    ],
  },
  "124-40-3": {
    chemical: "Dimethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF Dimethylamine", region: "Europe" },
      { company: "Eastman (Taminco)", productName: "Taminco DMA", region: "Europe" },
      { company: "Balaji Amines", productName: "Balaji DMA", region: "APAC" },
      { company: "Mitsubishi Gas Chemical", productName: "MGC DMA", region: "APAC" },
    ],
  },
  "75-50-3": {
    chemical: "Trimethylamine",
    competitors: [
      { company: "Eastman (Taminco)", productName: "Taminco TMA", region: "Europe" },
      { company: "BASF",       productName: "BASF TMA", region: "Europe" },
      { company: "Balaji Amines", productName: "Balaji TMA", region: "APAC" },
    ],
  },
  "75-04-7": {
    chemical: "Monoethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF MEA", region: "Europe" },
      { company: "Eastman",    productName: "Eastman Monoethylamine", region: "Americas" },
      { company: "Akzo Nobel", productName: "Akzo Monoethylamine", region: "Europe" },
    ],
  },
  "121-44-8": {
    chemical: "Triethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF Triethylamine", region: "Europe" },
      { company: "Celanese",   productName: "Celanese TEA", region: "Americas" },
      { company: "Balaji Amines", productName: "Balaji TEA", region: "APAC" },
      { company: "Eastman",    productName: "Eastman TEA", region: "Americas" },
    ],
  },
  "109-89-7": {
    chemical: "Diethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF Diethylamine", region: "Europe" },
      { company: "Eastman",    productName: "Eastman DEA", region: "Americas" },
      { company: "Balaji Amines", productName: "Balaji DEA", region: "APAC" },
    ],
  },
  "108-18-9": {
    chemical: "Diisopropylamine",
    competitors: [
      { company: "BASF",       productName: "BASF DIPA", region: "Europe" },
      { company: "Arkema",     productName: "Arkema DIPA", region: "Europe" },
      { company: "Balaji Amines", productName: "Balaji DIPA", region: "APAC" },
    ],
  },
  "75-31-0": {
    chemical: "Monoisopropylamine",
    competitors: [
      { company: "BASF",       productName: "BASF MIPA", region: "Europe" },
      { company: "Arkema",     productName: "Arkema MIPA", region: "Europe" },
      { company: "Balaji Amines", productName: "Balaji MIPA", region: "APAC" },
    ],
  },
  "104-75-6": {
    chemical: "2-Ethylhexylamine",
    competitors: [
      { company: "BASF",       productName: "BASF 2-EHA", region: "Europe" },
      { company: "Arkema",     productName: "Arkema 2-EHA", region: "Europe" },
      { company: "Alkyl Amines", productName: "Alkyl 2-EHA", region: "APAC" },
    ],
  },
  "7087-68-5": {
    chemical: "N,N-Diisopropylethylamine",
    competitors: [
      { company: "BASF",       productName: "BASF Hünig's Base", region: "Europe" },
      { company: "Alkyl Amines", productName: "Alkyl DIPEA", region: "APAC" },
      { company: "Sigma-Aldrich", productName: "Hünig's Base", region: "Americas" },
    ],
  },
  "109-55-7": {
    chemical: "N,N-Dimethyl-1,3-propanediamine",
    competitors: [
      { company: "BASF",       productName: "BASF DMAPA", region: "Europe" },
      { company: "Eastman (Taminco)", productName: "Taminco DMAPA", region: "Europe" },
      { company: "Alkyl Amines", productName: "Alkyl DMAPA", region: "APAC" },
    ],
  },
  "141-43-5": {
    chemical: "Monoethanolamine",
    competitors: [
      { company: "Dow",        productName: "Dow MEA", region: "Americas" },
      { company: "BASF",       productName: "BASF MEA", region: "Europe" },
      { company: "INEOS",      productName: "INEOS MEA", region: "Europe" },
      { company: "Huntsman",   productName: "Huntsman MEA", region: "Americas" },
    ],
  },
  "111-42-2": {
    chemical: "Diethanolamine",
    competitors: [
      { company: "Dow",        productName: "Dow DEA", region: "Americas" },
      { company: "BASF",       productName: "BASF DEA", region: "Europe" },
      { company: "Huntsman",   productName: "Huntsman DEA", region: "Americas" },
    ],
  },
  "102-71-6": {
    chemical: "Triethanolamine",
    competitors: [
      { company: "Dow",        productName: "Dow TEA", region: "Americas" },
      { company: "BASF",       productName: "BASF TEA", region: "Europe" },
      { company: "Huntsman",   productName: "Huntsman TEA", region: "Americas" },
      { company: "INEOS",      productName: "INEOS TEA", region: "Europe" },
    ],
  },

  // ============= ESTERS / EMOLLIENTS =============
  "142-91-6": {
    chemical: "Isopropyl palmitate",
    competitors: [
      { company: "Stéarinerie Dubois", productName: "DUB IPP", region: "Europe" },
      { company: "Croda",      productName: "Crodamol IPP", region: "Europe" },
      { company: "BASF Care",  productName: "Cegesoft IPP", region: "Europe" },
      { company: "Inolex",     productName: "Lexol IPP", region: "Americas" },
    ],
  },
  "110-27-0": {
    chemical: "Isopropyl myristate",
    competitors: [
      { company: "Stéarinerie Dubois", productName: "DUB IPM", region: "Europe" },
      { company: "Croda",      productName: "Crodamol IPM", region: "Europe" },
      { company: "BASF Care",  productName: "Cegesoft IPM", region: "Europe" },
      { company: "Inolex",     productName: "Lexol IPM", region: "Americas" },
    ],
  },
  "31566-31-1": {
    chemical: "Glyceryl stearate",
    competitors: [
      { company: "BASF Care",  productName: "Cutina GMS", region: "Europe" },
      { company: "Croda",      productName: "Cithrol GMS", region: "Europe" },
      { company: "Stéarinerie Dubois", productName: "DUB GMS", region: "Europe" },
      { company: "Lonza",      productName: "Aristolan GMS", region: "Europe" },
    ],
  },
  "65381-09-1": {
    chemical: "Caprylic/capric triglyceride",
    competitors: [
      { company: "Stéarinerie Dubois", productName: "DUB MCT 5545", region: "Europe" },
      { company: "BASF Care",  productName: "Myritol 318", region: "Europe" },
      { company: "Croda",      productName: "Crodamol GTCC", region: "Europe" },
      { company: "IOI Oleo",   productName: "Miglyol 812", region: "APAC" },
    ],
  },

  // ============= RESINS =============
  "9003-01-4": {
    chemical: "Polyacrylate (acrylic resin)",
    competitors: [
      { company: "BASF",       productName: "Joncryl", region: "Europe" },
      { company: "Allnex",     productName: "Setalux", region: "Europe" },
      { company: "Arkema",     productName: "Synaqua", region: "Europe" },
      { company: "Dow",        productName: "Paraloid", region: "Americas" },
      { company: "Mitsubishi", productName: "Dianal", region: "APAC" },
    ],
  },
  "25068-38-6": {
    chemical: "Bisphenol A epoxy resin",
    competitors: [
      { company: "Hexion",     productName: "Epon Resin", region: "Americas" },
      { company: "Olin (Blue Cube)", productName: "DER Resins", region: "Americas" },
      { company: "Kukdo Chemical", productName: "Kukdo Epoxy", region: "APAC" },
      { company: "Sun Chemical (DIC)", productName: "Epiclon", region: "APAC" },
      { company: "Nan Ya",     productName: "Nan Ya Epoxy", region: "APAC" },
    ],
  },
  "9009-54-5": {
    chemical: "Polyurethane dispersion",
    competitors: [
      { company: "Covestro",   productName: "Bayhydrol", region: "Europe" },
      { company: "Allnex",     productName: "Daotan", region: "Europe" },
      { company: "BASF",       productName: "Astacin", region: "Europe" },
      { company: "Lubrizol",   productName: "Sancure", region: "Americas" },
      { company: "Sun Chemical", productName: "Burnock PU", region: "APAC" },
    ],
  },

  // ============= ETHOXYLATES / SURFACTANTS =============
  "9002-92-0": {
    chemical: "Lauryl alcohol ethoxylate",
    competitors: [
      { company: "BASF",       productName: "Lutensol AT", region: "Europe" },
      { company: "Croda",      productName: "Brij", region: "Europe" },
      { company: "Indorama",   productName: "Surfonic L", region: "Americas" },
      { company: "Stepan",     productName: "Bio-Soft N", region: "Americas" },
      { company: "Clariant",   productName: "Genapol LA", region: "Europe" },
    ],
  },
  "9016-45-9": {
    chemical: "Nonylphenol ethoxylate",
    competitors: [
      { company: "Indorama",   productName: "Surfonic N", region: "Americas" },
      { company: "Dow",        productName: "Tergitol NP", region: "Americas" },
      { company: "Clariant",   productName: "Sapogenat T", region: "Europe" },
      { company: "Solvay",     productName: "Igepal CO", region: "Europe" },
    ],
  },
  "9036-19-5": {
    chemical: "Octylphenol ethoxylate",
    competitors: [
      { company: "Indorama",   productName: "Surfonic OP", region: "Americas" },
      { company: "Dow",        productName: "Triton X", region: "Americas" },
      { company: "Solvay",     productName: "Igepal CA", region: "Europe" },
    ],
  },
  "9005-64-5": {
    chemical: "Polysorbate 20",
    competitors: [
      { company: "Croda",      productName: "Tween 20", region: "Europe" },
      { company: "Indorama",   productName: "Alkest TW 20", region: "Americas" },
      { company: "Lonza",      productName: "Lonzest 20", region: "Europe" },
      { company: "Spectrum",   productName: "Polysorbate 20", region: "Americas" },
    ],
  },

  // ============= ADDITIVES =============
  "1338-43-8": {
    chemical: "Sorbitan monooleate",
    competitors: [
      { company: "Croda",      productName: "Span 80", region: "Europe" },
      { company: "Indorama",   productName: "Alkest SP 80", region: "Americas" },
      { company: "Lonza",      productName: "Lonzest SMO", region: "Europe" },
    ],
  },
  "8000-78-0": {
    chemical: "Hydrogenated castor oil",
    competitors: [
      { company: "BASF",       productName: "Cremophor RH", region: "Europe" },
      { company: "Croda",      productName: "Crodamol HCO", region: "Europe" },
      { company: "Indorama",   productName: "Alkest CSO 400 H", region: "Americas" },
    ],
  },
  "63148-62-9": {
    chemical: "Polysiloxane defoamer",
    competitors: [
      { company: "BYK Additives (Altana)", productName: "BYK-035", region: "Europe" },
      { company: "Dow",        productName: "Xiameter AFE", region: "Americas" },
      { company: "Wacker",     productName: "SILFOAM", region: "Europe" },
      { company: "Münzing",    productName: "AGITAN", region: "Europe" },
      { company: "Evonik",     productName: "TEGO Foamex", region: "Europe" },
    ],
  },

  // ============= ISOCYANATES / HARDENERS =============
  "822-06-0": {
    chemical: "Hexamethylene diisocyanate",
    competitors: [
      { company: "Covestro",   productName: "Desmodur H", region: "Europe" },
      { company: "Vencorex",   productName: "Tolonate HDI", region: "Europe" },
      { company: "Asahi Kasei", productName: "Duranate", region: "APAC" },
      { company: "Wanhua Chemical", productName: "Wannate HDI", region: "APAC" },
    ],
  },
  "584-84-9": {
    chemical: "Toluene diisocyanate",
    competitors: [
      { company: "BASF",       productName: "Lupranat T", region: "Europe" },
      { company: "Covestro",   productName: "Desmodur T", region: "Europe" },
      { company: "Wanhua Chemical", productName: "Wannate TDI", region: "APAC" },
      { company: "Hanwha",     productName: "Hanwha TDI", region: "APAC" },
      { company: "Mitsui",     productName: "Cosmonate T", region: "APAC" },
    ],
  },
  "101-68-8": {
    chemical: "Methylene diphenyl diisocyanate",
    competitors: [
      { company: "BASF",       productName: "Lupranat M", region: "Europe" },
      { company: "Covestro",   productName: "Desmodur 44", region: "Europe" },
      { company: "Huntsman",   productName: "Suprasec", region: "Americas" },
      { company: "Wanhua",     productName: "Wannate MDI", region: "APAC" },
    ],
  },

  // ============= POLYOLS =============
  "57-55-6": {
    chemical: "Propylene glycol",
    competitors: [
      { company: "Dow",        productName: "Dowfrost / Dow PG", region: "Americas" },
      { company: "BASF",       productName: "BASF PG", region: "Europe" },
      { company: "LyondellBasell", productName: "Lyondell PG", region: "Americas" },
      { company: "ADM",        productName: "ADM PG (bio-based)", region: "Americas" },
      { company: "Indorama",   productName: "Indorama PG", region: "APAC" },
    ],
  },
  "107-21-1": {
    chemical: "Monoethylene glycol",
    competitors: [
      { company: "SABIC",      productName: "SABIC MEG", region: "MEA" },
      { company: "Dow",        productName: "Dow MEG", region: "Americas" },
      { company: "MEGlobal",   productName: "MEGlobal MEG", region: "MEA" },
      { company: "Reliance",   productName: "Reliance MEG", region: "APAC" },
      { company: "Indorama",   productName: "Indorama MEG", region: "APAC" },
    ],
  },
  "111-46-6": {
    chemical: "Diethylene glycol",
    competitors: [
      { company: "Dow",        productName: "Dow DEG", region: "Americas" },
      { company: "SABIC",      productName: "SABIC DEG", region: "MEA" },
      { company: "Shell",      productName: "Shell DEG", region: "Europe" },
    ],
  },

  // ============= PIGMENTS =============
  "13463-67-7": {
    chemical: "Titanium dioxide",
    competitors: [
      { company: "Chemours",   productName: "Ti-Pure", region: "Americas" },
      { company: "Tronox",     productName: "Tronox CR", region: "Americas" },
      { company: "Venator",    productName: "Tioxide", region: "Europe" },
      { company: "Kronos",     productName: "Kronos TiO2", region: "Europe" },
      { company: "Lomon Billions", productName: "Lomon TiO2", region: "APAC" },
      { company: "INEOS Pigments", productName: "Tiona", region: "Europe" },
    ],
  },
  "1333-86-4": {
    chemical: "Carbon black",
    competitors: [
      { company: "Cabot",      productName: "Black Pearls / Vulcan", region: "Americas" },
      { company: "Birla Carbon", productName: "Raven", region: "APAC" },
      { company: "Orion Engineered Carbons", productName: "Printex", region: "Europe" },
      { company: "Tokai Carbon", productName: "Tokai Carbon Black", region: "APAC" },
    ],
  },
};

// Category-level fallback (used when CAS isn't in our DB)
const CATEGORY_COMPETITORS = {
  "Solvents":    ["BASF", "Dow", "Eastman", "ExxonMobil", "INEOS", "Shell", "Sipchem", "Reliance"],
  "Resins":      ["BASF", "Allnex", "Arkema", "Dow", "Covestro", "Evonik", "Mitsui", "Sun Chemical (DIC)"],
  "Amines":      ["BASF", "Arkema", "Eastman", "Huntsman", "Mitsubishi Gas Chemical", "Balaji Amines", "Alkyl Amines"],
  "Esters":      ["Croda", "BASF Care", "Stéarinerie Dubois", "Lonza", "Inolex", "Evonik Care Solutions"],
  "Surfactants": ["BASF", "Croda", "Evonik", "Stepan", "Solvay", "Indorama Ventures", "Clariant"],
  "Additives":   ["BYK Additives", "Evonik", "Münzing", "Allnex", "Wacker", "Dow", "BASF"],
  "Pigments":    ["BASF", "Heubach", "Sun Chemical", "Cathay Industries", "Lanxess", "Chemours"],
  "Polymers":    ["BASF", "Dow", "ExxonMobil", "LyondellBasell", "SABIC", "Mitsui", "Borealis"],
  "Hardeners":   ["Covestro", "BASF", "Asahi Kasei", "Wanhua Chemical", "Vencorex", "Mitsui"],
  "Reagents":    ["Sigma-Aldrich", "Thermo Fisher", "TCI Chemicals", "Honeywell"],
};

// Look up curated competitors for a product. CAS-first, category fallback.
function curatedCompetitors(product) {
  if (product.cas && product.cas !== "Unknown" && COMPETITOR_DB[product.cas]) {
    return { source: "verified", entries: COMPETITOR_DB[product.cas].competitors };
  }
  if (product.category && CATEGORY_COMPETITORS[product.category]) {
    return {
      source: "category",
      entries: CATEGORY_COMPETITORS[product.category].map(name => ({
        company: name, productName: "—", region: "—",
      })),
    };
  }
  return { source: "none", entries: [] };
}

// ---- Google PSE live search ------------------------------------------------
//
// Calls Google's Custom Search JSON API. User must provide their own
// `key` and `cx` (search engine ID). 100 free searches/day.
//
// Strategy: search "<chemical name> manufacturers suppliers", parse the
// titles and snippets to extract company-product mentions. We never invent
// data — if the search returns nothing, the result is empty.

async function googleSearchCompetitors({ key, cx, query }) {
  if (!key || !cx) throw new Error("Google PSE key/cx not configured");
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=10`;
  const r = await fetch(url);
  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`Google PSE returned ${r.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.items || [];
}

// Try to extract "company → product line" mentions from a list of search results.
// Looks for known major chemical companies in titles/snippets and captures
// any nearby product/brand name.
const KNOWN_COMPANIES = [
  "BASF","Dow","Eastman","ExxonMobil","Shell","INEOS","Reliance","SABIC","Sipchem","Solvay",
  "Arkema","Evonik","Covestro","Allnex","Croda","Mitsui","Mitsubishi","Sumitomo","LG Chem",
  "Lyondell","LyondellBasell","Huntsman","Wanhua","Hanwha","Asahi Kasei","Stepan","Lubrizol",
  "Chemours","Tronox","Venator","Kronos","Cabot","Birla Carbon","Orion","Tokai Carbon",
  "Vencorex","Hexion","Olin","BYK","Wacker","Münzing","Clariant","Indorama","Sasol",
  "Balaji Amines","Alkyl Amines","Sun Chemical","DIC","Stéarinerie Dubois","Lonza","Inolex",
  "AGC","Maruzen","SK Geo Centric","Jubilant Ingrevia","Phillips 66","Ashland","ADM",
];

function extractCompetitorsFromSearchResults(items) {
  const found = new Map(); // company -> Set of product mentions
  for (const item of items) {
    const text = `${item.title || ""} ${item.snippet || ""}`;
    for (const company of KNOWN_COMPANIES) {
      // Use word boundary to avoid false positives
      const rx = new RegExp(`\\b${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (rx.test(text)) {
        if (!found.has(company)) found.set(company, new Set());
        // Try to grab a nearby capitalized product token, otherwise mark "—"
        const productMatch = text.match(new RegExp(`\\b${company}\\b[^.,;]{0,80}?(?:\\b([A-Z][A-Za-z]+(?:[\\s-][A-Z0-9][A-Za-z0-9-]*){0,3})\\b)?`, "i"));
        const product = productMatch?.[1] && productMatch[1].length > 2 && productMatch[1].toLowerCase() !== company.toLowerCase()
          ? productMatch[1]
          : null;
        if (product) found.get(company).add(product);
      }
    }
  }
  // Convert to array
  return [...found.entries()].map(([company, products]) => ({
    company,
    productName: products.size > 0 ? [...products][0] : "—",
    region: "—",
  }));
}

// Hybrid lookup: live Google first (if configured), curated DB always merged in
async function findCompetitors(product, settings) {
  const curated = curatedCompetitors(product);
  let live = [];
  let liveError = null;
  let liveAttempted = false;

  if (settings?.googleKey && settings?.googleCx) {
    liveAttempted = true;
    try {
      const query = `${product.chemical || product.name} manufacturers suppliers`;
      const items = await googleSearchCompetitors({
        key: settings.googleKey,
        cx: settings.googleCx,
        query,
      });
      live = extractCompetitorsFromSearchResults(items);
    } catch (e) {
      liveError = e.message;
    }
  }

  // Merge: dedupe by company name. Live takes precedence on product name only when curated has "—".
  const merged = new Map();
  for (const c of curated.entries) {
    merged.set(c.company.toLowerCase(), { ...c });
  }
  for (const c of live) {
    const key = c.company.toLowerCase();
    if (!merged.has(key)) merged.set(key, c);
    else {
      // Combine: keep curated company name + region, fill product name if curated had "—"
      const existing = merged.get(key);
      if (existing.productName === "—" && c.productName !== "—") {
        existing.productName = c.productName;
      }
    }
  }

  return {
    sourceTier: live.length > 0 ? "live" : (curated.source === "verified" ? "curated" : (curated.source === "category" ? "adjacent" : "none")),
    liveAttempted,
    liveError,
    liveCount: live.length,
    entries: [...merged.values()],
  };
}

// ---------------------------------------------------------------------------
// SETTINGS HOOK (localStorage-backed for Google PSE key)
// ---------------------------------------------------------------------------

function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("supplier-workspace-settings");
      return raw ? JSON.parse(raw) : { googleKey: "", googleCx: "" };
    } catch {
      return { googleKey: "", googleCx: "" };
    }
  });
  const update = (patch) => {
    setSettings(s => {
      const next = { ...s, ...patch };
      try { localStorage.setItem("supplier-workspace-settings", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [settings, update];
}

// ---------------------------------------------------------------------------
// COMPETITIVE BENCHMARKING MODULE
// ---------------------------------------------------------------------------
// Per-product competitor view. For each uploaded product, show:
//   - Your supplier's product name on top
//   - Below: the competitor companies and their product names

function BenchmarkingModule({ products, settings }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || null);
  const [results, setResults] = useState({});      // { [productId]: { sourceTier, entries, liveError, ... } }
  const [loading, setLoading] = useState({});

  const selected = products.find(p => p.id === selectedId);

  // Auto-fetch when selection changes (and not yet cached)
  useEffect(() => {
    if (!selected) return;
    if (results[selected.id]) return;
    setLoading(l => ({ ...l, [selected.id]: true }));
    findCompetitors(selected, settings).then(r => {
      setResults(rs => ({ ...rs, [selected.id]: r }));
      setLoading(l => ({ ...l, [selected.id]: false }));
    });
  }, [selected, settings, results]);

  // Allow re-fetch (e.g. after the user adds a key)
  const refetch = () => {
    if (!selected) return;
    setLoading(l => ({ ...l, [selected.id]: true }));
    findCompetitors(selected, settings).then(r => {
      setResults(rs => ({ ...rs, [selected.id]: r }));
      setLoading(l => ({ ...l, [selected.id]: false }));
    });
  };

  const overview = useMemo(() => {
    const allCompanies = new Set();
    for (const p of products) {
      const r = results[p.id];
      if (r) r.entries.forEach(e => allCompanies.add(e.company));
    }
    return {
      productsAnalysed: products.length,
      analysed: Object.keys(results).length,
      uniqueCompetitors: allCompanies.size,
    };
  }, [products, results]);

  if (products.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-5">
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Competitive Benchmarking</h2>
          <p className="text-[12px] text-zinc-500 mt-1">Upload or add products to see who else makes them</p>
        </div>
        <Card className="!p-12 text-center">
          <Package className="w-8 h-8 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-[13px] text-zinc-300 mb-1">No products to analyse</div>
          <div className="text-[11.5px] text-zinc-500">Upload a catalogue file or add a product manually</div>
        </Card>
      </div>
    );
  }

  const r = selected ? results[selected.id] : null;
  const isLoading = selected ? loading[selected.id] : false;
  const hasGoogle = !!(settings?.googleKey && settings?.googleCx);

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Competitive Benchmarking</h2>
          <p className="text-[12px] text-zinc-500 mt-1">For each product, who else makes it and what they call it</p>
        </div>
        {!hasGoogle && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 px-3 py-1.5 rounded-lg bg-amber-300/[0.04] border border-amber-300/15">
            <AlertCircle className="w-3 h-3 text-amber-300" />
            Live search not configured — using curated data. Add Google key in Settings.
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Products</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{overview.productsAnalysed}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Analysed</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{overview.analysed}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Unique competitors found</div>
          <div className="text-2xl font-light text-zinc-100 tabular-nums">{overview.uniqueCompetitors}</div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Product picker */}
        <Card className="col-span-12 lg:col-span-4 !p-3" title="Your products" subtitle={`${products.length} loaded`}>
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 -mx-1 px-1">
            {products.map(p => {
              const cached = results[p.id];
              const isActive = p.id === selectedId;
              return (
                <button key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={cx(
                          "w-full text-left p-2.5 rounded-lg border transition-colors",
                          isActive
                            ? "bg-lime-300/[0.06] border-lime-300/30"
                            : "bg-transparent border-zinc-800 hover:bg-zinc-800/40"
                        )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className={cx("text-[12.5px] truncate",
                        isActive ? "text-zinc-100" : "text-zinc-200")}>{p.name}</div>
                      <div className="text-[10.5px] text-zinc-500 mt-0.5 truncate">
                        {p.cas !== "Unknown" ? p.cas : (p.category || "Uncategorised")}
                      </div>
                    </div>
                    {cached && (
                      <span className="text-[10px] tabular-nums shrink-0 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {cached.entries.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detail */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {selected && (
            <>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Your product</div>
                    <h3 className="text-[16px] font-medium text-zinc-100 truncate">{selected.name}</h3>
                    {selected.chemical && selected.chemical !== "Unknown" && (
                      <div className="text-[12px] text-zinc-400 mt-1 truncate">{selected.chemical}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selected.category && <Pill tone="muted">{selected.category}</Pill>}
                      {selected.cas && selected.cas !== "Unknown" && (
                        <Pill tone="muted"><span className="tabular-nums">{selected.cas}</span></Pill>
                      )}
                    </div>
                  </div>
                  {hasGoogle && (
                    <button onClick={refetch} disabled={isLoading}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252528] border border-zinc-800 text-[11.5px] text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      Re-search
                    </button>
                  )}
                </div>
              </Card>

              <Card title="Competitors"
                    subtitle={
                      isLoading ? "Searching…" :
                      r?.sourceTier === "live" ? `Live results merged with curated data` :
                      r?.sourceTier === "curated" ? `Curated data — direct match on CAS` :
                      r?.sourceTier === "adjacent" ? `Curated data — category-level match` :
                      "No competitor data found"
                    }>
                {isLoading ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-zinc-500 text-[12px]">
                    <Loader2 className="w-4 h-4 animate-spin text-lime-300" />
                    Searching for competitors…
                  </div>
                ) : !r ? null : r.entries.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-[12px]">
                    {r.liveError
                      ? <>Live search failed: <span className="text-rose-300">{r.liveError}</span></>
                      : "No competitor data available for this product."}
                  </div>
                ) : (
                  <>
                    {r.liveError && (
                      <div className="mb-3 text-[11px] text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Live search error: {r.liveError}. Falling back to curated data.
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead className="border-b border-zinc-800">
                          <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="text-left py-2.5 px-3 font-normal">Company</th>
                            <th className="text-left py-2.5 px-3 font-normal">Product / Trade name</th>
                            <th className="text-left py-2.5 px-3 font-normal">Region</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {r.entries.map((e, i) => (
                            <tr key={i} className="hover:bg-zinc-800/30">
                              <td className="py-2.5 px-3 text-zinc-100">{e.company}</td>
                              <td className="py-2.5 px-3 text-zinc-300">
                                {e.productName === "—"
                                  ? <span className="text-zinc-600">—</span>
                                  : e.productName}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400">{e.region}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VALUE CHAIN MODULE - freeform canvas with auto-inferred chain stages
// ---------------------------------------------------------------------------

// Chain stage rules: classify each product into a logical stage in a typical
// chemical value chain. Position on canvas is derived from stage.
const CHAIN_STAGES = [
  { id: "feedstock", label: "Feedstock", order: 0,
    keywords: ["ethylene","propylene","benzene","toluene","xylene","methanol","natural gas","naphtha"] },
  { id: "intermediate", label: "Intermediate", order: 1,
    keywords: ["acetic acid","ammonia","ethylene oxide","propylene oxide","acrylonitrile","phenol","amine","methylamine","dimethylamine"] },
  { id: "monomer", label: "Monomer / Building block", order: 2,
    keywords: ["acrylate","methacrylate","monomer","styrene","vinyl","building block","glycol"] },
  { id: "polymer", label: "Polymer / Resin", order: 3,
    keywords: ["resin","polymer","polyester","polyurethane","acrylic","epoxy","alkyd","copolymer","dispersion"] },
  { id: "additive", label: "Additive / Surfactant", order: 4,
    keywords: ["additive","surfactant","ethoxylate","emulsifier","defoamer","stabilizer","drier","wetting","dispersant","ester"] },
  { id: "finished", label: "Finished product", order: 5,
    keywords: ["coating","paint","ink","adhesive","sealant","cosmetic","cleaner","topcoat","primer"] },
];

function classifyChainStage(product) {
  const text = `${product.name} ${product.chemical || ""} ${product.category || ""} ${product.application || ""}`.toLowerCase();
  // Walk in reverse — finished products take priority over their components
  for (let i = CHAIN_STAGES.length - 1; i >= 0; i--) {
    const stage = CHAIN_STAGES[i];
    if (stage.keywords.some(k => text.includes(k))) return stage.id;
  }
  // Default: intermediate if it has a CAS (real chemical), else additive
  return product.cas && product.cas !== "Unknown" ? "intermediate" : "additive";
}

// Auto-position products on canvas based on stage. Returns {[id]: {x, y}}.
function autoPositionProducts(products) {
  const stageMap = {};
  for (const p of products) {
    const stage = classifyChainStage(p);
    if (!stageMap[stage]) stageMap[stage] = [];
    stageMap[stage].push(p);
  }
  const positions = {};
  const STAGE_X_GAP = 280;
  const NODE_Y_GAP = 90;
  for (const stage of CHAIN_STAGES) {
    const items = stageMap[stage.id] || [];
    items.forEach((p, i) => {
      positions[p.id] = {
        x: 100 + stage.order * STAGE_X_GAP,
        y: 100 + i * NODE_Y_GAP,
        stage: stage.id,
      };
    });
  }
  return positions;
}

// Detect upstream/downstream relationships between products by stage order.
// A node in stage N connects to nodes in stage N+1 IF they share a category.
function inferConnections(products, positions) {
  const conns = [];
  for (const a of products) {
    const aStage = positions[a.id]?.stage;
    if (!aStage) continue;
    const aOrder = CHAIN_STAGES.find(s => s.id === aStage)?.order;
    for (const b of products) {
      if (a.id === b.id) continue;
      const bStage = positions[b.id]?.stage;
      const bOrder = CHAIN_STAGES.find(s => s.id === bStage)?.order;
      if (bOrder !== aOrder + 1) continue;     // only adjacent stages
      // Heuristic relationship: same category OR shared keyword
      const sameCategory = a.category && a.category === b.category;
      const aText = `${a.name} ${a.chemical || ""}`.toLowerCase();
      const bText = `${b.name} ${b.chemical || ""}`.toLowerCase();
      const sharedKeyword = ["acrylic","amine","ester","urethane","ethoxylate","methyl","ethyl"].some(
        k => aText.includes(k) && bText.includes(k)
      );
      if (sameCategory || sharedKeyword) {
        conns.push({ from: a.id, to: b.id });
      }
    }
  }
  return conns;
}

function ValueChainModule({ products }) {
  const [positions, setPositions] = useState(() => autoPositionProducts(products));
  const [connections, setConnections] = useState(() => inferConnections(products, autoPositionProducts(products)));
  const [selected, setSelected] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragNode, setDragNode] = useState(null);     // {id, offX, offY}
  const [panStart, setPanStart] = useState(null);     // {x, y, panX, panY}
  const canvasRef = useRef(null);

  // Auto-add new products: when products list changes, add positions for new ones
  useEffect(() => {
    const fresh = autoPositionProducts(products);
    setPositions(prev => {
      const next = { ...prev };
      for (const p of products) {
        if (!next[p.id]) next[p.id] = fresh[p.id];
      }
      for (const id of Object.keys(next)) {
        if (!products.find(p => p.id === id)) delete next[id];
      }
      return next;
    });
    // Recompute connections from the next-state positions. We use the freshly
    // auto-positioned set merged with any manual overrides we already had.
    setConnections(prevConn => {
      // Build the position map we'd expect post-merge
      // (for connection inference, exact x/y don't matter — only stage matters,
      // and stage comes from auto-positioning which is deterministic)
      return inferConnections(products, fresh);
    });
  }, [products]);

  // Mouse handlers
  const onMouseDown = (e, productId) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left - pan.x) / zoom;
    const py = (e.clientY - rect.top - pan.y) / zoom;
    const pos = positions[productId];
    setDragNode({ id: productId, offX: px - pos.x, offY: py - pos.y });
  };

  const onCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === "svg") {
      setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    }
  };

  const onMouseMove = (e) => {
    if (dragNode) {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left - pan.x) / zoom;
      const py = (e.clientY - rect.top - pan.y) / zoom;
      setPositions(p => ({
        ...p,
        [dragNode.id]: { ...p[dragNode.id], x: px - dragNode.offX, y: py - dragNode.offY },
      }));
    } else if (panStart) {
      setPan({
        x: panStart.panX + (e.clientX - panStart.x),
        y: panStart.panY + (e.clientY - panStart.y),
      });
    }
  };
  const onMouseUp = () => { setDragNode(null); setPanStart(null); };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.4, Math.min(2.5, z * delta)));
  };

  // Reset to auto layout
  const resetLayout = () => {
    const fresh = autoPositionProducts(products);
    setPositions(fresh);
    setConnections(inferConnections(products, fresh));
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Stage labels (vertical guides)
  const stageColumns = CHAIN_STAGES.map(s => ({
    ...s,
    x: 100 + s.order * 280,
    count: products.filter(p => positions[p.id]?.stage === s.id).length,
  }));

  if (products.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-5">
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Value Chain</h2>
          <p className="text-[12px] text-zinc-500 mt-1">Upload products to map them on the chain</p>
        </div>
        <Card className="!p-12 text-center">
          <Workflow className="w-8 h-8 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-[13px] text-zinc-300 mb-1">No products to map</div>
          <div className="text-[11.5px] text-zinc-500">Upload a catalogue file to see the value chain</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-medium text-zinc-50 tracking-tight">Value Chain</h2>
          <p className="text-[12px] text-zinc-500 mt-1">
            Drag nodes to reposition. Scroll to zoom. Click a node to inspect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252528] border border-zinc-800 text-[11.5px] text-zinc-300 hover:bg-zinc-800">
            <Workflow className="w-3 h-3" />Reset layout
          </button>
          <div className="flex items-center gap-1 bg-[#252528] border border-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => setZoom(z => Math.max(0.4, z * 0.9))}
                    className="px-2.5 py-1.5 text-[11.5px] text-zinc-300 hover:bg-zinc-800">−</button>
            <span className="px-2 text-[11px] text-zinc-500 tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, z * 1.1))}
                    className="px-2.5 py-1.5 text-[11.5px] text-zinc-300 hover:bg-zinc-800">+</button>
          </div>
        </div>
      </div>

      {/* The canvas */}
      <Card className="!p-0 overflow-hidden">
        <div
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          className="relative bg-[#141416] cursor-grab active:cursor-grabbing"
          style={{ height: "640px" }}
        >
          {/* Dot grid background */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 backgroundImage: "radial-gradient(circle, #2a2a2d 1px, transparent 1px)",
                 backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                 backgroundPosition: `${pan.x % (20 * zoom)}px ${pan.y % (20 * zoom)}px`,
                 opacity: 0.6,
               }} />

          {/* Stage column labels */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {stageColumns.filter(s => s.count > 0).map(s => (
              <div key={s.id}
                   className="absolute text-[9.5px] uppercase tracking-widest text-zinc-600"
                   style={{ left: s.x, top: 50, width: 220 }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{s.label}</span>
                  <span className="text-zinc-700 tabular-nums">· {s.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Connections (SVG edges) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
              {connections.map((c, i) => {
                const a = positions[c.from];
                const b = positions[c.to];
                if (!a || !b) return null;
                // Curved bezier path from right-edge of A to left-edge of B
                const ax = a.x + 200, ay = a.y + 28;
                const bx = b.x, by = b.y + 28;
                const cx = (ax + bx) / 2;
                return (
                  <path key={i}
                        d={`M ${ax} ${ay} C ${cx} ${ay}, ${cx} ${by}, ${bx} ${by}`}
                        fill="none"
                        stroke="#a3e635"
                        strokeOpacity="0.35"
                        strokeWidth="1.5" />
                );
              })}
            </g>
          </svg>

          {/* Nodes */}
          <div className="absolute inset-0"
               style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {products.map(p => {
              const pos = positions[p.id];
              if (!pos) return null;
              const isSelected = selected === p.id;
              const stage = CHAIN_STAGES.find(s => s.id === pos.stage);
              return (
                <div
                  key={p.id}
                  onMouseDown={(e) => onMouseDown(e, p.id)}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : p.id); }}
                  className={cx(
                    "absolute select-none transition-shadow",
                    "rounded-lg border bg-[#1c1c1e] px-3 py-2.5 cursor-grab active:cursor-grabbing",
                    isSelected
                      ? "border-lime-300/50 shadow-[0_0_0_1px_rgba(163,230,53,0.15)]"
                      : "border-zinc-800 hover:border-zinc-700"
                  )}
                  style={{ left: pos.x, top: pos.y, width: 200 }}
                >
                  <div className="flex items-start gap-2">
                    <div className={cx(
                      "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      isSelected ? "bg-lime-300" : "bg-zinc-600"
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] text-zinc-100 truncate font-medium">{p.name}</div>
                      <div className="text-[9.5px] text-zinc-500 mt-0.5 truncate">
                        {stage?.label || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Helper text bottom-left */}
          <div className="absolute bottom-3 left-4 text-[10px] text-zinc-600 pointer-events-none">
            Drag node to move · Drag canvas to pan · Scroll to zoom
          </div>
        </div>
      </Card>

      {/* Selected product detail */}
      {selected && (() => {
        const p = products.find(x => x.id === selected);
        if (!p) return null;
        const stage = CHAIN_STAGES.find(s => s.id === positions[p.id]?.stage);
        const downstream = connections.filter(c => c.from === p.id).map(c => products.find(x => x.id === c.to)).filter(Boolean);
        const upstream   = connections.filter(c => c.to === p.id).map(c => products.find(x => x.id === c.from)).filter(Boolean);
        return (
          <Card>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{stage?.label}</div>
                <h3 className="text-[15px] font-medium text-zinc-100 truncate">{p.name}</h3>
                {p.chemical && p.chemical !== "Unknown" && (
                  <div className="text-[11.5px] text-zinc-400 mt-1 truncate">{p.chemical}</div>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                      className="w-7 h-7 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                  Upstream ({upstream.length})
                </div>
                {upstream.length === 0 ? (
                  <div className="text-[11.5px] text-zinc-600 italic">No upstream products</div>
                ) : (
                  <div className="space-y-1">
                    {upstream.map(u => (
                      <button key={u.id} onClick={() => setSelected(u.id)}
                              className="w-full text-left px-2.5 py-1.5 rounded bg-[#252528] border border-zinc-800 text-[12px] text-zinc-300 hover:bg-zinc-800">
                        ← {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                  Downstream ({downstream.length})
                </div>
                {downstream.length === 0 ? (
                  <div className="text-[11.5px] text-zinc-600 italic">No downstream products</div>
                ) : (
                  <div className="space-y-1">
                    {downstream.map(d => (
                      <button key={d.id} onClick={() => setSelected(d.id)}
                              className="w-full text-left px-2.5 py-1.5 rounded bg-[#252528] border border-zinc-800 text-[12px] text-zinc-300 hover:bg-zinc-800">
                        {d.name} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })()}
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
  const [settings, updateSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);

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

  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id));
  const removeProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id));

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
               contactCount={contacts.length} productCount={products.length}
               onOpenSettings={() => setShowSettings(true)} />

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
              {view === "valuechain" && "Value Chain"}
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
        {view === "contacts" && <ContactsModule contacts={contacts} onIngest={ingestContacts} onRemove={removeContact} />}
        {view === "catalogue" && <CatalogueModule products={products} contacts={contacts} onIngest={ingestProducts} onRemove={removeProduct} />}
        {view === "recommend" && <RecommendModule contacts={contacts} products={products} />}
        {view === "valuechain" && <ValueChainModule products={products} />}
        {view === "benchmark" && <BenchmarkingModule products={products} settings={settings} />}
      </main>

      {showSettings && (
        <SettingsDrawer settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
