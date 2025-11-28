
import { Project, User, Team, ProjectStatus } from '../types';

/**
 * STORAGE SERVICE
 * 
 * Projects are stored in IndexedDB (to handle large images).
 * Users and Teams are stored in LocalStorage (lightweight meta data).
 */

const KEYS = {
  USERS: 'enso_users',
  TEAMS: 'enso_teams',
  CURRENT_USER: 'enso_current_user_id'
};

// --- IndexedDB Helper (For Projects) ---
const DB_NAME = 'EnsoData';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';

const idb = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
        }
      };
    });
  },
  getAll: async (): Promise<Project[]> => {
    const db = await idb.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROJECT_STORE, 'readonly');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  },
  put: async (project: Project): Promise<void> => {
    const db = await idb.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROJECT_STORE, 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.put(project);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },
  delete: async (id: string): Promise<void> => {
    const db = await idb.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROJECT_STORE, 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
};


// --- LocalStorage Helpers (For Users/Teams) ---
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
  async login(email: string): Promise<User> {
    await delay(600); // Simulate network
    const users = getStore<User>(KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) throw new Error("User not found. Please sign up.");
    
    localStorage.setItem(KEYS.CURRENT_USER, user.id);
    return user;
  },

  async signup(name: string, email: string): Promise<{ user: User, team: Team }> {
    await delay(800);
    const users = getStore<User>(KEYS.USERS);
    
    if (users.find(u => u.email === email)) {
      throw new Error("Email already exists.");
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

    users.push(newUser);
    const teams = getStore<Team>(KEYS.TEAMS);
    teams.push(newTeam);

    setStore(KEYS.USERS, users);
    setStore(KEYS.TEAMS, teams);
    localStorage.setItem(KEYS.CURRENT_USER, newUser.id);

    return { user: newUser, team: newTeam };
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
    try {
      // Fetch from IndexedDB
      const allProjects = await idb.getAll();
      const teamProjects = allProjects.filter(p => p.teamId === teamId);
      
      // Sort by creation date descending
      return teamProjects.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error("Failed to fetch projects from IDB", e);
      return [];
    }
  },

  async createProject(project: Project): Promise<Project> {
    await idb.put(project);
    return project;
  },

  async updateProject(project: Project): Promise<Project> {
    await idb.put(project);
    return project;
  },

  async deleteProject(projectId: string): Promise<void> {
    await idb.delete(projectId);
  }
};

// --- Initial Setup ---
// Ensure Users/Teams stores exist in localStorage
if (!localStorage.getItem(KEYS.USERS)) setStore(KEYS.USERS, []);
if (!localStorage.getItem(KEYS.TEAMS)) setStore(KEYS.TEAMS, []);
