import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import type { Document } from '@langchain/core/documents';

export async function loadDOCX(filepath: string): Promise<Document[]> {
  try {
    const loader = new DocxLoader(filepath);
    const docs = await loader.load();

    // DOCX loader returns single document, add metadata
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        document_type: 'docx',
      };
    });

    console.log(`DOCX loaded: ${docs[0].pageContent.length} characters`);
    return docs;
  } catch (error) {
    console.error('Error loading DOCX:', error);
    throw new Error(
      `Failed to load DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
