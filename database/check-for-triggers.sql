-- Check for triggers that might be auto-adding users

-- 1. Check triggers on invitations table
SELECT
  trigger_name,
  event_manipulation as "event",
  action_statement as "action"
FROM information_schema.triggers
WHERE event_object_table = 'invitations';

-- 2. Check triggers on team_members table
SELECT
  trigger_name,
  event_manipulation as "event",
  action_statement as "action"
FROM information_schema.triggers
WHERE event_object_table = 'team_members';

-- 3. Check what's actually in team_members for a specific team
-- (Replace with your team ID to debug)
SELECT
  tm.user_id,
  p.name,
  p.email,
  tm.role,
  tm.created_at
FROM team_members tm
JOIN profiles p ON p.id = tm.user_id
-- WHERE tm.team_id = 'YOUR-TEAM-ID-HERE'
ORDER BY tm.created_at DESC
LIMIT 20;

-- 4. Check pending invitations
SELECT
  id,
  email,
  role,
  status,
  created_at
FROM invitations
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
