import { supabase } from '../lib/supabase';
import { Project, User, Team, ProjectStatus } from '../types';

/**
 * SUPABASE STORAGE SERVICE
 *
 * Production implementation using Supabase for real multi-device teams.
 * Replace imports in AuthContext.tsx to use this instead of storage.ts
 */

// --- Helper Functions ---

const mapProfileToUser = (profile: any, role?: string): User => ({
  id: profile.id,
  name: profile.name || profile.email?.split('@')[0] || 'Unknown',
  email: profile.email,
  avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=1a1a1a&color=fff`,
  role: role as User['role'] || 'member',
  googleDriveConnected: !!profile.google_drive_token,
  googleDriveEmail: profile.google_drive_email
});

const mapTeamWithMembers = async (team: any): Promise<Team> => {
  // Get team members with their profiles
  const { data: teamMembers, error } = await supabase
    .from('team_members')
    .select(`
      role,
      profiles (id, name, email, avatar)
    `)
    .eq('team_id', team.id);

  if (error) throw error;

  const members = teamMembers?.map((tm: any) =>
    mapProfileToUser(tm.profiles, tm.role)
  ) || [];

  return {
    id: team.id,
    name: team.name,
    ownerId: team.owner_id,
    members
  };
};

const mapProjectFromDb = (project: any): Project => ({
  id: project.id,
  teamId: project.team_id,
  ownerId: project.owner_id,
  title: project.title,
  status: project.status as ProjectStatus,
  visibility: project.visibility || 'team',
  pinned: project.pinned || false,
  // Extract fields from the JSONB content field
  client: project.content?.client || '',
  essence: project.content?.essence || '',
  layout: project.content?.layout || 'manuscript',
  tasks: project.content?.tasks || [],
  boardItems: project.content?.boardItems || [],
  collaborators: project.content?.collaborators || [project.owner_id], // Ensure owner is in collaborators
  createdAt: new Date(project.created_at).getTime()
});

const mapProjectToDb = (project: Project) => {
  const dbProject: any = {
    team_id: project.teamId,
    owner_id: project.ownerId,
    title: project.title,
    status: project.status,
    visibility: project.visibility,
    pinned: project.pinned,
    content: {
      client: project.client,
      essence: project.essence,
      layout: project.layout,
      tasks: project.tasks,
      boardItems: project.boardItems,
      collaborators: project.collaborators
    }
  };

  // Only include id if it's a valid UUID (for updates, not inserts)
  if (project.id && project.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    dbProject.id = project.id;
  }

  return dbProject;
};

// --- Auth Services ---

export const authService = {
  // OAuth Login
  async loginWithOAuth(provider: 'google' | 'github'): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw new Error(`Failed to sign in with ${provider}: ${error.message}`);
  },

  // Email/Password Login
  async login(email: string, password?: string): Promise<User> {
    if (password) {
      // Password-based login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw new Error("Invalid email or password.");
      if (!data.user) throw new Error("Authentication failed.");

      return await this.getCurrentUser() as User;
    } else {
      // Magic link login
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) throw new Error("Failed to send magic link. Please check your email address.");

      throw new Error("CHECK_EMAIL"); // Special error code for UI handling
    }
  },

  // Email/Password Signup
  async signup(name: string, email: string, password: string): Promise<{ user: User, team: Team }> {
    // Sign up the user with password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user");

    // For email confirmation flow, we need to wait for the user to confirm their email
    if (!authData.session) {
      throw new Error("CONFIRM_EMAIL"); // Special error code
    }

    // Wait a bit for the profile trigger to fire
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a default team for this user
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${name}'s Studio`,
        owner_id: authData.user.id
      })
      .select()
      .single();

    if (teamError) throw new Error("Failed to create team");

    // Add user to the team as owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamData.id,
        user_id: authData.user.id,
        role: 'owner'
      });

    if (memberError) throw new Error("Failed to add user to team");

    const user = mapProfileToUser({
      id: authData.user.id,
      name: name,
      email: email
    }, 'owner');

    const team: Team = {
      id: teamData.id,
      name: teamData.name,
      ownerId: teamData.owner_id,
      members: [user]
    };

    return { user, team };
  },

  // Magic Link Signup (for OAuth users)
  async signupWithOAuth(name: string, email: string): Promise<{ user: User, team: Team }> {
    // This will be called after OAuth callback for new users
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) throw new Error("No authenticated user found");

    // Update profile with provided name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', currentUser.id);

    if (profileError) throw new Error("Failed to update profile");

    // Create a default team for this user
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${name}'s Studio`,
        owner_id: currentUser.id
      })
      .select()
      .single();

    if (teamError) throw new Error("Failed to create team");

    // Add user to the team as owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamData.id,
        user_id: currentUser.id,
        role: 'owner'
      });

    if (memberError) throw new Error("Failed to add user to team");

    const user = mapProfileToUser({
      id: currentUser.id,
      name: name,
      email: email
    }, 'owner');

    const team: Team = {
      id: teamData.id,
      name: teamData.name,
      ownerId: teamData.owner_id,
      members: [user]
    };

    return { user, team };
  },

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw new Error("Failed to send reset email. Please check your email address.");
  },

  // Update Password (after reset)
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw new Error("Failed to update password.");
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return null;

    // Get user's role from their first team (simplified)
    const { data: teamMember, error: roleError } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const role = teamMember?.role || 'member';

    return mapProfileToUser(profile, role);
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// --- Data Services ---

