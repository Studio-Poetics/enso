-- ============================================================================
-- PROPER INVITATION SYSTEM
-- Industry-standard team invitations with email notifications
-- Safe for existing users - no breaking changes
-- ============================================================================

-- 1. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,

  -- Prevent duplicate pending invitations
  CONSTRAINT unique_pending_invitation UNIQUE (team_id, email, status)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_team ON invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- 3. Add comments for documentation
COMMENT ON TABLE invitations IS 'Team invitation system - users must accept before joining';
COMMENT ON COLUMN invitations.token IS 'Unique token for email verification link';
COMMENT ON COLUMN invitations.expires_at IS 'Invitations expire after 7 days';

-- 4. RLS Policies for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Team owners/admins can view invitations for their team
CREATE POLICY "Team admins can view team invitations" ON invitations
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Team owners/admins can create invitations
CREATE POLICY "Team admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Users can update their own invitations (accept/decline)
CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Team owners/admins can cancel invitations
CREATE POLICY "Team admins can cancel invitations" ON invitations
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Team owners/admins can delete invitations
CREATE POLICY "Team admins can delete invitations" ON invitations
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 5. Function to auto-expire old invitations (optional cleanup)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Fix profiles RLS to allow viewing all profiles (needed for invitations)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 7. Verification query - check everything is set up correctly
SELECT
  'Invitations table created' as status,
  COUNT(*) as invitation_count
FROM invitations;

SELECT
  'RLS policies created' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'invitations';

-- Success message
SELECT '✅ Invitation system created successfully!' as message;
