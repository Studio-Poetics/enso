import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Plus, ArrowRight, BookOpen, Users, LogOut, Trash2, Settings, Pin, PinOff } from 'lucide-react';
import PhilosophyGuide from './PhilosophyGuide';
import TeamManageModal from './TeamManageModal';
import UserSettingsModal from './UserSettingsModal';
import InvitationNotifications from './InvitationNotifications';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onRefresh: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onNewProject, onDeleteProject, onRefresh }) => {
  const { user, teams, activeTeam, logout, refreshUser } = useAuth();
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.IDEA: return 'text-gray-500 dark:text-gray-400';
      case ProjectStatus.IN_PROGRESS: return 'text-vermilion';
      case ProjectStatus.REVIEW: return 'text-yellow-700 dark:text-yellow-500';
      case ProjectStatus.COMPLETE: return 'text-emerald-800 dark:text-emerald-500';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      onDeleteProject(projectId);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      await dbService.toggleProjectPin(projectId);
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  return (
    <div className="w-full min-h-screen px-8 md:px-16 py-12 animate-fade-in relative flex flex-col transition-colors duration-300">
      {showPhilosophy && <PhilosophyGuide onClose={() => setShowPhilosophy(false)} />}
      {showTeamModal && activeTeam && user && (
        <TeamManageModal
          team={activeTeam}
          currentUser={user}
          onClose={() => setShowTeamModal(false)}
        />
      )}
      {showSettings && user && (
        <UserSettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdate={refreshUser}
        />
      )}

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start mb-24 border-b border-gray-200 dark:border-gray-800 pb-8 gap-8 md:gap-0">
        
        {/* Left: Brand Identity */}
        <div className="flex flex-col justify-between h-full pt-2">
          <div>
            <h1 className="text-5xl font-serif font-light text-sumi dark:text-paper tracking-tight mb-3">Enso</h1>
            <div className="flex items-center gap-4">
               <a
                href="https://poetics.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 dark:text-gray-400 font-sans tracking-widest uppercase hover:text-vermilion transition-colors font-medium"
              >
                Designed by Studio Poetics
              </a>
              {activeTeam && (
                <span className="text-xs text-gray-400 dark:text-gray-600 font-sans tracking-widest uppercase font-medium">| &nbsp; {activeTeam.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="w-full md:w-auto flex flex-col items-end gap-12">
          
          {/* Top: User Profile (Extreme Right) */}
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-sumi dark:text-paper">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
             </div>
             <img src={user?.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
             
             <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

             <button
               onClick={() => setShowSettings(true)}
               className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors flex items-center gap-2 group"
               title="Settings"
             >
               <Settings size={18} className="group-hover:scale-110 transition-transform" />
               <span className="font-sans text-xs uppercase tracking-widest font-medium">Settings</span>
             </button>

             <InvitationNotifications />

             <button
               onClick={logout}
               className="text-gray-500 dark:text-gray-400 hover:text-vermilion transition-colors text-xs uppercase tracking-widest font-medium"
             >
               Sign Out
             </button>
          </div>

          {/* Bottom: Action Buttons */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowTeamModal(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors flex items-center gap-2 group"
              title="Manage Team & Members"
            >
              <Users size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-sans text-xs uppercase tracking-widest font-medium">Studio</span>
            </button>
            
            <button 
              onClick={() => setShowPhilosophy(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors flex items-center gap-2 group"
            >
              <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-sans text-xs uppercase tracking-widest hidden md:inline font-medium">Philosophy</span>
            </button>

            <button 
              onClick={onNewProject}
              className="ml-4 group flex items-center gap-3 px-8 py-4 bg-sumi dark:bg-paper text-white dark:text-sumi hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors duration-500 ease-out shadow-xl hover:shadow-2xl"
            >
              <span className="font-sans text-xs tracking-widest uppercase font-medium">New Work</span>
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Grid Layout - Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-16 gap-y-20 pb-24">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer flex flex-col justify-between h-72 border-t border-gray-300 dark:border-gray-700 hover:border-vermilion dark:hover:border-vermilion transition-colors duration-500 pt-6 relative"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600 group-hover:text-sumi dark:group-hover:text-paper transition-colors">0{project.id.slice(-2)}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleTogglePin(e, project.id)}
                    className={`transition-colors ${project.pinned ? 'text-vermilion' : 'text-gray-400 dark:text-gray-600 hover:text-vermilion dark:hover:text-vermilion'}`}
                    title={project.pinned ? "Unpin project" : "Pin project to top"}
                  >
                    {project.pinned ? <Pin size={14} className="fill-current" /> : <PinOff size={14} />}
                  </button>
                  <span className={`font-mono text-xs uppercase tracking-widest font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <h3 className="text-3xl font-serif text-sumi dark:text-paper mb-3 group-hover:translate-x-2 transition-transform duration-500 leading-tight">
                {project.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-sans tracking-wide mb-3">{project.client}</p>

              {/* Collaborator Avatars */}
              {project.collaborators && project.collaborators.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {project.collaborators.slice(0, 3).map((collabId, idx) => {
                    const collaborator = activeTeam?.members.find(m => m.id === collabId);
                    return collaborator ? (
                      <img
                        key={idx}
                        src={collaborator.avatar}
                        alt={collaborator.name}
                        className="w-6 h-6 rounded-full border-2 border-paper dark:border-sumi"
                        title={collaborator.name}
                      />
                    ) : null;
                  })}
                  {project.collaborators.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-paper dark:border-sumi flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                      +{project.collaborators.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-3 text-vermilion translate-y-2 group-hover:translate-y-0">
              <span className="text-xs uppercase tracking-widest font-medium">Enter Project</span>
              <ArrowRight size={14} />
            </div>

            <button 
              onClick={(e) => handleDeleteClick(e, project.id)}
              className="absolute bottom-6 right-0 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10"
              title="Delete Project"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-96 text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-700 rounded-sm">
            <p className="font-serif italic text-xl mb-6 text-gray-500 dark:text-gray-500">"Empty space allows new ideas to enter."</p>
            <button onClick={onNewProject} className="text-sm font-medium border-b border-gray-300 dark:border-gray-700 hover:text-sumi dark:hover:text-paper hover:border-sumi dark:hover:border-paper transition-colors pb-1 uppercase tracking-widest text-gray-500 dark:text-gray-400">Create your first project</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;