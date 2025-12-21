import React, { useState } from 'react';
import { Project, User, Team } from '../types';
import { UserPlus, X, Users } from 'lucide-react';

interface CollaboratorPanelProps {
  project: Project;
  team: Team;
  onUpdateCollaborators: (collaboratorIds: string[]) => void;
  canManage: boolean;
}

const CollaboratorPanel: React.FC<CollaboratorPanelProps> = ({
  project,
  team,
  onUpdateCollaborators,
  canManage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const collaborators = team.members.filter(m =>
    project.collaborators.includes(m.id)
  );

  const availableMembers = team.members.filter(m =>
    !project.collaborators.includes(m.id)
  );

  const handleAdd = (userId: string) => {
    onUpdateCollaborators([...project.collaborators, userId]);
    setShowAddModal(false);
  };

  const handleRemove = (userId: string) => {
    if (userId === project.ownerId) return; // Can't remove owner
    onUpdateCollaborators(project.collaborators.filter(id => id !== userId));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
        title="Manage collaborators"
      >
        <Users size={18} />
        <span className="text-xs uppercase tracking-widest font-medium">
          Collaborators ({collaborators.length})
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="bg-paper dark:bg-neutral-900 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-xl text-sumi dark:text-paper">Collaborators</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Collaborators List */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {collaborators.map(collab => (
                <div key={collab.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded">
                  <div className="flex items-center gap-3">
                    <img
                      src={collab.avatar}
                      alt={collab.name}
                      className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-sumi dark:text-paper">{collab.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {collab.id === project.ownerId ? 'Owner' : 'Collaborator'}
                      </p>
                    </div>
                  </div>
                  {canManage && collab.id !== project.ownerId && (
                    <button
                      onClick={() => handleRemove(collab.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Remove collaborator"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No collaborators yet
                </p>
              )}
            </div>

            {/* Add Button */}
            {canManage && availableMembers.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-vermilion hover:text-vermilion transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  <span className="text-xs uppercase tracking-widest font-medium">Add Collaborator</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Collaborator Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddModal(false)}>
              <div className="bg-paper dark:bg-neutral-900 w-full max-w-sm p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in-up max-h-[32rem] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-sumi dark:text-paper">Add Team Member</h4>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-sumi dark:hover:text-paper"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {availableMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleAdd(member.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 text-left rounded transition-colors"
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-sumi dark:text-paper">{member.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CollaboratorPanel;
