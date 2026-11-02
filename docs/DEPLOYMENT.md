# 🚀 GCCD Bingo Deployment Guide

## 1. Hosting Architecture
- **Frontend**: Vercel or Netlify (static single-page app build from `apps/web`)
- **Backend**: Render, Railway, or Google Cloud Run (containerized Express server from `apps/api`)
- **Database**: Supabase PostgreSQL or Managed PostgreSQL (Neon, AWS RDS, GCP Cloud SQL)
- **Object Storage**: Supabase Storage Bucket or Cloudinary

---

## 2. Deploying Backend to Render / Railway / Cloud Run

### Option A: Railway / Render
1. Connect your GitHub repository.
2. Root Directory: `gccd-bingo`
3. Build Command: `npm run build:api`
4. Start Command: `npm --workspace=apps/api start`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB]`
   - `JWT_SECRET`: `[GENERATE_A_RANDOM_64_CHAR_HEX_STRING]`
   - `ALLOWED_ORIGINS`: `https://bingo.yourdomain.com,https://yourcommunitywebsite.com`
   - `ADMIN_SECRET_KEY`: `[CHOOSE_AN_ORGANIZER_PASS]`

### Option B: Google Cloud Run (Containerized)
```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci
COPY apps/api/ ./apps/api/
RUN npm --workspace=apps/api run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist ./apps/api/dist
EXPOSE 5000
CMD ["node", "apps/api/dist/index.js"]
```
Deploy command:
```bash
gcloud run deploy gccd-bingo-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 3. Deploying Frontend to Vercel / Netlify

### Vercel Deployment
1. Import GitHub repository into Vercel.
2. Root Directory: `gccd-bingo/apps/web`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: `https://gccd-bingo-api.onrender.com`

---

## 4. Database Setup & Migrations
Connect to your PostgreSQL / Supabase database and execute:
```bash
# Apply schema migration
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql

# Seed initial speaker & attendee accounts
psql $DATABASE_URL -f database/seed.sql

# Import your event registration spreadsheet (.xlsx or .csv)
npx ts-node database/import-participants.ts /path/to/event_attendees.xlsx
```
