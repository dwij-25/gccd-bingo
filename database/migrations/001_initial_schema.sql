-- ==========================================================
-- GCCD BINGO - POSTGRESQL / SUPABASE PRODUCTION SCHEMA MIGRATION
-- Migration: 001_initial_schema.sql
-- ==========================================================

-- Enable pgcrypto / uuid extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization VARCHAR(255) DEFAULT 'Community Member',
    role VARCHAR(100) DEFAULT 'Attendee',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive index for lightning-fast roster verification
CREATE INDEX IF NOT EXISTS idx_participants_email_lower ON participants (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants (name);

-- 2. BINGO CARDS TABLE
CREATE TYPE bingo_status_enum AS ENUM ('draft', 'submitted', 'verified', 'winner', 'rejected');

CREATE TABLE IF NOT EXISTS bingo_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
    bingo_id VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified', 'winner', 'rejected')),
    total_completed INT NOT NULL DEFAULT 0 CHECK (total_completed BETWEEN 0 AND 9),
    win_tier VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bingo_cards_bingo_id ON bingo_cards (bingo_id);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_status ON bingo_cards (status);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_participant ON bingo_cards (participant_id);

-- 3. BINGO TILES TABLE (0 to 8: 9 Tiles)
CREATE TABLE IF NOT EXISTS bingo_tiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES bingo_cards(id) ON DELETE CASCADE,
    tile_index INT NOT NULL CHECK (tile_index BETWEEN 0 AND 8),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'not_finished' CHECK (status IN ('not_finished', 'completed')),
    image_url TEXT,
    image_path TEXT,
    uploaded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_card_tile UNIQUE (card_id, tile_index)
);

CREATE INDEX IF NOT EXISTS idx_bingo_tiles_card_id ON bingo_tiles (card_id);
CREATE INDEX IF NOT EXISTS idx_bingo_tiles_status ON bingo_tiles (status);

-- 4. ACTIVITY LOG (Audit Trail for verification, submissions, and organizer actions)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    card_id UUID REFERENCES bingo_cards(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_card ON activity_log (card_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_participant ON activity_log (participant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);

-- Automatic updated_at timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bingo_cards_updated_at ON bingo_cards;
CREATE TRIGGER trg_bingo_cards_updated_at
    BEFORE UPDATE ON bingo_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bingo_tiles_updated_at ON bingo_tiles;
CREATE TRIGGER trg_bingo_tiles_updated_at
    BEFORE UPDATE ON bingo_tiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Supabase Compatible)
-- ==========================================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow anonymous verification lookup through API service role
CREATE POLICY "Public participants lookup via service" ON participants FOR SELECT USING (true);
CREATE POLICY "Public card access via token" ON bingo_cards FOR ALL USING (true);
CREATE POLICY "Public tiles access via card" ON bingo_tiles FOR ALL USING (true);
CREATE POLICY "Public audit logging" ON activity_log FOR INSERT WITH CHECK (true);
