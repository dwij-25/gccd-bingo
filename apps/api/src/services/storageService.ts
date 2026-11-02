import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

export interface UploadedFileResult {
  url: string;
  path: string;
  size: number;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.storage.localUploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, bingoId: string, tileIndex: number): Promise<UploadedFileResult> {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const safeBingoId = bingoId.replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `tile_${safeBingoId}_${tileIndex}_${timestamp}${ext}`;
    const targetPath = path.join(this.uploadDir, filename);

    // Save locally
    await fs.promises.writeFile(targetPath, file.buffer);

    const publicUrl = `/uploads/${filename}`;
    return {
      url: publicUrl,
      path: filename,
      size: file.size
    };
  }

  async deleteFile(filePathOrUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(filePathOrUrl);
      const fullPath = path.join(this.uploadDir, filename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
    } catch (err) {
      console.warn('Error deleting file:', err);
    }
    return false;
  }
}

export const storageService = new StorageService();