export const dbService = {
  // NEW: Get all teams user belongs to (replaces getTeam)
  async getUserTeams(userId: string): Promise<Team[]> {
    const { data: teamMembers, error: memberError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (id, name, owner_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }); // First team created = default

    if (memberError || !teamMembers) return [];

    const teams = await Promise.all(
      teamMembers.map(async (tm: any) => {
        if (!tm.teams) return null;
        return await mapTeamWithMembers(tm.teams);
      })
    );

    return teams.filter((t): t is Team => t !== null);
  },

  // NEW: Get specific team by ID
  async getTeamById(teamId: string): Promise<Team | null> {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error || !team) return null;
    return await mapTeamWithMembers(team);
  },

  // NEW: Get user's role in a specific team
  async getUserRoleInTeam(userId: string, teamId: string): Promise<User['role']> {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();

    return data?.role || 'member';
  },

  // NEW: Get team members for collaborator selection
  async getTeamMembersForCollaborators(teamId: string): Promise<User[]> {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        role,
        profiles (id, name, email, avatar)
      `)
      .eq('team_id', teamId);

    if (error) throw new Error("Failed to fetch team members");

    return teamMembers?.map((tm: any) =>
      mapProfileToUser(tm.profiles, tm.role)
    ) || [];
  },

  // DEPRECATED: Use getUserTeams instead
  async getTeam(userId: string): Promise<Team | null> {
    const teams = await this.getUserTeams(userId);
    return teams[0] || null;
  },

  async updateTeamName(teamId: string, name: string): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({ name })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw new Error("Failed to update team name");

    return await mapTeamWithMembers(data);
  },

  async updateMemberRole(teamId: string, userId: string, memberId: string, newRole: 'admin' | 'member' | 'viewer'): Promise<void> {
    const { error } = await supabase.rpc('update_team_member_role', {
      p_team_id: teamId,
      p_user_id: userId,
      p_member_id: memberId,
      p_new_role: newRole
    });

    if (error) throw new Error(error.message || "Failed to update member role");
  },

  async removeMember(teamId: string, userId: string, memberToRemove: string): Promise<void> {
    const { error } = await supabase.rpc('remove_team_member', {
      p_team_id: teamId,
      p_user_id: userId,
      p_member_to_remove: memberToRemove
    });

    if (error) throw new Error(error.message || "Failed to remove member");
  },

  async transferOwnership(teamId: string, currentOwnerId: string, newOwnerId: string): Promise<void> {
    const { error } = await supabase.rpc('transfer_team_ownership', {
      p_team_id: teamId,
      p_current_owner_id: currentOwnerId,
      p_new_owner_id: newOwnerId
    });

    if (error) throw new Error(error.message || "Failed to transfer ownership");
  },

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('soft_delete_team', {
      p_team_id: teamId,
      p_user_id: userId
    });

    if (error) throw new Error(error.message || "Failed to delete team");
  },

  async restoreTeam(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('restore_deleted_team', {
      p_team_id: teamId,
      p_user_id: userId
    });

    if (error) throw new Error(error.message || "Failed to restore team");
  },

  async inviteMember(teamId: string, email: string, role: User['role']): Promise<User> {
    // Check if user already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    console.log('inviteMember - profile lookup:', { email, existingProfile, profileError });

    if (profileError || !existingProfile) {
      if (profileError) {
        console.error('Profile lookup error:', profileError);
      }
      throw new Error("USER_NOT_FOUND");
    }

    // Check if user is already a team member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', existingProfile.id)
      .single();

    console.log('inviteMember - member check:', { existingMember, memberCheckError });

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    // Add user to team
    const { data: insertedMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: existingProfile.id,
        role: role
      })
      .select()
      .single();

    console.log('inviteMember - insert result:', { insertedMember, memberError });

    if (memberError) {
      console.error('Failed to add user to team:', memberError);
      throw new Error(`Failed to add user to team: ${memberError.message}`);
    }

    return mapProfileToUser(existingProfile, role);
  },

  async getProjects(teamId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw new Error("Failed to fetch projects");

    return data?.map(mapProjectFromDb) || [];
  },

  async getAllUserProjects(userId: string): Promise<Project[]> {
    // Fetch projects from all teams the user belongs to
    // The RLS policies will automatically filter to show only:
    // 1. Team-wide projects from teams they're members of
    // 2. Private projects where they're collaborators
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error("Failed to fetch projects");

    return data?.map(mapProjectFromDb) || [];
  },

  async toggleProjectPin(projectId: string): Promise<void> {
    // Get current pinned status
    const { data: project } = await supabase
      .from('projects')
      .select('pinned')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error("Project not found");

    // Toggle the pinned status
    const { error } = await supabase
      .from('projects')
      .update({ pinned: !project.pinned })
      .eq('id', projectId);

    if (error) throw new Error("Failed to toggle pin status");
  },

  async createProject(project: Project): Promise<Project> {
    const dbProject = mapProjectToDb(project);

    const { data, error } = await supabase
      .from('projects')
      .insert(dbProject)
      .select()
      .single();

    if (error) {
      console.error("Project creation error:", error);
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return mapProjectFromDb(data);
  },

  async updateProject(project: Project): Promise<Project> {
    const dbProject = mapProjectToDb(project);

    const { data, error } = await supabase
      .from('projects')
      .update(dbProject)
      .eq('id', project.id)
      .select()
      .single();

    if (error) throw new Error("Failed to update project");

    return mapProjectFromDb(data);
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error("Failed to delete project");
  },

  async saveGoogleDriveConnection(userId: string, googleDriveEmail: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        google_drive_token: 'CONNECTED', // We store the actual token in the browser's gapi session
        google_drive_email: googleDriveEmail,
        google_drive_connected_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw new Error("Failed to save Google Drive connection");
  },

  async removeGoogleDriveConnection(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        google_drive_token: null,
        google_drive_email: null,
        google_drive_connected_at: null
      })
      .eq('id', userId);

    if (error) throw new Error("Failed to remove Google Drive connection");
  },

  // --- Invitation System ---

  async inviteMemberNew(teamId: string, email: string, role: User['role'], invitedBy: string): Promise<Invitation> {
    // Check if user is already a team member
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', existingProfile.id)
        .single();

      if (existingMember) {
        throw new Error("User is already a member of this team");
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error("An invitation is already pending for this user");
    }

    // Create invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        team_id: teamId,
        email: email,
        role: role,
        invited_by: invitedBy
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    return {
      id: data.id,
      teamId: data.team_id,
      email: data.email,
      role: data.role,
      invitedBy: data.invited_by,
      status: data.status,
      token: data.token,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.expires_at).getTime()
    };
  },

  async getPendingInvitations(email: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        teams (name),
        profiles (name)
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) return [];

    return data?.map((inv: any) => ({
      id: inv.id,
      teamId: inv.team_id,
      teamName: inv.teams?.name,
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invited_by,
      invitedByName: inv.profiles?.name,
      status: inv.status,
      token: inv.token,
      createdAt: new Date(inv.created_at).getTime(),
      expiresAt: new Date(inv.expires_at).getTime()
    })) || [];
  },

  async getTeamInvitations(teamId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles (name)
      `)
      .eq('team_id', teamId)
      .in('status', ['pending'])
      .order('created_at', { ascending: false });

    if (error) return [];

    return data?.map((inv: any) => ({
      id: inv.id,
      teamId: inv.team_id,
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invited_by,
      invitedByName: inv.profiles?.name,
      status: inv.status,
      token: inv.token,
      createdAt: new Date(inv.created_at).getTime(),
      expiresAt: new Date(inv.expires_at).getTime()
    })) || [];
  },

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) throw new Error("Invitation not found");

    if (invitation.status !== 'pending') {
      throw new Error("This invitation is no longer valid");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("This invitation has expired");
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role
      });

    if (memberError && !memberError.message.includes('duplicate')) {
      throw new Error("Failed to add user to team");
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) throw new Error("Failed to update invitation status");
  },

  async declineInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) throw new Error("Failed to decline invitation");
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw new Error("Failed to cancel invitation");
  }
};