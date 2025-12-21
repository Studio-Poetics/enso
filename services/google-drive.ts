export interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  discoveryDocs: string[];
  scopes: string;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
}

class GoogleDriveService {
  private isInitialized = false;
  private config: GoogleDriveConfig = {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scopes: 'https://www.googleapis.com/auth/drive.file'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: this.config.apiKey,
            clientId: this.config.clientId,
            discoveryDocs: this.config.discoveryDocs,
            scope: this.config.scopes
          });

          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async authenticate(): Promise<boolean> {
    await this.initialize();

    const authInstance = window.gapi.auth2.getAuthInstance();

    if (!authInstance.isSignedIn.get()) {
      try {
        await authInstance.signIn();
      } catch (error) {
        console.error('Google Drive authentication failed:', error);
        return false;
      }
    }

    return authInstance.isSignedIn.get();
  }

  async uploadFile(file: File, filename?: string): Promise<DriveFile> {
    const isAuthenticated = await this.authenticate();
    if (!isAuthenticated) {
      throw new Error('Google Drive authentication required');
    }

    const metadata = {
      name: filename || file.name,
      parents: ['appDataFolder'] // Store in app-specific folder
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Make file publicly readable
    await this.setFilePermissions(result.id);

    // Get the public link
    return await this.getFileInfo(result.id);
  }

  async uploadBase64(base64Data: string, filename: string, mimeType: string): Promise<DriveFile> {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    return this.uploadFile(file, filename);
  }

  private async setFilePermissions(fileId: string): Promise<void> {
    await window.gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      method: 'POST',
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  }

  private async getFileInfo(fileId: string): Promise<DriveFile> {
    const response = await window.gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      method: 'GET',
      params: {
        fields: 'id,name,webViewLink,webContentLink,thumbnailLink'
      }
    });

    return response.result;
  }

  async deleteFile(fileId: string): Promise<void> {
    const isAuthenticated = await this.authenticate();
    if (!isAuthenticated) {
      throw new Error('Google Drive authentication required');
    }

    await window.gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      method: 'DELETE'
    });
  }

  async getUserEmail(): Promise<string> {
    await this.initialize();
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      throw new Error('Not signed in to Google Drive');
    }
    const profile = authInstance.currentUser.get().getBasicProfile();
    return profile.getEmail();
  }

  async signOut(): Promise<void> {
    await this.initialize();
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
      await authInstance.signOut();
    }
    this.isInitialized = false;
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey && this.config.clientId && window.gapi);
  }
}

export const googleDriveService = new GoogleDriveService();

// Type declarations for gapi
declare global {
  interface Window {
    gapi: {
      load: (libraries: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        request: (request: any) => Promise<any>;
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          signIn: () => Promise<any>;
          signOut: () => Promise<void>;
          currentUser: {
            get: () => {
              getAuthResponse: () => {
                access_token: string;
              };
              getBasicProfile: () => {
                getEmail: () => string;
                getName: () => string;
              };
            };
          };
        };
      };
    };
  }
}