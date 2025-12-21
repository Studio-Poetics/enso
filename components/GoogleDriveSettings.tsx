import React, { useState } from 'react';
import { User } from '../types';
import { Cloud, CloudOff, Check, Loader } from 'lucide-react';
import { googleDriveService } from '../services/google-drive';
import { dbService } from '../services';

interface GoogleDriveSettingsProps {
  user: User;
  onUpdate: () => void;
}

const GoogleDriveSettings: React.FC<GoogleDriveSettingsProps> = ({ user, onUpdate }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const isAuthenticated = await googleDriveService.authenticate();

      if (isAuthenticated) {
        const driveEmail = await googleDriveService.getUserEmail();
        await dbService.saveGoogleDriveConnection(user.id, driveEmail);
        setSuccess(`Connected to ${driveEmail}`);
        onUpdate();
      } else {
        setError('Failed to authenticate with Google Drive');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google Drive');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Your files will remain in Drive but won\'t be accessible from Enso.')) {
      return;
    }

    setIsDisconnecting(true);
    setError('');
    setSuccess('');

    try {
      await googleDriveService.signOut();
      await dbService.removeGoogleDriveConnection(user.id);
      setSuccess('Disconnected from Google Drive');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Google Drive');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif text-sumi dark:text-paper mb-2">
            Google Drive Integration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your Google Drive to store large files (images, videos, audio) directly in your personal Drive.
          </p>
        </div>
        <div className="ml-4">
          {user.googleDriveConnected ? (
            <Cloud className="text-emerald-600" size={32} />
          ) : (
            <CloudOff className="text-gray-400" size={32} />
          )}
        </div>
      </div>

      {user.googleDriveConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded">
            <Check size={16} />
            <span>Connected to: <strong>{user.googleDriveEmail}</strong></span>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDisconnecting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Google Drive'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Benefits:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Unlimited storage for media files</li>
              <li>Files stored in your personal Google Drive</li>
              <li>Automatic backup and sync</li>
              <li>Access files from anywhere</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !googleDriveService.isAvailable()}
            className="px-6 py-3 bg-sumi dark:bg-paper text-white dark:text-sumi hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {isConnecting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud size={16} />
                Connect Google Drive
              </>
            )}
          </button>

          {!googleDriveService.isAvailable() && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Google Drive API not configured. Contact admin to enable this feature.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default GoogleDriveSettings;
