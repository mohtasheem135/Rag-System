import { z } from 'zod';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const fileValidationSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z
    .number()
    .max(
      MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    ),
  type: z.enum(ALLOWED_TYPES, {
    message: 'Invalid file type. Only PDF, DOCX, and TXT are allowed',
  }),
});

export function validateFile(file: File): { valid: boolean; error?: string } {
  const result = fileValidationSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!result.success) {
    const firstError =
      result.error.issues?.[0] || result.error.flatten().formErrors[0];
    return {
      valid: false,
      error:
        typeof firstError === 'string'
          ? firstError
          : firstError?.message || 'Validation failed',
    };
  }

  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
