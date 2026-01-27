-- PROMOTE USER TO ADMIN
-- Run this in the Supabase SQL Editor

-- 1. Ensure the profile exists (in case the trigger didn't catch it)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  'Admin'
FROM auth.users
WHERE email = 'sherifdd@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Admin';

-- 2. Verify the update
SELECT * FROM public.profiles WHERE email = 'sherifdd@gmail.com';
