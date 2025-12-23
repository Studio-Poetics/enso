import React, { useState, useEffect } from 'react';
import { Team, User, Invitation } from '../types';
import { dbService } from '../services';
import { X, UserPlus, Shield, Mail, Edit2, Check, Loader, Clock, XCircle, UserMinus, Crown, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TeamManageModalProps {
  team: Team;
  currentUser: User;
  onClose: () => void;
}

const TeamManageModal: React.FC<TeamManageModalProps> = ({ team, currentUser, onClose }) => {
  const { refreshTeam } = useAuth();

  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState<User['role']>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');

  // Pending Invitations State
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  // Team Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Team Management State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load pending invitations
  useEffect(() => {
    loadPendingInvitations();
  }, [team.id]);

  const loadPendingInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const invitations = await dbService.getTeamInvitations(team.id);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setMessage('');

    try {
      await dbService.inviteMemberNew(team.id, inviteEmail, role, currentUser.id);
      await loadPendingInvitations();
      setMessage(`✅ Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('already a member')) {
        setMessage(`❌ ${inviteEmail} is already a team member`);
      } else if (error.message.includes('already pending')) {
        setMessage(`❌ An invitation is already pending for ${inviteEmail}`);
      } else {
        setMessage(`❌ Failed to send invitation: ${error.message}`);
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await dbService.cancelInvitation(invitationId);
      await loadPendingInvitations();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!teamName.trim() || teamName === team.name) {
        setIsEditingName(false);
        return;
    }
    setIsSavingName(true);
    try {
        await dbService.updateTeamName(team.id, teamName);
        await refreshTeam();
    } catch (error) {
        console.error("Failed to rename team", error);
    } finally {
        setIsSavingName(false);
        setIsEditingName(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      await dbService.updateMemberRole(team.id, currentUser.id, memberId, newRole);
      await refreshTeam();
    } catch (error: any) {
      alert(error.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from the team?`)) return;

    try {
      await dbService.removeMember(team.id, currentUser.id, memberId);
      await refreshTeam();
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;

    const newOwner = team.members.find(m => m.id === selectedNewOwner);
    if (!window.confirm(`Transfer team ownership to ${newOwner?.name}? This cannot be undone.`)) return;

    try {
      await dbService.transferOwnership(team.id, currentUser.id, selectedNewOwner);
      await refreshTeam();
      setShowTransferModal(false);
      alert('Ownership transferred successfully! You are now an admin.');
    } catch (error: any) {
      alert(error.message || 'Failed to transfer ownership');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Delete this team? All data will be kept for 30 days and can be recovered.')) return;

    try {
      await dbService.deleteTeam(team.id, currentUser.id);
      alert('Team deleted. Data will be kept for 30 days for recovery.');
      window.location.reload(); // Reload to show team as deleted
    } catch (error: any) {
      alert(error.message || 'Failed to delete team');
    }
  };

  const isOwner = currentUser.role === 'owner';
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 bg-sumi/50 dark:bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-paper dark:bg-neutral-900 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header / Team Name */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-white dark:bg-neutral-900">
          <div className="flex-1 mr-8">
            <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-2">Current Studio</p>
            
            {isEditingName ? (
                <div className="flex items-center gap-2">
                    <input 
                        autoFocus
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="font-serif text-2xl text-sumi dark:text-paper border-b border-vermilion focus:outline-none bg-transparent w-full"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                    />
                    <button 
                        onClick={handleUpdateName} 
                        disabled={isSavingName}
                        className="text-vermilion hover:scale-110 transition-transform"
                    >
                        {isSavingName ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3 group">
                    <h2 className="font-serif text-2xl text-sumi dark:text-paper">{team.name}</h2>
                    {isOwnerOrAdmin && (
                        <button 
                            onClick={() => setIsEditingName(true)} 
                            className="text-gray-400 hover:text-sumi dark:hover:text-paper opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
                 <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm ${currentUser.role === 'owner' ? 'bg-sumi dark:bg-paper text-white dark:text-sumi' : 'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-300'}`}>
                    Your Role: {currentUser.role}
                 </span>
            </div>
          </div>
          
          <button onClick={onClose} className="text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Member List */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">Members ({team.members.length})</h3>
            <div className="space-y-3">
              {team.members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={member.avatar || "https://via.placeholder.com/32"} alt={member.name} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div>
                      <p className="text-sm font-medium text-sumi dark:text-paper">
                        {member.name}
                        {member.role === 'owner' && <Crown size={14} className="inline ml-2 text-vermilion" />}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwner && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                        className="text-xs font-mono uppercase border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-neutral-800 text-sumi dark:text-paper cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">{member.role}</span>
                    )}

                    {isOwnerOrAdmin && member.role !== 'owner' && member.id !== currentUser.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="text-gray-400 hover:text-vermilion transition-colors"
                        title="Remove member"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations - Only visible to Owner/Admin */}
          {isOwnerOrAdmin && pendingInvitations.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium">
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="space-y-3">
                {pendingInvitations.map(invitation => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-900/50 flex items-center justify-center">
                        <Clock size={20} className="text-amber-600 dark:text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sumi dark:text-paper">{invitation.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Invited {new Date(invitation.createdAt).toLocaleDateString()} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">{invitation.role}</span>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-gray-400 hover:text-vermilion transition-colors"
                        title="Cancel invitation"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Form - Only visible to Owner/Admin */}
          {isOwnerOrAdmin && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-4">Invite Collaborator</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                       <Mail className="absolute top-3 left-3 text-gray-400" size={16} />
                       <input 
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@poetics.studio"
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-sumi dark:focus:border-paper text-sm text-sumi dark:text-paper"
                       />
                    </div>
                    <div className="relative">
                       <Shield className="absolute top-3 left-3 text-gray-400" size={16} />
                       <select 
                         value={role}
                         onChange={e => setRole(e.target.value as any)}
                         className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-sumi dark:focus:border-paper text-sm appearance-none cursor-pointer text-sumi dark:text-paper"
                       >
                         <option value="member">Member</option>
                         <option value="admin">Admin</option>
                         <option value="viewer">Viewer</option>
                       </select>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="w-full bg-sumi dark:bg-paper text-white dark:text-sumi py-3 flex items-center justify-center gap-2 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors disabled:opacity-50 shadow-lg"
                  >
                    {isInviting ? "Sending..." : "Send Invitation"}
                    <UserPlus size={16} />
                  </button>
    
                  {message && <p className="text-center text-xs text-vermilion animate-fade-in">{message}</p>}
                </form>
              </div>
          )}

          {/* Danger Zone - Only visible to Owner */}
          {isOwner && (
            <div className="pt-6 border-t border-vermilion/30">
              <h3 className="text-xs uppercase tracking-widest text-vermilion font-medium mb-4">Danger Zone</h3>
              <div className="space-y-3">
                {/* Transfer Ownership */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sumi dark:text-paper mb-1">Transfer Ownership</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Transfer team ownership to another member. You will become an admin.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="ml-4 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-xs uppercase tracking-wider font-medium flex items-center gap-2"
                    >
                      <Crown size={14} />
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Delete Team */}
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sumi dark:text-paper mb-1">Delete Team</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Permanently delete this team. Data will be kept for 30 days for recovery.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteTeam}
                      className="ml-4 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs uppercase tracking-wider font-medium flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-paper dark:bg-neutral-900 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-8">
            <h3 className="text-xl font-serif text-sumi dark:text-paper mb-4">Transfer Ownership</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select a team member to transfer ownership to. This action cannot be undone.
            </p>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {team.members
                .filter(m => m.role !== 'owner')
                .map(member => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                      selectedNewOwner === member.id
                        ? 'border-sumi dark:border-paper bg-white dark:bg-neutral-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newOwner"
                      value={member.id}
                      checked={selectedNewOwner === member.id}
                      onChange={(e) => setSelectedNewOwner(e.target.value)}
                      className="accent-vermilion"
                    />
                    <img
                      src={member.avatar || "https://via.placeholder.com/32"}
                      alt={member.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sumi dark:text-paper">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                    <span className="text-xs font-mono uppercase text-gray-400">{member.role}</span>
                  </label>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedNewOwner('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwner}
                className="flex-1 px-4 py-2 bg-vermilion text-white hover:bg-vermilion/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Crown size={16} />
                Transfer Ownership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManageModal;