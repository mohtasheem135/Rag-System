// lib/loaders/hf-loader.ts

import { Document } from '@langchain/core/documents';

export interface HFDatasetConfig {
  datasetName: string;
  split?: string;
  pageContentColumn: string;
  metadataColumns?: string[];
  config?: string;
}

export class HuggingFaceDatasetLoader {
  private config: HFDatasetConfig;

  constructor(config: HFDatasetConfig) {
    this.config = {
      split: 'train',
      metadataColumns: [],
      ...config,
    };
  }

  async load(): Promise<Document[]> {
    try {
      console.log(`📥 Loading HF dataset: ${this.config.datasetName}`);
      console.log(`   Split: ${this.config.split}`);
      console.log(`   Content column: ${this.config.pageContentColumn}`);

      // Build URLs to try
      const urls: string[] = [];

      // If config is explicitly provided, try it first
      if (this.config.config) {
        const urlWithConfig = `https://datasets-server.huggingface.co/rows?dataset=${this.config.datasetName}&config=${this.config.config}&split=${this.config.split}&offset=0&length=100`;
        urls.push(urlWithConfig);
        console.log(`   Config provided: ${this.config.config}`);
      }

      // Try without config (most common case)
      const urlWithoutConfig = `https://datasets-server.huggingface.co/rows?dataset=${this.config.datasetName}&split=${this.config.split}&offset=0&length=100`;
      urls.push(urlWithoutConfig);

      // If no config was provided, also try with 'default'
      if (!this.config.config) {
        const urlWithDefault = `https://datasets-server.huggingface.co/rows?dataset=${this.config.datasetName}&config=default&split=${this.config.split}&offset=0&length=100`;
        urls.push(urlWithDefault);
      }

      let data: any = null;
      let lastError: Error | null = null;
      let successUrl: string | null = null;

      // Try each URL until one works
      for (const url of urls) {
        try {
          console.log(`\n   🔄 Trying: ${url}`);
          const response = await fetch(url);

          if (response.ok) {
            data = await response.json();
            successUrl = url;
            console.log(`   ✅ Success!`);
            break;
          } else {
            const errorText = await response.text();
            console.log(
              `   ❌ Failed: ${response.status} ${response.statusText}`
            );
            lastError = new Error(
              `${response.status} ${response.statusText}: ${errorText}`
            );
          }
        } catch (error) {
          console.log(`   ❌ Error:`, error);
          lastError = error as Error;
        }
      }

      if (!data) {
        throw new Error(
          `Failed to fetch dataset after trying multiple configurations.\n` +
            `Last error: ${lastError?.message}\n\n` +
            `Please check:\n` +
            `1. Dataset name is correct: https://huggingface.co/datasets/${this.config.datasetName}\n` +
            `2. Split '${this.config.split}' exists\n` +
            `3. Dataset is public and accessible\n` +
            `4. Column '${this.config.pageContentColumn}' exists in the dataset`
        );
      }

      if (!data.rows || data.rows.length === 0) {
        throw new Error(
          `No rows found in dataset split '${this.config.split}'`
        );
      }

      console.log(
        `\n✅ Loaded ${data.rows.length} rows from HF dataset using: ${successUrl}`
      );

      // Validate that the content column exists
      const firstRow = data.rows[0]?.row;
      if (firstRow && !(this.config.pageContentColumn in firstRow)) {
        const availableColumns = Object.keys(firstRow);
        throw new Error(
          `Column '${this.config.pageContentColumn}' not found in dataset.\n` +
            `Available columns: ${availableColumns.join(', ')}`
        );
      }

      // Convert to LangChain Documents and filter out empty content
      let skippedCount = 0;
      const documents = data.rows
        .map((item: any, idx: number) => {
          const row = item.row;
          const pageContent = row[this.config.pageContentColumn];

          // Skip if content is missing, null, undefined, or empty string
          if (
            !pageContent ||
            typeof pageContent !== 'string' ||
            pageContent.trim().length === 0
          ) {
            skippedCount++;
            if (skippedCount <= 5) {
              // Only log first 5 to avoid spam
              console.warn(
                `   ⚠️  Skipping row ${idx}: empty or invalid content in column "${this.config.pageContentColumn}"`
              );
            }
            return null;
          }

          // Extract metadata
          const metadata: Record<string, any> = {
            source: `hf://${this.config.datasetName}`,
            row_index: idx,
            dataset_name: this.config.datasetName,
            split: this.config.split,
          };

          // Add config to metadata if it was used
          if (this.config.config) {
            metadata.dataset_config = this.config.config;
          }

          // Add specified metadata columns
          if (
            this.config.metadataColumns &&
            this.config.metadataColumns.length > 0
          ) {
            this.config.metadataColumns.forEach(col => {
              if (row[col] !== undefined) {
                metadata[col] = row[col];
              }
            });
          } else {
            // Include all columns except the content column
            Object.keys(row).forEach(key => {
              if (key !== this.config.pageContentColumn) {
                // Convert to string for ChromaDB compatibility
                const value = row[key];
                if (
                  typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean'
                ) {
                  metadata[key] = value;
                } else if (value !== null && value !== undefined) {
                  metadata[key] = JSON.stringify(value);
                }
              }
            });
          }

          return new Document({
            pageContent: String(pageContent).trim(),
            metadata,
          });
        })
        .filter((doc: any): doc is Document => doc !== null);

      if (documents.length === 0) {
        throw new Error(
          `No valid documents found. Column "${this.config.pageContentColumn}" may not exist or all rows are empty.`
        );
      }

      const filteredCount = data.rows.length - documents.length;
      console.log(
        `\n✅ Successfully created ${documents.length} valid documents` +
          (filteredCount > 0
            ? ` (filtered out ${filteredCount} empty rows)`
            : '')
      );

      return documents;
    } catch (error) {
      console.error('\n❌ HF dataset loading failed:', error);
      throw error;
    }
  }

  // Helper method to preview dataset structure
  async preview(limit: number = 5): Promise<{
    columns: string[];
    sampleRows: any[];
    totalRows: number;
  }> {
    try {
      console.log(`🔍 Previewing dataset: ${this.config.datasetName}`);

      const url = `https://datasets-server.huggingface.co/rows?dataset=${this.config.datasetName}&split=${this.config.split}&offset=0&length=${limit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rows || data.rows.length === 0) {
        throw new Error('No data available for preview');
      }

      const columns = Object.keys(data.rows[0].row);
      const sampleRows = data.rows.map((item: any) => item.row);

      return {
        columns,
        sampleRows,
        totalRows: data.rows.length,
      };
    } catch (error) {
      console.error('Preview failed:', error);
      throw error;
    }
  }

  // Helper method to validate configuration
  async validate(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    availableColumns?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const preview = await this.preview(1);

      // Check if content column exists
      if (!preview.columns.includes(this.config.pageContentColumn)) {
        errors.push(
          `Content column '${this.config.pageContentColumn}' not found. Available: ${preview.columns.join(', ')}`
        );
      }

      // Check metadata columns
      if (this.config.metadataColumns) {
        const missingColumns = this.config.metadataColumns.filter(
          col => !preview.columns.includes(col)
        );
        if (missingColumns.length > 0) {
          warnings.push(
            `Metadata columns not found: ${missingColumns.join(', ')}`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        availableColumns: preview.columns,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Validation failed');
      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }
}
