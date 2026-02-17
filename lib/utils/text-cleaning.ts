// lib/utils/text-cleaning.ts

export function cleanText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive newlines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // Remove lines that are just document IDs repeated (common in scanned docs)
  cleaned = cleaned.replace(/([A-Z]{3,}\d{8}\s*\n){5,}/g, '');

  // Remove excessive repetition of the same short phrase
  cleaned = cleaned.replace(/(.{1,50})\1{4,}/g, '$1');

  // Trim each line
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Final trim
  cleaned = cleaned.trim();

  return cleaned;
}

export function isValidChunk(text: string, minLength: number = 100): boolean {
  // Increased from 50 to 100
  if (!text || text.trim().length < minLength) {
    console.warn(
      `⚠️ Chunk rejected: too short (${text.trim().length} chars, need ${minLength})`
    );
    return false;
  }

  // Check if chunk is mostly repetitive
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words);

  // If less than 30% unique words, it's probably garbage
  if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
    console.warn(
      `⚠️ Chunk rejected: too repetitive (${uniqueWords.size}/${words.length} unique words)`
    );
    return false;
  }

  // Check if it's mostly document IDs or reference numbers
  const idPattern = /^[A-Z]{3,}\d{5,}$/;
  const lines = text.split('\n');
  const idLines = lines.filter(line => idPattern.test(line.trim()));

  if (idLines.length / lines.length > 0.7) {
    console.warn(`⚠️ Chunk rejected: mostly document IDs`);
    return false;
  }

  // Check if it's mostly special characters or numbers
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalNonWhitespace = text.replace(/\s/g, '').length;

  if (alphaCount / totalNonWhitespace < 0.4) {
    console.warn(
      `⚠️ Chunk rejected: too few letters (${alphaCount}/${totalNonWhitespace})`
    );
    return false;
  }

  return true;
}
