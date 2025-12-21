-- Fix RLS policies on profiles table to allow team member invitations
-- This allows users to look up other profiles by email when inviting to teams

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Allow users to view any profile (for team invitations)
-- This is safe because profiles only contain public info (name, email, avatar)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Users can only insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Verify the policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
