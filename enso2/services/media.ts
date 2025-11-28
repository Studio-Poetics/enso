
export const MEDIA_CONFIG = {
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_QUALITY: 0.7,
  // 32kbps is sufficient for voice/speech, drastically reducing file size compared to default
  AUDIO_BITRATE: 32000, 
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
 * Central processor for file uploads.
 * - Compresses images.
 * - Passes through other supported types (Audio/Video) as Base64 for now.
 *   (Note: Real video compression requires server-side processing or ffmpeg.wasm)
 */
export const processFile = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }
  
  // For audio/video uploads, we return the raw base64.
  // Ideally, these should be uploaded to cloud storage (Google Drive) to save IDB quota.
  return readFileAsBase64(file);
};
