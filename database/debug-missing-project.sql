-- Debug script to find missing projects
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check all projects and their visibility/collaborators status
SELECT
  id,
  title,
  owner_id,
  team_id,
  visibility,
  content->'collaborators' as collaborators,
  (content->'collaborators' @> jsonb_build_array(owner_id::text)) as owner_in_collabs,
  created_at
FROM projects
ORDER BY created_at DESC;

-- 2. Check if visibility is NULL (should be 'team' by default)
SELECT COUNT(*) as projects_without_visibility
FROM projects
WHERE visibility IS NULL;

-- 3. Check if owner is missing from collaborators
SELECT
  id,
  title,
  owner_id,
  content->'collaborators' as collaborators
FROM projects
WHERE NOT (content->'collaborators' @> jsonb_build_array(owner_id::text))
   OR content->'collaborators' IS NULL;

-- 4. Check your user ID and team memberships
SELECT
  tm.user_id,
  tm.team_id,
  tm.role,
  t.name as team_name,
  p.email as user_email
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN profiles p ON tm.user_id = p.id
ORDER BY tm.created_at DESC;
