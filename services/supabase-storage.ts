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
  role: role as User['role'] || 'member'
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
  // Extract fields from the JSONB content field
  client: project.content?.client || '',
  essence: project.content?.essence || '',
  layout: project.content?.layout || 'manuscript',
  tasks: project.content?.tasks || [],
  boardItems: project.content?.boardItems || [],
  collaborators: project.content?.collaborators || [],
  createdAt: new Date(project.created_at).getTime()
});

const mapProjectToDb = (project: Project) => ({
  id: project.id,
  team_id: project.teamId,
  owner_id: project.ownerId,
  title: project.title,
  status: project.status,
  content: {
    client: project.client,
    essence: project.essence,
    layout: project.layout,
    tasks: project.tasks,
    boardItems: project.boardItems,
    collaborators: project.collaborators
  }
});

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
  async getTeam(userId: string): Promise<Team | null> {
    // Get the user's first team
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams (id, name, owner_id)
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (memberError || !teamMember?.teams) return null;

    return await mapTeamWithMembers(teamMember.teams);
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

  async inviteMember(teamId: string, email: string, role: User['role']): Promise<User> {
    // Check if user already exists
    let { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    let userId: string;

    if (profileError || !existingProfile) {
      // Create a new user profile (they'll need to sign up later)
      const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(email);

      if (authError) throw new Error("Failed to send invitation");

      userId = authUser.user.id;

      // Create profile
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: email.split('@')[0]
        })
        .select()
        .single();

      if (newProfileError) throw new Error("Failed to create user profile");
      existingProfile = newProfile;
    } else {
      userId = existingProfile.id;
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role
      });

    if (memberError && !memberError.message.includes('duplicate')) {
      throw new Error("Failed to add user to team");
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
  }
};