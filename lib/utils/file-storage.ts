// lib/utils/file-storage.ts
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFilename } from './validation';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveFile(
  file: File
): Promise<{ filepath: string; filename: string }> {
  await ensureUploadDir();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueId = uuidv4();
  const sanitized = sanitizeFilename(file.name);
  const filename = `${uniqueId}_${sanitized}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  return { filepath, filename };
}

export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}
