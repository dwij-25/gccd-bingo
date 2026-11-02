# 🎯 GCCD Bingo — Production-Ready Community Day Web App

> **An interactive, mobile-first photo challenge bingo application designed for Google Cloud Developer Group Community Day (GCCD) & DevFest.**
>
> Built strictly following the official visual identity of `Bingo Card (A4).pptx.svg` and the architectural specifications of `Structure for GCCD Bingo`.

---

## 🌟 Highlights & Features
- **Roster-Authenticated Access**: Participants enter their registered Name & Email; verified against the event database.
- **3x3 Flip Card Grid**: Desktop click to flip; mobile tap or touch swipe to flip with smooth 3D CSS perspective transforms.
- **Real-Time Signal Dots**:
  - 🔴 **Red Dot**: Challenge Not Finished.
  - 🟢 **Green Dot**: Challenge Completed with uploaded photo.
- **Client-Side Image Optimization**: Automatically scales down massive 48MP smartphone photos to max 1600px before uploading, saving attendee cellular data.
- **Persistent Draft Saving**: Real-time auto-save on photo capture plus manual "Save Draft" button with "Saved at HH:MM" timestamp indicators and browser unload safety checks.
- **Submission Lock & Human-Friendly Bingo ID**: Unlock submission only once 9/9 challenges are green; generates unique `GCCD-7K4M-92QX` codes for raffle verification.
- **In-Browser A4 Card Compositor**: Attendees download an A4 PNG poster with their photos, name, email, and Bingo ID embedded directly into the official template.
- **Protected Organizer Admin Dashboard**: Filter submissions, inspect challenge photos, award raffle winners, and import/export attendee rosters via `.xlsx` or `.csv`.
- **Zero Asset Audio Synthesizer**: Delightful, lightweight chimes and fanfares synthesized in real-time via the Web Audio API with a one-click mute toggle.
- **Dual Deployment Options**: Deploy as a standalone subdomain or embed seamlessly into your existing community website via responsive iframe.

---

## 🏗️ Monorepo Structure

```
gccd-bingo/
├── apps/
│   ├── web/                     # React + Vite + TypeScript + Tailwind CSS Frontend
│   │   ├── src/
│   │   │   ├── components/      # BingoBoard, BingoTile, LoginGate, AdminPanel, etc.
│   │   │   ├── hooks/           # useAuth, useBingoCard
│   │   │   ├── lib/             # api.ts, audio.ts, imageCompressor.ts
│   │   │   └── types/           # Data models & schemas
│   │   └── public/assets/       # Cropped official SVG branding assets
│   └── api/                     # Node.js + Express + TypeScript Backend
│       └── src/
│           ├── controllers/     # authController, cardController, adminController
│           ├── middleware/      # auth, rateLimiter, errorHandler
│           ├── routes/          # authRoutes, cardRoutes, adminRoutes
│           └── services/        # storageService, bingoService
├── database/
│   ├── migrations/              # 001_initial_schema.sql (PostgreSQL / Supabase)
│   ├── seed.sql                 # Sample speakers & attendees
│   └── import-participants.ts   # CLI Excel/CSV attendee roster importer
├── docs/                        # ARCHITECTURE, API_REFERENCE, DEPLOYMENT, EMBED_GUIDE
├── .env.example                 # Production & development environment template
├── .gitignore
├── LICENSE                      # MIT
└── package.json                 # Monorepo workspaces configuration
```

---

## ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `CLIENT_ORIGIN` | Allowed Frontend URL | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains | `http://localhost:3000,https://gccd.gdg.community` |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) | `postgresql://postgres:pass@localhost:5432/gccd_bingo` |
| `SQLITE_DB_PATH` | Local SQLite fallback database path | `./gccd_bingo.db` |
| `JWT_SECRET` | Secret key for session cookie signing | Random 32+ char string |
| `ADMIN_SECRET_KEY` | Organizer panel access password | `admin_gccd_secure_pass_2026` |
| `STORAGE_PROVIDER` | `local`, `supabase`, or `cloudinary` | `local` |

---

## 📥 How to Import Participants from Excel

Organizers can import or update participant rosters using the included CLI script:

```bash
# 1. Place your Excel (.xlsx, .xls) or .csv file in the database folder
# Columns accepted: Name, Email Address, Organization, Role

# 2. Run the import script
npm run import:participants -- database/my_gccd_attendees.xlsx
```

### Key Import Safety Guarantees:
- **Case-Insensitive Normalization**: Emails are trimmed and converted to lowercase.
- **Non-Destructive Upsert**: Re-importing updated attendee spreadsheets **never wipes** existing bingo cards, drafts, or submitted photos (`ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`).

---

## 💻 How to Run Locally

### 1. Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Servers
Run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/health`

### 4. Test Accounts for Immediate Verification:
- **Dwij Patel**: `dwij@example.com` (Speaker)
- **Sarah Jenkins**: `sarah.j@google.com` (Keynote Speaker)
- **Aarav Sharma**: `aarav.sharma@techcorp.in` (Attendee)

---

## 🚀 Deployment Steps

### Backend (Render / Railway / Cloud Run)
1. Push repository to GitHub.
2. Link your repository to Render or Railway.
3. Build Command: `npm run build:api`
4. Start Command: `npm --workspace=apps/api start`
5. Set environment variables from `.env.example`.

### Frontend (Vercel / Netlify)
1. Import repository on Vercel.
2. Select Root Directory: `apps/web`.
3. Set Framework: `Vite`.
4. Add Environment Variable: `VITE_API_URL=https://your-api.onrender.com`.
5. Deploy!

---

## 🌐 How to Embed in Your Main Website

### Responsive Iframe Embed
Paste this snippet on your event site:
```html
<div style="width: 100%; max-width: 900px; margin: 0 auto; min-height: 950px; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.12);">
  <iframe
    src="https://bingo.yourcommunity.com"
    style="width: 100%; height: 950px; border: none;"
    title="GCCD Photo Bingo"
    allow="camera; clipboard-write;"
    loading="lazy"
  ></iframe>
</div>
```

---

## 🐙 Git Initialization & GitHub Push Commands

To initialize this repository and push to your GitHub account:

```bash
# 1. Initialize Git repository
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: complete production-ready GCCD Bingo monorepo"

# 4. Set branch to main
git branch -M main

# 5. Add your remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/gccd-bingo.git

# 6. Push to GitHub
git push -u origin main
```
