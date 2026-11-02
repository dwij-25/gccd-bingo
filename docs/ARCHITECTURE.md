# 🏗️ GCCD Bingo Architecture & Technical Design

## 1. System Overview
GCCD Bingo is a production-grade, event-ready photo bingo platform built for Google Cloud Developer Group Community Day (GCCD). Attendees participate in 9 interactive challenges by capturing photos on mobile or desktop, saving drafts, and submitting their completed cards to qualify for raffle draws and grand prizes.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Tailwind CSS + Google Brand Color Scheme            │
│  - Framer Motion & CSS 3D Card Flip Transforms         │
│  - Client-Side Canvas Image Compression (max 1600px)   │
│  - Synthesized Web Audio API Chimes (Zero Assets)      │
│  - Canvas Confetti Particle Explosion Engine           │
│  - In-Browser High-Res A4 Poster Compositor (PNG)      │
└───────────────────────────▲────────────────────────────┘
                            │ REST APIs / FormData / Cookies
┌───────────────────────────▼────────────────────────────┐
│              Backend (Node.js + Express + TS)          │
│  - Helmet Security (Configured for Iframe Embedding)   │
│  - Cookie-based HttpOnly JWT Session Tokens            │
│  - Zod Request Validation & Error Handling             │
│  - Express Rate Limiting (Brute-Force Protection)      │
│  - Win Condition & Pattern Evaluator Engine            │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      Database & Storage (PostgreSQL / Supabase / S3)   │
│  - Tables: participants, bingo_cards, tiles, audit_log │
│  - Row Level Security (RLS) Compatible                 │
│  - Storage: Supabase Storage / Cloudinary / Local FS   │
└────────────────────────────────────────────────────────┘
```

## 2. Trade-off Analysis: Node.js/Express vs. Direct Supabase
| Criterion | Node.js + Express Custom API (Chosen) | Direct Supabase Client |
| :--- | :--- | :--- |
| **Business Logic Control** | Strict server-side submission locks, win-line evaluation, and audit logging. | Requires database triggers / Postgres functions (PL/pgSQL). |
| **Image Compression & Validation** | Server checks file headers & mime-types before writing to storage. | Handled via client-side libraries or edge functions. |
| **Offline / Resilient Fallback** | Transparent fallback to embedded SQLite for local/offline testing. | Requires active cloud internet connection. |
| **Recommendation** | **Hybrid approach**: Use Express for domain rules and REST API, and use Supabase PostgreSQL + Storage as the cloud provider. |

## 3. Data Integrity & Concurrency
- **Idempotency**: All tile uploads use `UNIQUE(card_id, tile_index)`, allowing repeat uploads to replace images cleanly without duplicate rows.
- **Atomic Submissions**: Cards transition from `'draft'` to `'submitted'` via strict database queries; once marked submitted, the server rejects any subsequent write attempts.
- **Auditing**: Every login, photo upload, draft save, and admin status change is recorded with server timestamps in `activity_log`.
