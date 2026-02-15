import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import type { Document } from '@langchain/core/documents';

export async function loadText(filepath: string): Promise<Document[]> {
  try {
    const loader = new TextLoader(filepath);
    const docs = await loader.load();

    // Add metadata
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        document_type: 'text',
      };
    });

    console.log(`Text file loaded: ${docs[0].pageContent.length} characters`);
    return docs;
  } catch (error) {
    console.error('Error loading text file:', error);
    throw new Error(
      `Failed to load text file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
