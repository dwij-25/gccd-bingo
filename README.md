# 🎯 Google Developer Groups Cloud Ahmedabad — GCCD Bingo Web App

[![Live Application](https://img.shields.io/badge/Live_App-gccd--bingo.vercel.app-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://gccd-bingo.vercel.app)
[![Google Cloud](https://img.shields.io/badge/Powered_by-Google_Cloud_%26_Firebase-EA4335?style=for-the-badge&logo=firebase&logoColor=white)](https://cloud.google.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-FBBC05?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-34A853?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **A high-energy, mobile-first interactive photo challenge bingo application created for Google Cloud Community Day (GCCD) Ahmedabad 2026.**
>
> Designed strictly to match the official **GDG Cloud Ahmedabad** visual identity and neobrutalist branding (`Bingo Card (A4)`), featuring real-time photo uploads, client-side image compression, tamper-proof Bingo ID generation, high-res A4 card compositing, an Organizer Admin Portal, and live winner evaluations.

---

## 📖 Table of Contents

- [What It Is About](#-what-it-is-about)
- [How It Works (Attendee Journey)](#-how-it-works-attendee-journey)
- [Game Rules & Challenges](#-game-rules--challenges)
- [Organizer Admin Panel](#-organizer-admin-panel)
  - [How to Access](#how-to-access-the-admin-panel)
  - [Admin Features & Capabilities](#admin-features--capabilities)
- [Technology Stack](#-technology-stack)
- [Google Cloud & Firebase Architecture](#-google-cloud--firebase-architecture)
- [Repository Structure](#-repository-structure)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Configuration](#-environment-configuration)
- [Deployment Guide](#-deployment-guide)

---

## 💡 What It Is About

**GCCD Bingo** turns tech conferences into an engaging, participatory scavenger hunt. Rather than passively listening to talks, attendees actively explore the venue, network with fellow developers, engage with sponsors, interact with community volunteers, and capture their journey in real time.

### Key Highlights:
- **Event-Tailored Neobrutalism**: Bold 2px/3px black borders, drop shadows (`shadow-brutal`), and Google Cloud's signature color palette (Google Blue `#4285F4`, Red `#EA4335`, Yellow `#FBBC05`, and Green `#34A853`).
- **Interactive 3×3 Grid**: 8 diverse photo challenges surrounding the central **Google Developer Groups Cloud Ahmedabad** emblem tile.
- **Instant Client-Side Image Compression**: Photos taken using mobile cameras are resized and compressed on the client device canvas (under 250 KB) before uploading, ensuring lightning-fast submissions even on crowded venue Wi-Fi or cellular networks.
- **Permanent High-Res Keepsake**: Attendees can download a customized, print-ready high-resolution **A4 Bingo Card PNG** with all their clicked photos, name, email, and tamper-proof verification ID embedded into the card.

---

## 🚀 How It Works (Attendee Journey)

The entire flow is frictionless, responsive, and requires zero app store installation:

```mermaid
flowchart TD
    A["1. Sign In (Name & Email)"] --> B["2. Personalized 3x3 Card Generated"]
    B --> C["3. Tap Tile & Take Photo via Camera"]
    C --> D["4. Crop & Client-Side Auto Compress"]
    D --> E["5. Tile Turns Green (Progress Updates)"]
    E --> F{"All 8 Challenges Done?"}
    F -- "No (< 8)" --> G["Auto-Save / Save Draft"]
    G --> C
    F -- "Yes (8/8)" --> H["6. SUBMIT BINGO (Tamper-Proof ID Locked)"]
    H --> I["7. Download Official A4 Card PNG"]
    H --> J["8. View Results & Claim Prize at Stage"]
```

### 1. Attendee Sign-In
- Attendees visit [`https://gccd-bingo.vercel.app`](https://gccd-bingo.vercel.app) on their smartphone.
- Enter their **Name** and **Email Address**.
- An attendee profile and unique Bingo ID (e.g. `GCCD-GZMX-2LGX`) are generated and persisted.

### 2. Exploring the 3×3 Challenge Grid
- The card displays 8 colorful challenge boxes with custom iconography and 1 central brand logo.
- Tapping any tile flips it smoothly with 3D CSS perspective transforms to reveal the detailed challenge objective.

### 3. Real-Time Photo Capture & Crop Adjuster
- Tapping the shutter button opens the device camera or file picker.
- Attendees can frame and adjust their photo in the built-in modal crop adjuster.
- Photos are compressed into lightweight JPEGs in milliseconds.

### 4. Signal Status & Retake Flexibility
- Completed tiles feature a **🟢 Green Dot** status indicator and display the photo thumbnail.
- Tapping a completed tile allows the attendee to tap **Retake** at any point. Retaking updates the photo in real time and automatically deletes the previous image from the database.

### 5. Draft Preservation
- Progress is automatically saved as a draft on each photo upload.
- Attendees can also tap the **Save Draft** button at any time.

### 6. Submitting the Completed Bingo (8/8)
- As soon as all **8 challenge tiles** turn green (`8 / 8 Complete`), the **SUBMIT (8/8)** button activates.
- Submitting locks the submission into the event database and qualifies the attendee for the raffle and swag distribution.
- If an attendee wants to swap a photo after submitting, the card provides a **Resubmit Bingo** workflow.

### 7. Results, Live Evaluation & Winner Announcement
- Attendees tap the **View Results & Winners** modal:
  - **While evaluation is ongoing**: Displays a status screen:
    > *"Please wait till the results are being counted or evaluated."*
    > *"The GCCD organizers are currently reviewing challenge submissions. Top 10 Winners will be announced right here once evaluation is complete."*
  - **Once organizers verify winners**: The **Official Top 10 Winners Leaderboard** is displayed, headlined by **Rank #1. Raffle Grand Winner**, followed by winners instructed to collect their prizes directly at **the stage**!

### 8. Download High-Resolution A4 Bingo Card
- Attendees can click **Download Bingo A4 Card** at any time.
- The in-browser HTML5 Canvas Compositor renders a 300 DPI A4 graphic embedding the attendee's name, email, official Bingo ID, timestamp, and all challenge photos into the official presentation frame.

---

## 🏆 Game Rules & Challenges

The 3×3 grid contains **8 challenge tiles** plus the central community emblem:

| # | Challenge Tile | Color | Icon | Objective |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Selfie with a speaker** | Yellow | 🤳 | Snap a selfie with any conference speaker after their talk. |
| **2** | **The full auditorium** | Pink | 👥 | Capture a wide photo of the audience and main stage in action. |
| **3** | **A slide that taught you something** | Blue | 💻 | Photograph an insightful presentation slide from any technical session. |
| **4** | **Selfie with a volunteer** | Blue | 🤝 | Find an event volunteer helping out and take a friendly selfie. |
| **★** | **GDG Cloud Ahmedabad** | White | ☁️ | *Center community brand emblem (Non-photo tile).* |
| **5** | **Selfie with someone new** | Green | 🧑‍🤝‍🧑 | Make a new friend in the community and take a selfie together. |
| **6** | **Photo booth or standee** | Green | 📸 | Strike a pose at the official GCCD photo booth or venue standee. |
| **7** | **A sponsor booth** | Yellow | 🏢 | Visit any partner or sponsor booth in the expo area and take a photo. |
| **8** | **Selfie with your badge** | Pink | 🪪 | Show off your official attendee lanyard and entry badge. |

> **Prize Criteria**: Complete all **8/8 challenges** and submit your card. Organizers verify submitted photos and pick winners for the stage raffle.

---

## 🛡️ Organizer Admin Panel

The Admin Panel provides organizers and community leads with complete real-time oversight of the event.

### How to Access the Admin Panel:
1. Open your browser and navigate to:
   - `https://gccd-bingo.vercel.app?admin=true` OR
   - `https://gccd-bingo.vercel.app/admin`
2. Enter the **Organizer Secret Key**:
   ```
   gccd2026
   ```
   *(Or the custom `ADMIN_SECRET_KEY` configured in your environment variables).*
3. Click **Access Admin Panel**.

### Admin Features & Capabilities:

| Feature | Description |
| :--- | :--- |
| **Live Metric Counters** | Four responsive stat cards showing **Total Registered**, **Active Drafts**, **Submitted**, and **Winners** count. |
| **Filter Tabs** | Instant filtering between `All Attendees`, `Submitted`, `Drafts`, and `Winners`. |
| **Mobile-Friendly Table** | Horizontal swipe enabled for smartphone screens; shows Name, Email, Bingo ID, Status, Completed Challenge count (`8 / 8`), and Submission Timestamp. |
| **1-Click A4 Card Export** | Organizers can click **📥 A4 Card** next to any participant (even drafts) to instantly generate and download that attendee's compiled A4 Bingo Card PNG for verification at the swag desk or on stage. |
| **Winner Verification Toggle** | Click the **🏆 Winner** button to mark or unmark an attendee as an official winner. Marked winners immediately appear in the public Top 10 leaderboard. |
| **Export CSV** | Download a full spreadsheet (`gccd-bingo-submissions.csv`) with participant names, emails, organizations, Bingo IDs, challenge completion stats, submission times, and winner statuses. |
| **Reset Database (Clean Slate)** | 1-Click red **Reset DB** button with safety confirmation. Completely purges all participant records, cards, and uploaded photo tiles from the PostgreSQL database and browser storage, ensuring 0 ghost entries remain before the event begins. |

---

## 💻 Technology Stack

### Frontend:
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with Neobrutalism UI presets
- **Icons**: [Lucide React](https://lucide.dev/)
- **Card Compositor**: In-browser HTML5 2D Canvas rendering high-res 300 DPI A4 graphics
- **Audio Feedback**: Synthesized Web Audio API sound effects for clicks, camera shutter, and victory fanfares

### Backend & API:
- **Serverless API**: Vercel Serverless Functions (`api/index.ts`)
- **Node.js**: TypeScript Express backend architecture
- **Database**: Serverless PostgreSQL via [Neon](https://neon.tech/) & [Supabase](https://supabase.com/)
- **Google Cloud / Firebase**: Google Cloud Firestore & Firebase Cloud Storage turnkey support

---

## ☁️ Google Cloud & Firebase Architecture

GCCD Bingo is built to showcase Google Cloud technologies:

- **Google Cloud Firestore**: Real-time NoSQL document store syncing attendee challenge progress across devices.
- **Firebase Cloud Storage**: Secure, high-durability object storage for high-resolution attendee challenge captures.
- **Serverless PostgreSQL**: Relational transactional database storing normalized participant rosters, card states, and verification timestamps.
- **Google Cloud Run / Vercel**: Scalable serverless compute handling high concurrency spikes during conference opening and closing keynotes.

---

## 📁 Repository Structure

```
gccd-bingo/
├── api/
│   └── index.ts                 # Vercel Serverless API entrypoint (Auth, Cards, Admin, CSV, Reset)
├── apps/
│   ├── web/                     # Frontend Application
│   │   ├── src/
│   │   │   ├── components/      # UI Components
│   │   │   │   ├── AdminPanel.tsx      # Organizer Dashboard with stats & A4 download
│   │   │   │   ├── BingoBoard.tsx      # 3x3 Neobrutalist challenge board
│   │   │   │   ├── BingoTile.tsx       # 3D Flip card with camera shutter & retake
│   │   │   │   ├── CropAdjustModal.tsx # Interactive photo crop & position adjuster
│   │   │   │   ├── LoginGate.tsx       # Attendee registration & sign-in screen
│   │   │   │   ├── ResultsModal.tsx    # Live evaluation & Top 10 Winners Leaderboard
│   │   │   │   ├── RulesModal.tsx      # 8-challenge instructions & prize criteria
│   │   │   │   └── WinnerCelebration.tsx# Confetti & victory audio fanfare
│   │   │   ├── lib/             # Utilities
│   │   │   │   ├── api.ts              # API client with offline temp database fallback
│   │   │   │   ├── audio.ts            # Web Audio API sound synthesizer
│   │   │   │   ├── bingoCardGenerator.ts# A4 Canvas Compositor
│   │   │   │   ├── firebase.ts         # Firebase Cloud Storage & Firestore config
│   │   │   │   ├── imageCompressor.ts  # Canvas client-side JPEG optimizer
│   │   │   │   └── tempDatabase.ts     # In-memory & localStorage fallback database
│   │   │   └── types/           # TypeScript interfaces (Participant, BingoCard, BingoTile)
│   │   └── public/assets/       # Cropped SVG logos and GDG Cloud Ahmedabad branding
│   └── api/                     # Dedicated standalone Node.js Express server
├── database/
│   ├── migrations/              # SQL schema migration scripts
│   └── seed.sql                 # Sample test attendee roster
└── README.md                    # Project documentation
```

---

## 🛠️ Getting Started Locally

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- (Optional) Git

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/dwij-25/gccd-bingo.git
cd gccd-bingo
npm install
```

### 3. Run Development Server
```bash
# Start frontend application on localhost:3000
npm --workspace=apps/web run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or in `apps/web/.env`):

```env
# Application Port & Mode
NODE_ENV=production
PORT=5000

# PostgreSQL Database (Neon / Supabase)
DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Organizer Admin Secret Key
ADMIN_SECRET_KEY=gccd2026

# Google Firebase Configuration (Optional for cloud storage)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=gccd-bingo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gccd-bingo
VITE_FIREBASE_STORAGE_BUCKET=gccd-bingo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 🚀 Deployment Guide

### Deploying to Vercel (Recommended)

1. Push your code to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import the `gccd-bingo` repository.
4. Set the following Build & Output settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (or `apps/web`)
   - **Build Command**: `npm --workspace=apps/web run build`
   - **Output Directory**: `apps/web/dist`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `ADMIN_SECRET_KEY`: `gccd2026`
6. Click **Deploy**. Your app will be live at `https://your-app.vercel.app`!

---

## 🤝 Community & Credits

- Organized by **Google Developer Groups Cloud Ahmedabad**
- Designed for **Google Cloud Community Day (GCCD) 2026**
- Core Lead: **Dwij Patel** & GDG Cloud Ahmedabad Organizing Team

*Empowering developers to connect, learn, and grow together with Google Cloud.*
