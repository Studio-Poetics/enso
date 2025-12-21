import React from 'react';
import { User } from '../types';
import { X } from 'lucide-react';
import GoogleDriveSettings from './GoogleDriveSettings';

interface UserSettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ user, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 bg-sumi/50 dark:bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-paper dark:bg-neutral-900 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-fade-in-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-white dark:bg-neutral-900">
          <div className="flex-1 mr-8">
            <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-2">
              User Settings
            </p>
            <h2 className="font-serif text-2xl text-sumi dark:text-paper">{user.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-sumi dark:hover:text-paper transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

          {/* Google Drive Integration */}
          <GoogleDriveSettings user={user} onUpdate={onUpdate} />

          {/* Future settings can be added here */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-serif text-sumi dark:text-paper mb-4">
              Other Settings
            </h3>
          </div> */}

        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
