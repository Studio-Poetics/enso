
import { Project, User, Team, ProjectStatus } from '../types';

/**
 * STORAGE SERVICE
 * 
 * Currently implemented using LocalStorage for persistence on a single device.
 * To make this app "Real" for multi-device teams, replace the implementation
 * of these functions with calls to Supabase, Firebase, or your own API.
 */

const KEYS = {
  USERS: 'enso_users',
  TEAMS: 'enso_teams',
  PROJECTS: 'enso_projects',
  CURRENT_USER: 'enso_current_user_id'
};

// --- Helpers ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStore = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStore = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Auth Services ---

export const authService = {
  // OAuth Login (simulated in localStorage)
  async loginWithOAuth(provider: 'google' | 'github'): Promise<void> {
    await delay(1000);
    // In localStorage mode, we simulate OAuth by showing a message
    throw new Error(`OAuth with ${provider} is only available in production mode. Use email/password for development.`);
  },

  async login(email: string, password?: string): Promise<User> {
    await delay(600); // Simulate network
    const users = getStore<User>(KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) throw new Error("User not found. Please sign up.");

    // In localStorage mode, we don't actually verify passwords
    // This is just for development/simulation
    if (password && password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    localStorage.setItem(KEYS.CURRENT_USER, user.id);
    return user;
  },

  async signup(name: string, email: string, password: string): Promise<{ user: User, team: Team }> {
    await delay(800);
    const users = getStore<User>(KEYS.USERS);

    if (users.find(u => u.email === email)) {
      throw new Error("Email already exists.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const newUser: User = {
      id: 'u_' + Date.now(),
      name,
      email,
      role: 'owner', // First user is owner
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=fff`
    };

    // Create a default team for this user
    const newTeam: Team = {
      id: 't_' + Date.now(),
      name: `${name}'s Studio`,
      ownerId: newUser.id,
      members: [newUser]
    };

    // Store password hash simulation (not secure, just for development)
    const userWithPassword = { ...newUser, passwordHash: btoa(password) };

    users.push(userWithPassword);
    const teams = getStore<Team>(KEYS.TEAMS);
    teams.push(newTeam);

    setStore(KEYS.USERS, users);
    setStore(KEYS.TEAMS, teams);
    localStorage.setItem(KEYS.CURRENT_USER, newUser.id);

    return { user: newUser, team: newTeam };
  },

  async signupWithOAuth(name: string, email: string): Promise<{ user: User, team: Team }> {
    // Not applicable in localStorage mode
    throw new Error("OAuth signup is only available in production mode.");
  },

  async resetPassword(email: string): Promise<void> {
    await delay(500);
    const users = getStore<User>(KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error("No account found with that email address.");
    }

    // In localStorage mode, just simulate sending an email
    throw new Error("CHECK_EMAIL"); // Special error code for UI
  },

  async updatePassword(newPassword: string): Promise<void> {
    await delay(300);
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    // In localStorage mode, just simulate success
    console.log("Password updated (localStorage simulation)");
  },

  async getCurrentUser(): Promise<User | null> {
    const id = localStorage.getItem(KEYS.CURRENT_USER);
    if (!id) return null;
    const users = getStore<User>(KEYS.USERS);
    return users.find(u => u.id === id) || null;
  },

  async logout() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// --- Data Services ---

export const dbService = {
  async getTeam(userId: string): Promise<Team | null> {
    // In this simple version, we find the first team the user is a member of
    const teams = getStore<Team>(KEYS.TEAMS);
    return teams.find(t => t.members.some(m => m.id === userId)) || null;
  },

  async updateTeamName(teamId: string, name: string): Promise<Team> {
    const teams = getStore<Team>(KEYS.TEAMS);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) throw new Error("Team not found");
    
    teams[teamIndex].name = name;
    setStore(KEYS.TEAMS, teams);
    return teams[teamIndex];
  },

  async inviteMember(teamId: string, email: string, role: User['role']): Promise<User> {
    await delay(500);
    // In a real app, this would send an email. 
    // Here, we just create a "pending" user or find existing one.
    
    let users = getStore<User>(KEYS.USERS);
    let user = users.find(u => u.email === email);

    if (!user) {
      user = {
        id: 'u_' + Date.now(),
        name: email.split('@')[0],
        email,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
      };
      users.push(user);
      setStore(KEYS.USERS, users);
    }

    const teams = getStore<Team>(KEYS.TEAMS);
    const team = teams.find(t => t.id === teamId);
    if (team && !team.members.find(m => m.id === user!.id)) {
      team.members.push(user);
      setStore(KEYS.TEAMS, teams);
    }

    return user;
  },

  async getProjects(teamId: string): Promise<Project[]> {
    await delay(300);
    const projects = getStore<Project>(KEYS.PROJECTS);
    return projects.filter(p => p.teamId === teamId);
  },

  async createProject(project: Project): Promise<Project> {
    const projects = getStore<Project>(KEYS.PROJECTS);
    projects.unshift(project);
    setStore(KEYS.PROJECTS, projects);
    return project;
  },

  async updateProject(project: Project): Promise<Project> {
    const projects = getStore<Project>(KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
      setStore(KEYS.PROJECTS, projects);
    }
    return project;
  },

  async deleteProject(projectId: string): Promise<void> {
    const projects = getStore<Project>(KEYS.PROJECTS);
    const filtered = projects.filter(p => p.id !== projectId);
    setStore(KEYS.PROJECTS, filtered);
  }
};

// --- Initial Seed Data (Only runs once) ---
if (!localStorage.getItem(KEYS.PROJECTS)) {
  console.log("Seeding Database...");
  // We don't seed users, forcing a fresh login/signup flow to demonstrate functionality
  setStore(KEYS.PROJECTS, []);
  setStore(KEYS.TEAMS, []);
  setStore(KEYS.USERS, []);
}
