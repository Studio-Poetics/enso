import { googleDriveService } from './google-drive';

export const MEDIA_CONFIG = {
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_QUALITY: 0.7,
  // 32kbps is sufficient for voice/speech, drastically reducing file size compared to default
  AUDIO_BITRATE: 32000,
  // Use Google Drive for files larger than 500KB to save localStorage space
  DRIVE_THRESHOLD_KB: 500,
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = MEDIA_CONFIG.IMAGE_MAX_WIDTH / img.width;

        // Only resize if width > MAX_WIDTH
        const width = scaleSize < 1 ? MEDIA_CONFIG.IMAGE_MAX_WIDTH : img.width;
        const height = scaleSize < 1 ? img.height * scaleSize : img.height;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject("Canvas context unavailable");
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', MEDIA_CONFIG.IMAGE_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gets file size in KB
 */
const getFileSizeKB = (file: File): number => {
  return file.size / 1024;
};

/**
 * Gets base64 size in KB
 */
const getBase64SizeKB = (base64: string): number => {
  // Base64 adds ~33% overhead, so actual data is roughly 75% of base64 length
  return (base64.length * 0.75) / 1024;
};

/**
 * Central processor for file uploads.
 * - Compresses images and uploads large files to Google Drive
 * - For small files, returns base64 for localStorage
 * - For large files, uploads to Google Drive and returns public URL
 */
export const processFile = async (file: File): Promise<string> => {
  const fileSizeKB = getFileSizeKB(file);
  const shouldUseGoogleDrive = fileSizeKB > MEDIA_CONFIG.DRIVE_THRESHOLD_KB && googleDriveService.isAvailable();

  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(file);
    const compressedSizeKB = getBase64SizeKB(compressed);

    // If compressed image is still large, upload to Google Drive
    if (compressedSizeKB > MEDIA_CONFIG.DRIVE_THRESHOLD_KB && googleDriveService.isAvailable()) {
      try {
        const driveFile = await googleDriveService.uploadBase64(
          compressed,
          `compressed_${file.name}`,
          'image/jpeg'
        );
        return driveFile.webContentLink;
      } catch (error) {
        console.warn('Google Drive upload failed, using base64:', error);
        return compressed;
      }
    }

    return compressed;
  }

  // For audio/video files
  if (shouldUseGoogleDrive) {
    try {
      const driveFile = await googleDriveService.uploadFile(file);
      return driveFile.webContentLink;
    } catch (error) {
      console.warn('Google Drive upload failed, using base64:', error);
      return readFileAsBase64(file);
    }
  }

  // For small files or when Google Drive is unavailable, use base64
  return readFileAsBase64(file);
};