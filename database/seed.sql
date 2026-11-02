-- ==========================================================
-- GCCD BINGO - SEED DATA FOR COMMUNITY DAY 2026
-- ==========================================================

INSERT INTO participants (id, name, email, organization, role)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Dwij Patel', 'dwij@example.com', 'GDG Cloud Ahmedabad', 'Speaker'),
    ('22222222-2222-2222-2222-222222222222', 'Sarah Jenkins', 'sarah.j@google.com', 'Google Cloud', 'Keynote Speaker'),
    ('33333333-3333-3333-3333-333333333333', 'Aarav Sharma', 'aarav.sharma@techcorp.in', 'TechCorp India', 'Attendee'),
    ('44444444-4444-4444-4444-444444444444', 'Priyanka Verma', 'priyanka.v@clouddev.org', 'Cloud Developers Community', 'Attendee'),
    ('55555555-5555-5555-5555-555555555555', 'Michael Chen', 'mchen@ai-startup.io', 'AI Horizon Labs', 'Attendee'),
    ('66666666-6666-6666-6666-666666666666', 'Ananya Iyer', 'ananya.iyer@gdgcommunity.com', 'GDG On Campus', 'Volunteer'),
    ('77777777-7777-7777-7777-777777777777', 'Rohan Mehta', 'rohan.mehta@devstudio.com', 'DevStudio Interactive', 'Attendee'),
    ('88888888-8888-8888-8888-888888888888', 'Neha Kulkarni', 'neha.k@datascience.net', 'Data Intelligence Group', 'Attendee')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    organization = EXCLUDED.organization,
    role = EXCLUDED.role;
