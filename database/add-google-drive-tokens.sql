-- Add Google Drive integration columns to profiles table
-- This allows each user to connect their own Google Drive account

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_drive_token TEXT,
ADD COLUMN IF NOT EXISTS google_drive_email TEXT,
ADD COLUMN IF NOT EXISTS google_drive_connected_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_drive_connected
ON profiles(id) WHERE google_drive_token IS NOT NULL;

COMMENT ON COLUMN profiles.google_drive_token IS 'Encrypted Google Drive OAuth refresh token for this user';
COMMENT ON COLUMN profiles.google_drive_email IS 'Email address of connected Google Drive account';
COMMENT ON COLUMN profiles.google_drive_connected_at IS 'Timestamp when Google Drive was connected';
