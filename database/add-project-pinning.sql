-- Add Project Pinning Feature
-- Allows users to pin important projects to the top of their list

-- Add pinned column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Add index for better performance when sorting by pinned status
CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned, created_at DESC);

-- Comment for documentation
COMMENT ON COLUMN projects.pinned IS 'Whether this project is pinned to the top of the list';

-- Verify the change
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name = 'pinned';

SELECT '✅ Project pinning feature added successfully!' as message;
