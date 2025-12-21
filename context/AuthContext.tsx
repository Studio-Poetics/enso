
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team } from '../types';
import { authService, dbService } from '../services';

interface AuthContextType {
  user: User | null;
  teams: Team[]; // CHANGED: Now supports multiple teams
  activeTeam: Team | null; // NEW: Currently active team
  team: Team | null; // DEPRECATED: For backward compatibility, returns activeTeam
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signupWithOAuth: (name: string, email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTeam: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>; // NEW: Switch active team
  refreshUser: () => Promise<void>; // NEW: Refresh user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]); // CHANGED: Array of teams
  const [activeTeam, setActiveTeam] = useState<Team | null>(null); // NEW: Active team
  const [isLoading, setIsLoading] = useState(true);

  const switchTeam = async (teamId: string) => {
    // Fetch fresh team data to avoid stale state
    const freshTeam = await dbService.getTeamById(teamId);

    if (!freshTeam || !user) return;

    // Get user's role in this specific team
    const role = await dbService.getUserRoleInTeam(user.id, teamId);

    // Update user with team-specific role
    setUser({ ...user, role });
    setActiveTeam(freshTeam);

    // Persist active team to localStorage
    localStorage.setItem('activeTeamId', teamId);
  };

  const init = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userTeams = await dbService.getUserTeams(currentUser.id);
        setTeams(userTeams);

        // Load active team from localStorage or default to first team
        const savedTeamId = localStorage.getItem('activeTeamId');
        const defaultTeam = savedTeamId
          ? userTeams.find(t => t.id === savedTeamId) || userTeams[0]
          : userTeams[0];

        if (defaultTeam) {
          // Get user's role in this specific team
          const role = await dbService.getUserRoleInTeam(currentUser.id, defaultTeam.id);

          // Update user with team-specific role
          setUser({ ...currentUser, role });
          setActiveTeam(defaultTeam);

          // Persist active team to localStorage
          localStorage.setItem('activeTeamId', defaultTeam.id);
        }
      }
    } catch (e) {
      console.error('Authentication error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const login = async (email: string, password?: string) => {
    const user = await authService.login(email, password);
    setUser(user);
    const userTeams = await dbService.getUserTeams(user.id);
    setTeams(userTeams);
    if (userTeams[0]) {
      // Get user's role in this specific team
      const role = await dbService.getUserRoleInTeam(user.id, userTeams[0].id);
      setUser({ ...user, role });
      setActiveTeam(userTeams[0]);
      localStorage.setItem('activeTeamId', userTeams[0].id);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    await authService.loginWithOAuth(provider);
    // OAuth login will redirect, so we don't need to set state here
  };

  const signup = async (name: string, email: string, password: string) => {
    const { user, team } = await authService.signup(name, email, password);
    setUser(user);
    setTeams([team]);
    setActiveTeam(team);
    localStorage.setItem('activeTeamId', team.id);
  };

  const signupWithOAuth = async (name: string, email: string) => {
    const { user, team } = await authService.signupWithOAuth(name, email);
    setUser(user);
    setTeams([team]);
    setActiveTeam(team);
    localStorage.setItem('activeTeamId', team.id);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setTeams([]);
    setActiveTeam(null);
    localStorage.removeItem('activeTeamId');
  };

  const refreshTeam = async () => {
    if (user && activeTeam) {
      const updatedTeam = await dbService.getTeamById(activeTeam.id);
      if (updatedTeam) {
        setActiveTeam(updatedTeam);
        // Update in teams list
        setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      }
    }
  };

  const refreshUser = async () => {
    if (user) {
      const updatedUser = await authService.getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      teams,
      activeTeam,
      team: activeTeam, // For backward compatibility
      isLoading,
      login,
      loginWithOAuth,
      signup,
      signupWithOAuth,
      resetPassword,
      logout,
      refreshTeam,
      switchTeam,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
