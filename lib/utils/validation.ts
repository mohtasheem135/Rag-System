// lib/utils/validation.ts

import { z } from 'zod';

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '20971520'); // 20MB default

// Allowed file types with their extensions
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/csv': ['.csv'],
  'application/vnd.ms-excel': ['.csv'], // Some systems detect CSV as this
};

const ALLOWED_TYPES = Object.keys(ALLOWED_FILE_TYPES) as [string, ...string[]];

// Extract allowed extensions as a regular array (not readonly)
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv'];

// Zod schema for file validation
export const fileValidationSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z
    .number()
    .positive('File size must be positive')
    .max(
      MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    ),
  type: z.string().refine(
    type => {
      // Check if MIME type is allowed
      if (ALLOWED_TYPES.includes(type)) {
        return true;
      }
      return false;
    },
    {
      message: 'Invalid file type. Only PDF, DOCX, TXT, and CSV are allowed',
    }
  ),
});

// Main file validation function
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size first (quick check)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Get file extension
  const extension = getFileExtension(file.name);

  // Check by MIME type
  const isValidMimeType = ALLOWED_TYPES.includes(file.type);

  // Check by extension as fallback
  const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: PDF, DOCX, TXT, CSV`,
    };
  }

  // Additional validation: ensure extension matches MIME type (if MIME type is recognized)
  if (isValidMimeType) {
    const expectedExtensions =
      ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];

    // Convert readonly array to regular array for includes check
    const extensionsArray = expectedExtensions ? [...expectedExtensions] : [];

    if (expectedExtensions && !extensionsArray.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} does not match MIME type ${file.type}`,
      };
    }
  }

  // Run Zod validation
  const result = fileValidationSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      valid: false,
      error: firstError?.message || 'Validation failed',
    };
  }

  return { valid: true };
}

// Validate file with detailed results
export function validateFileDetailed(file: File): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Size validation
  if (file.size === 0) {
    errors.push('File is empty');
  } else if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  // Name validation
  if (!file.name || file.name.trim().length === 0) {
    errors.push('Filename is required');
  }

  // Extension validation
  const extension = getFileExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(
      `Invalid file extension: ${extension}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // MIME type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    warnings.push(
      `Unrecognized MIME type: ${file.type}. Validating by extension only.`
    );
  }

  // Check extension-MIME type consistency
  if (ALLOWED_TYPES.includes(file.type)) {
    const expectedExtensions =
      ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];

    // Convert to regular array for includes check
    const extensionsArray = expectedExtensions ? [...expectedExtensions] : [];

    if (expectedExtensions && !extensionsArray.includes(extension)) {
      warnings.push(
        `File extension ${extension} may not match MIME type ${file.type}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Get file extension with validation
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot).toLowerCase();
}

// Sanitize filename for safe storage
export function sanitizeFilename(filename: string): string {
  // Get extension first
  const extension = getFileExtension(filename);
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1) {
    // No extension, sanitize entire filename
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  const nameWithoutExt = filename.slice(0, lastDot);

  // Sanitize the name part
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();

  return sanitizedName + extension;
}

// Generate unique filename with timestamp
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const extension = getFileExtension(sanitized);
  const lastDot = sanitized.lastIndexOf('.');

  if (lastDot === -1) {
    // No extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${sanitized}_${timestamp}_${randomStr}`;
  }

  const nameWithoutExt = sanitized.slice(0, lastDot);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  return `${nameWithoutExt}_${timestamp}_${randomStr}${extension}`;
}

// Get human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Check if file type is supported
export function isSupportedFileType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}

// Get allowed file types info
export function getAllowedFileTypesInfo(): {
  mimeTypes: string[];
  extensions: string[];
  maxSize: string;
  description: string;
} {
  return {
    mimeTypes: ALLOWED_TYPES,
    extensions: ALLOWED_EXTENSIONS,
    maxSize: formatFileSize(MAX_FILE_SIZE),
    description: 'PDF, DOCX, TXT, and CSV files are supported',
  };
}

// Validate multiple files at once
export function validateFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: validation.error || 'Unknown error' });
    }
  }

  return { valid, invalid };
}

// Export constants
export { MAX_FILE_SIZE, ALLOWED_EXTENSIONS };
