import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import type { Document } from '@langchain/core/documents';

export async function loadPDF(filepath: string): Promise<Document[]> {
  try {
    const loader = new PDFLoader(filepath, {
      splitPages: true, // Each page becomes a separate document
    });

    const docs = await loader.load();

    // Add page numbers to metadata
    docs.forEach((doc, index) => {
      doc.metadata = {
        ...doc.metadata,
        page_number: index + 1,
        total_pages: docs.length,
      };
    });

    console.log(`PDF loaded: ${docs.length} pages extracted`);
    return docs;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw new Error(
      `Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
