-- Add Profile and Identity fields to Users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_file TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_type TEXT;

COMMENT ON COLUMN users.profile_image IS 'URL to user profile photo';
COMMENT ON COLUMN users.identity_file IS 'URL to uploaded passport or ID file';
COMMENT ON COLUMN users.identity_type IS 'Type of document uploaded (PASSPORT, ID_CARD, etc)';
