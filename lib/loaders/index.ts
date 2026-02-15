import type { Document } from '@langchain/core/documents';
import { loadPDF } from './pdf-loader';
import { loadDOCX } from './doc-loader';
import { loadText } from './text-loader';

export type SupportedFileType = 'pdf' | 'docx' | 'txt';

export async function loadDocument(
  filepath: string,
  fileType: string
): Promise<Document[]> {
  const type = getFileType(fileType);

  switch (type) {
    case 'pdf':
      return await loadPDF(filepath);
    case 'docx':
      return await loadDOCX(filepath);
    case 'txt':
      return await loadText(filepath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

function getFileType(mimeType: string): SupportedFileType {
  const typeMap: Record<string, SupportedFileType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'text/plain': 'txt',
  };

  const type = typeMap[mimeType];
  if (!type) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  return type;
}

export { loadPDF, loadDOCX, loadText };
