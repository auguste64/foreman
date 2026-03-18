-- Add iCal token to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ical_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

-- Add Google Calendar OAuth tokens to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expiry  TIMESTAMPTZ;

-- Add Google Calendar event ID to evenements
ALTER TABLE evenements
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
