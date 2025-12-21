-- ============================================================================
-- COMPREHENSIVE FIX FOR MISSING PROJECTS
-- Run this to diagnose and fix all project visibility issues
-- ============================================================================

-- STEP 1: Show current state of all projects
SELECT
  'CURRENT STATE' as info,
  id,
  title,
  owner_id,
  team_id,
  visibility,
  content->'collaborators' as collaborators,
  CASE
    WHEN visibility IS NULL THEN '❌ Missing visibility'
    WHEN content->'collaborators' IS NULL THEN '❌ Missing collaborators'
    WHEN NOT (content->'collaborators' @> jsonb_build_array(owner_id::text)) THEN '❌ Owner not in collaborators'
    ELSE '✅ OK'
  END as status,
  created_at
FROM projects
ORDER BY created_at DESC;

-- STEP 2: Fix all projects - set visibility
UPDATE projects
SET visibility = 'team'
WHERE visibility IS NULL;

-- STEP 3: Fix all projects - ensure collaborators array exists and includes owner
UPDATE projects
SET content =
  CASE
    -- If content is null, create it with collaborators
    WHEN content IS NULL THEN
      jsonb_build_object('collaborators', jsonb_build_array(owner_id::text))
    -- If content exists but collaborators is null
    WHEN content->'collaborators' IS NULL THEN
      jsonb_set(content, '{collaborators}', jsonb_build_array(owner_id::text))
    -- If collaborators exists but owner not in it
    WHEN NOT (content->'collaborators' @> jsonb_build_array(owner_id::text)) THEN
      jsonb_set(content, '{collaborators}', content->'collaborators' || jsonb_build_array(owner_id::text))
    -- Otherwise leave as is
    ELSE content
  END
WHERE content IS NULL
   OR content->'collaborators' IS NULL
   OR NOT (content->'collaborators' @> jsonb_build_array(owner_id::text));

-- STEP 4: Verify fixes
SELECT
  'AFTER FIX' as info,
  id,
  title,
  owner_id,
  team_id,
  visibility,
  content->'collaborators' as collaborators,
  CASE
    WHEN visibility IS NULL THEN '❌ Still missing visibility'
    WHEN content->'collaborators' IS NULL THEN '❌ Still missing collaborators'
    WHEN NOT (content->'collaborators' @> jsonb_build_array(owner_id::text)) THEN '❌ Owner still not in collaborators'
    ELSE '✅ FIXED'
  END as status
FROM projects
ORDER BY created_at DESC;

-- STEP 5: Check user-team relationships
SELECT
  'USER TEAMS' as info,
  p.id as user_id,
  p.email,
  p.name,
  tm.team_id,
  tm.role,
  t.name as team_name
FROM profiles p
LEFT JOIN team_members tm ON p.id = tm.user_id
LEFT JOIN teams t ON tm.team_id = t.id
ORDER BY p.created_at DESC;

-- STEP 6: Show which team each project belongs to
SELECT
  'PROJECT TEAMS' as info,
  proj.id as project_id,
  proj.title,
  proj.owner_id,
  proj.team_id,
  proj.visibility,
  t.name as team_name,
  t.owner_id as team_owner_id
FROM projects proj
LEFT JOIN teams t ON proj.team_id = t.id
ORDER BY proj.created_at DESC;

-- STEP 7: Summary
SELECT
  COUNT(*) as total_projects,
  SUM(CASE WHEN visibility = 'team' THEN 1 ELSE 0 END) as team_projects,
  SUM(CASE WHEN visibility = 'private' THEN 1 ELSE 0 END) as private_projects,
  SUM(CASE WHEN visibility IS NULL THEN 1 ELSE 0 END) as missing_visibility,
  SUM(CASE WHEN content->'collaborators' IS NULL THEN 1 ELSE 0 END) as missing_collaborators,
  SUM(CASE WHEN content->'collaborators' @> jsonb_build_array(owner_id::text) THEN 1 ELSE 0 END) as with_owner_in_collabs
FROM projects;
