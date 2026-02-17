import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import Papa from 'papaparse';

export interface CSVLoaderOptions {
  column?: string; // Specific column to use as content
  separator?: string; // CSV separator (default: ',')
  combinedColumns?: boolean; // Combine all columns into content
}

export async function loadCSV(
  filepath: string,
  options: CSVLoaderOptions = {}
): Promise<Document[]> {
  try {
    console.log(`📄 Loading CSV file: ${filepath}`);

    const fileContent = fs.readFileSync(filepath, 'utf-8');

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: options.separator,
    });

    if (parseResult.errors.length > 0) {
      console.warn('⚠️ CSV parsing warnings:', parseResult.errors);
    }

    const data = parseResult.data as Record<string, any>[];
    console.log(`✅ Parsed ${data.length} rows from CSV`);

    if (data.length === 0) {
      throw new Error('CSV file is empty or invalid');
    }

    // Get column names
    const columns = Object.keys(data[0]);
    console.log(`   Columns found: ${columns.join(', ')}`);

    // Determine content strategy
    let contentColumn: string | undefined = options.column;

    // If no column specified, try to find a text column
    if (!contentColumn) {
      const textColumns = [
        'text',
        'content',
        'body',
        'description',
        'message',
        'document',
      ];
      contentColumn = columns.find(col =>
        textColumns.includes(col.toLowerCase())
      );
    }

    // Convert rows to documents
    const documents = data
      .map((row, idx) => {
        let pageContent: string;

        if (contentColumn && row[contentColumn]) {
          // Use specific column
          pageContent = String(row[contentColumn]);
        } else if (options.combinedColumns) {
          // Combine all columns
          pageContent = columns
            .map(col => `${col}: ${row[col]}`)
            .filter(line => line.split(': ')[1]) // Remove empty values
            .join('\n');
        } else {
          // Try to find any column with substantial text
          const textContent = columns
            .map(col => String(row[col] || ''))
            .find(val => val.length > 50);

          if (textContent) {
            pageContent = textContent;
          } else {
            // Fallback: combine all columns
            pageContent = columns
              .map(col => `${col}: ${row[col]}`)
              .filter(line => line.split(': ')[1])
              .join('\n');
          }
        }

        // Skip if content is empty
        if (!pageContent || pageContent.trim().length === 0) {
          console.warn(`⚠️ Skipping row ${idx + 1}: empty content`);
          return null;
        }

        // Create metadata from all other columns
        const metadata: Record<string, any> = {
          source: filepath,
          row: idx + 1,
          csv_columns: columns.join(','),
        };

        // Add all columns as metadata
        columns.forEach(col => {
          if (col !== contentColumn || options.combinedColumns) {
            const value = row[col];
            if (value !== null && value !== undefined && value !== '') {
              metadata[col] = value;
            }
          }
        });

        return new Document({
          pageContent: pageContent.trim(),
          metadata,
        });
      })
      .filter((doc): doc is Document => doc !== null);

    console.log(`✅ Created ${documents.length} documents from CSV`);

    if (documents.length === 0) {
      throw new Error(
        'No valid content found in CSV. Please specify a content column.'
      );
    }

    return documents;
  } catch (error) {
    console.error('❌ Error loading CSV:', error);
    throw new Error(
      `Failed to load CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
