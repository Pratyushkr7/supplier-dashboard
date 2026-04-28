# Supplier Workspace — Deployment Guide

This is a complete React app, ready to deploy to Vercel. You don't need to write any code. Follow the steps below and you'll have a live URL in about 15 minutes.

---

## What's in this folder

```
supplier-workspace/
├── src/
│   ├── App.jsx          ← the actual app (everything you see lives here)
│   ├── main.jsx         ← startup file, don't edit
│   └── index.css        ← styling base, don't edit
├── public/
│   └── favicon.svg      ← the little icon in the browser tab
├── index.html           ← page wrapper, don't edit
├── package.json         ← list of libraries, don't edit
├── vite.config.js       ← build settings
├── tailwind.config.js   ← styling config
├── postcss.config.js    ← styling config
├── vercel.json          ← deployment settings for Vercel
├── .gitignore           ← tells Git what to ignore
└── README.md            ← this file
```

You will only ever upload the whole folder. You don't need to open any of those files.

---

## Step 1 — Get a free GitHub account (5 minutes)

GitHub is where your code lives. Vercel reads from it.

1. Go to **https://github.com** and click **Sign up**.
2. Pick a username, email, and password. Verify your email.
3. You're done. No paid plan needed.

---

## Step 2 — Get a free Vercel account (2 minutes)

Vercel is what turns your code into a live website.

1. Go to **https://vercel.com/signup**.
2. Click **Continue with GitHub** — it'll ask permission to connect your accounts. Allow it.
3. Pick the **Hobby** plan (it's free).
4. You're done.

---

## Step 3 — Upload the project to GitHub (5 minutes)

The easiest way without using any commands:

1. On GitHub, click the **+** in the top-right corner → **New repository**.
2. Repository name: `supplier-workspace` (or anything you like).
3. Leave it set to **Public** (or Private — doesn't matter, Vercel works with both).
4. **Don't** tick "Add a README" or "Add .gitignore" — leave those empty. We have our own.
5. Click **Create repository**.
6. On the next page you'll see a section "**…or upload an existing file**" — click that link (it's small, in the middle of the page).
7. **Drag and drop the entire `supplier-workspace` folder contents** into the upload box. Make sure you drop the *contents* (the `src` folder, `package.json`, `index.html`, etc.) — not the outer folder itself.
   - Tip: open the `supplier-workspace` folder, select all files inside (Ctrl+A on Windows, Cmd+A on Mac), then drag.
8. At the bottom, leave the commit message as-is and click **Commit changes**.
9. Wait about 30 seconds for everything to upload.

You should now see the file list (`src`, `index.html`, `package.json`, etc.) in your repository.

---

## Step 4 — Deploy to Vercel (3 minutes)

1. Go to **https://vercel.com/new**.
2. You'll see a list of your GitHub repositories. Find `supplier-workspace` and click **Import**.
3. Vercel will auto-detect that it's a Vite project. **Don't change any settings** — they're already correct because of the `vercel.json` file.
4. Click **Deploy**.
5. Wait 1–2 minutes. Vercel will install dependencies and build the project. You'll see a progress log.
6. When it's done, you'll see a confetti animation and a screenshot of your app. Click **Continue to Dashboard**.
7. You'll see a URL like `supplier-workspace-xxxxx.vercel.app`. **Click it.** That's your live site.

That's it. The site is live and anyone with the link can use it.

---

## Step 5 — Verify it works correctly (5 minutes)

Open the live URL and click through each of these to make sure nothing is broken:

**Dashboard tab** (the home screen)
- You should see the supplier name "Hexakron Specialty Chemicals" with a lime "Tier 1" pill
- Five stats: benchmarking bars, AI insights, commercial activity table, completeness score, etc.
- All text should be white/grey on a dark grey background
- No glowing or neon effects

**Contacts tab**
- A table of 5 seed contacts (Wei Chen Lim, Anika Raghavan, etc.)
- Click **Upload contacts file** at the top right
- Pick any text PDF that has contacts in it (like a business directory). Or skip — uploads are optional
- A drawer should slide in showing parsed contacts. You can edit any field. Click "Save N contacts" to ingest them

**Catalogue tab**
- Same as Contacts but for products
- Try uploading one of the supplier catalogue PDFs (Sun Chemical, Indorama, AACL, Stéarinerie Dubois — all work)
- Look at the parsed rows. Any field that says "Unknown" in italic grey will have a small lime sparkle button next to it
- Click the sparkle button. It calls PubChem (free chemistry database) to suggest a value. CAS numbers and chemical names work best — category/application are inferred from keywords

**Recommend tab**
- Type "Acrylic Resin" in the search box and press Enter (or click Match)
- You should get a ranked list of contacts best suited to handle that product
- Click the 👍 / 👎 buttons to nudge confidence scores up or down

**Gap Analysis tab**
- Four headline cards (coverage gaps, completeness %, etc.)
- A category × region matrix with green/amber/red cells
- Two side panels listing contact gaps and incomplete SKUs

**Benchmarking tab**
- Headline cards (composite score, peer percentile, lead time, certs)
- Five horizontal bars comparing Hexakron to peer median
- Strengths / Weaknesses panels
- Peer suppliers table at the bottom

If any of these don't load: see the troubleshooting section below.

---

## Common problems

**"The page is blank"**
- Wait 5 seconds — first load can be slow on free Vercel
- Check the URL is the one Vercel gave you, not localhost
- Hit refresh once

**"Upload doesn't do anything"**
- Make sure the file is a real text PDF, not a scanned image PDF. Photos of documents won't parse — the app explicitly does NOT do OCR
- CSV and Excel also work
- If it parses but extracts 0 rows, that means it found no contacts/CAS numbers — try a different file

**"Suggest button isn't working"**
- It calls https://pubchem.ncbi.nlm.nih.gov — if your network blocks that domain, the button silently does nothing. Try from a different network
- Some products simply aren't in PubChem (especially proprietary brand names like "BURNOCK AC-1218"). The chemistry inference (category/application/grade) still works heuristically

**"It looks different from what I expected"**
- This is the live design as built. If something is genuinely off (e.g. text is black, background is white) the Tailwind CSS file failed to load. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

**"Vercel shows a build error"**
- Most common cause: when uploading to GitHub, you accidentally dropped the outer folder instead of its contents. The repo should have `package.json` at the top level, not nested inside another folder
- Fix: delete the GitHub repo, create a new one, and re-upload making sure `package.json`, `index.html`, etc. are at the root

---

## Updating the app later

Whenever you want to change something:

1. Go to your GitHub repo → click any file → click the pencil icon to edit
2. Make your change → scroll down → "Commit changes"
3. Vercel will automatically redeploy in about 60 seconds. The live URL stays the same.

If you'd rather have a developer make changes for you, share your GitHub repo with them and they can push updates — Vercel handles the rest automatically.

---

## What this costs

- **GitHub**: free for unlimited public and private repos
- **Vercel Hobby plan**: free for personal projects, includes a custom domain if you have one
- **PubChem**: free, no API key needed
- **Total**: $0/month

If the site gets very heavy traffic (thousands of users), Vercel will eventually email you about upgrading. For demos and internal tools you'll never hit that limit.

---

## Adding a custom domain (optional)

If you own a domain like `mycompany.com` and want the app at `supplier.mycompany.com`:

1. Vercel dashboard → your project → **Settings** → **Domains**
2. Type your domain, follow Vercel's DNS instructions (it tells you exactly what to add at your domain registrar)
3. Done — usually live in a few minutes
