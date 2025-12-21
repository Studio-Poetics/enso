-- Data Migration for Existing Projects
-- Ensures all existing projects have visibility and proper collaborators array

-- Step 1: Backup existing projects
CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;

-- Step 2: Set default visibility for existing projects (team-wide for backward compatibility)
UPDATE projects
SET visibility = 'team'
WHERE visibility IS NULL;

-- Step 3: Ensure owner is in collaborators array for all projects
UPDATE projects
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{collaborators}',
  CASE
    WHEN content->'collaborators' IS NULL THEN
      jsonb_build_array(owner_id::text)
    WHEN NOT content->'collaborators' @> jsonb_build_array(owner_id::text) THEN
      content->'collaborators' || jsonb_build_array(owner_id::text)
    ELSE
      content->'collaborators'
  END
)
WHERE content->'collaborators' IS NULL
   OR NOT content->'collaborators' @> jsonb_build_array(owner_id::text);

-- Step 4: Verification query
-- This should return 0 rows if migration was successful
SELECT
  id,
  title,
  visibility,
  owner_id,
  content->'collaborators' as collaborators,
  (content->'collaborators' @> jsonb_build_array(owner_id::text)) as owner_in_collabs
FROM projects
WHERE visibility IS NULL
   OR content->'collaborators' IS NULL
   OR NOT (content->'collaborators' @> jsonb_build_array(owner_id::text));

-- Step 5: Print summary
DO $$
DECLARE
  project_count integer;
  migrated_count integer;
BEGIN
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO migrated_count
  FROM projects
  WHERE visibility IS NOT NULL
    AND content->'collaborators' IS NOT NULL
    AND content->'collaborators' @> jsonb_build_array(owner_id::text);

  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total projects: %', project_count;
  RAISE NOTICE '  Successfully migrated: %', migrated_count;
  RAISE NOTICE '  Migration complete: %', (project_count = migrated_count);
END $$;
