-- Run this in your Supabase SQL Editor to fix the security warning:
-- Function public.handle_new_user has a role mutable search_path

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, role, is_verified, whatsapp, password, created_at)
  VALUES (
    new.id, 
    new.email, 
    LOWER(SPLIT_PART(new.email, '@', 1)) || floor(random() * 1000)::text, -- auto-generate username
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)), 
    'USER', 
    TRUE, 
    '+628000000000', 
    'OAUTH_USER', -- placeholder password since it's OAuth
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
