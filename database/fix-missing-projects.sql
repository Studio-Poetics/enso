-- Fix script for missing projects
-- This will ensure all projects are visible and properly configured

-- STEP 1: Fix any projects with NULL visibility
UPDATE projects
SET visibility = 'team'
WHERE visibility IS NULL;

-- STEP 2: Fix collaborators array - ensure owner is always included
UPDATE projects
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{collaborators}',
  CASE
    -- If collaborators is null, create array with just owner
    WHEN content->'collaborators' IS NULL THEN
      jsonb_build_array(owner_id::text)
    -- If owner is not in collaborators, add them
    WHEN NOT content->'collaborators' @> jsonb_build_array(owner_id::text) THEN
      content->'collaborators' || jsonb_build_array(owner_id::text)
    -- Otherwise keep as is
    ELSE
      content->'collaborators'
  END
);

-- STEP 3: Verify the fixes
SELECT
  id,
  title,
  owner_id,
  team_id,
  visibility,
  content->'collaborators' as collaborators,
  CASE
    WHEN visibility IS NULL THEN 'Missing visibility'
    WHEN content->'collaborators' IS NULL THEN 'Missing collaborators'
    WHEN NOT (content->'collaborators' @> jsonb_build_array(owner_id::text)) THEN 'Owner not in collaborators'
    ELSE 'OK'
  END as status
FROM projects
ORDER BY created_at DESC;

-- STEP 4: Count fixed projects
SELECT
  COUNT(*) as total_projects,
  SUM(CASE WHEN visibility = 'team' THEN 1 ELSE 0 END) as team_visible_projects,
  SUM(CASE WHEN visibility = 'private' THEN 1 ELSE 0 END) as private_projects,
  SUM(CASE WHEN content->'collaborators' @> jsonb_build_array(owner_id::text) THEN 1 ELSE 0 END) as projects_with_owner_as_collab
FROM projects;
