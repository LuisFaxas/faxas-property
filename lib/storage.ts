import { adminStorage } from './firebaseAdmin';
import { getDownloadURL } from 'firebase-admin/storage';

export async function generateSignedUrl(
  storagePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    const bucket = adminStorage().bucket();
    const file = bucket.file(storagePath);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export async function uploadFile(
  storagePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const bucket = adminStorage().bucket();
    const file = bucket.file(storagePath);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType,
      },
    });
    
    return storagePath;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFile(storagePath: string): Promise<boolean> {
  try {
    const bucket = adminStorage().bucket();
    const file = bucket.file(storagePath);
    
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}