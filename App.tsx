import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ViewState } from './types';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import LoginScreen from './components/LoginScreen';
import AuthCallback from './components/AuthCallback';
import ResetPassword from './components/ResetPassword';
import { useAuth } from './context/AuthContext';
import { dbService } from './services';
import { Loader, Moon, Sun, Check, CloudUpload } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const App: React.FC = () => {
  const { user, activeTeam, isLoading: isAuthLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Simple routing based on URL
  const currentPath = window.location.pathname;
  const isAuthCallback = currentPath === '/auth/callback';
  const isPasswordReset = currentPath === '/auth/reset-password';

  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Projects function
  const loadProjects = async () => {
    if (user) {
      setIsDataLoading(true);
      try {
        // Fetch all projects from all teams the user belongs to
        const data = await dbService.getAllUserProjects(user.id);
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  // Load Projects when User changes
  useEffect(() => {
    loadProjects();
  }, [user]);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setView('PROJECT_DETAIL');
  };

  const handleBack = () => {
    setActiveProject(null);
    setView('DASHBOARD');
  };

  const handleUpdateProject = useCallback(async (updated: Project) => {
    // Optimistic UI Update
    const updatedProjects = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(updatedProjects);
    setActiveProject(updated);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Show saving status immediately
    setSaveStatus('saving');

    // Debounced save (wait 1 second after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await dbService.updateProject(updated);
        setSaveStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Failed to save project:", error);
        setSaveStatus('error');
        // Reset to idle after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 1000);
  }, [projects]);

  const handleCreateProject = async (newProject: Omit<Project, 'teamId' | 'ownerId'>) => {
    if (!user || !activeTeam) return;

    // Attach metadata
    const projectWithMeta: Project = {
      ...newProject,
      teamId: activeTeam.id,
      ownerId: user.id,
      // collaborators and visibility now come from newProject
    };

    // Optimistic Update
    setProjects([projectWithMeta, ...projects]);
    setIsModalOpen(false);
    setActiveProject(projectWithMeta);
    setView('PROJECT_DETAIL');

    // Persist and get the real project with proper UUID from database
    try {
      const savedProject = await dbService.createProject(projectWithMeta);
      // Update with the real project from database (has proper UUID)
      setProjects(prev => [savedProject, ...prev.filter(p => p.id !== projectWithMeta.id)]);
      setActiveProject(savedProject);
    } catch (error) {
      console.error("Failed to create project:", error);
      // Rollback optimistic update on error
      setProjects(prev => prev.filter(p => p.id !== projectWithMeta.id));
      alert("Failed to create project. Please try again.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    // Optimistic Update
    setProjects(projects.filter(p => p.id !== projectId));

    // Persist
    try {
      await dbService.deleteProject(projectId);
    } catch (error) {
      console.error("Failed to delete project", error);
      // Revert if failed (optional, but good practice)
      if (activeTeam) {
        const data = await dbService.getProjects(activeTeam.id);
        setProjects(data);
      }
    }
  };

  // Handle special auth routes
  if (isAuthCallback) {
    return <AuthCallback />;
  }

  if (isPasswordReset) {
    return <ResetPassword />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-sumi">
        <Loader className="animate-spin text-vermilion" size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-sumi text-sumi dark:text-paper selection:bg-vermilion selection:text-white transition-colors duration-300">
      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
          saveStatus === 'saving' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
          saveStatus === 'saved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
          'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {saveStatus === 'saving' && (
            <>
              <CloudUpload size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check size={16} />
              <span className="text-sm font-medium">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <span className="text-sm font-medium">Save failed</span>
            </>
          )}
        </div>
      )}

      {view === 'DASHBOARD' && (
        <ProjectList
          projects={projects}
          onSelectProject={handleSelectProject}
          onNewProject={() => setIsModalOpen(true)}
          onDeleteProject={handleDeleteProject}
          onRefresh={loadProjects}
        />
      )}

      {view === 'PROJECT_DETAIL' && activeProject && (
        <ProjectDetail
          project={activeProject}
          onBack={handleBack}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {isModalOpen && (
        <NewProjectModal 
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateProject}
        />
      )}
      
      {/* Global Footer / Philosophy */}
      <footer className="fixed bottom-4 left-8 right-8 pointer-events-auto flex justify-between items-center z-40">
        <a 
          href="https://poetics.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 dark:text-gray-400 font-sans tracking-widest hover:text-sumi dark:hover:text-white transition-colors font-medium"
        >
          LESS BUT BETTER | poetics.studio
        </a>

        <button 
          onClick={toggleTheme}
          className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-white transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </footer>
    </div>
  );
};

export default App;