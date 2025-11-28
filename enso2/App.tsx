import React, { useState, useEffect } from 'react';
import { Project, ViewState } from './types';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './context/AuthContext';
import { dbService } from './services/storage';
import { Loader, Moon, Sun } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

const App: React.FC = () => {
  const { user, team, isLoading: isAuthLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Load Projects when User/Team changes
  useEffect(() => {
    const loadProjects = async () => {
      if (team) {
        setIsDataLoading(true);
        try {
          const data = await dbService.getProjects(team.id);
          setProjects(data);
        } catch (error) {
          console.error("Failed to load projects", error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };
    loadProjects();
  }, [team]);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setView('PROJECT_DETAIL');
  };

  const handleBack = () => {
    setActiveProject(null);
    setView('DASHBOARD');
  };

  const handleUpdateProject = async (updated: Project) => {
    // Optimistic UI Update
    const updatedProjects = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(updatedProjects);
    setActiveProject(updated);
    
    // Persist
    await dbService.updateProject(updated);
  };

  const handleCreateProject = async (newProject: Omit<Project, 'teamId' | 'ownerId' | 'collaborators'>) => {
    if (!user || !team) return;
    
    // Attach metadata
    const projectWithMeta: Project = {
      ...newProject,
      teamId: team.id,
      ownerId: user.id,
      collaborators: [user.id]
    };

    // Optimistic Update
    setProjects([projectWithMeta, ...projects]);
    setIsModalOpen(false);
    setActiveProject(projectWithMeta);
    setView('PROJECT_DETAIL');

    // Persist
    await dbService.createProject(projectWithMeta);
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
      const data = await dbService.getProjects(team!.id);
      setProjects(data);
    }
  };

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
      {view === 'DASHBOARD' && (
        <ProjectList 
          projects={projects} 
          onSelectProject={handleSelectProject}
          onNewProject={() => setIsModalOpen(true)}
          onDeleteProject={handleDeleteProject}
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