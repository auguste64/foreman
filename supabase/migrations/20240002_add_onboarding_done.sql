-- Add onboarding_done flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;
