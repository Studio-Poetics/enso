import React, { useState, useEffect } from 'react';
import { Invitation } from '../types';
import { dbService } from '../services';
import { Bell, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InvitationNotifications: React.FC = () => {
  const { user, refreshTeam, switchTeam } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      loadInvitations();
    }
  }, [user?.email]);

  const loadInvitations = async () => {
    if (!user?.email) return;

    try {
      const invitations = await dbService.getPendingInvitations(user.email);
      setPendingInvitations(invitations);

      // Auto-show modal if there are new invitations
      if (invitations.length > 0 && !showModal) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleAccept = async (invitation: Invitation) => {
    if (!user) return;
    setProcessing(invitation.id);
    try {
      await dbService.acceptInvitation(invitation.id, user.id);
      await refreshTeam();

      // Switch to the newly joined team
      await switchTeam(invitation.teamId);

      // Reload invitations to remove accepted one
      await loadInvitations();
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      alert(`Failed to accept invitation: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitation: Invitation) => {
    setProcessing(invitation.id);
    try {
      await dbService.declineInvitation(invitation.id);
      await loadInvitations();
    } catch (error: any) {
      console.error('Failed to decline invitation:', error);
      alert(`Failed to decline invitation: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (pendingInvitations.length === 0) return null;

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-vermilion dark:hover:text-vermilion transition-colors"
        title="Team invitations"
      >
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 bg-vermilion text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {pendingInvitations.length}
        </span>
      </button>

      {/* Invitations Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-sumi/50 dark:bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-paper dark:bg-neutral-900 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 animate-fade-in-up">

            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <div>
                <h2 className="font-serif text-xl text-sumi dark:text-paper">Team Invitations</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You've been invited to join {pendingInvitations.length} team{pendingInvitations.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Invitations List */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {pendingInvitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="p-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  {/* Team Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sumi dark:text-paper">{invitation.teamName}</h3>
                      <span className="text-xs font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {invitation.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Invited by {invitation.invitedByName || 'Team Admin'}
                    </p>
                  </div>

                  {/* Expiration Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} />
                    <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleAccept(invitation)}
                      disabled={processing === invitation.id}
                      className="flex-1 bg-sumi dark:bg-paper text-white dark:text-sumi py-2 flex items-center justify-center gap-2 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors disabled:opacity-50 text-sm"
                    >
                      {processing === invitation.id ? 'Processing...' : (
                        <>
                          <Check size={16} />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDecline(invitation)}
                      disabled={processing === invitation.id}
                      className="flex-1 bg-gray-200 dark:bg-neutral-700 text-sumi dark:text-paper py-2 flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 text-sm"
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvitationNotifications;
