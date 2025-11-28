
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team } from '../types';
import { authService, dbService } from '../services/storage';

interface AuthContextType {
  user: User | null;
  team: Team | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const init = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const currentTeam = await dbService.getTeam(currentUser.id);
        setTeam(currentTeam);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const login = async (email: string) => {
    const user = await authService.login(email);
    setUser(user);
    const team = await dbService.getTeam(user.id);
    setTeam(team);
  };

  const signup = async (name: string, email: string) => {
    const { user, team } = await authService.signup(name, email);
    setUser(user);
    setTeam(team);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setTeam(null);
  };

  const refreshTeam = async () => {
    if (user) {
      const updatedTeam = await dbService.getTeam(user.id);
      setTeam(updatedTeam);
    }
  };

  return (
    <AuthContext.Provider value={{ user, team, isLoading, login, signup, logout, refreshTeam }}>
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
