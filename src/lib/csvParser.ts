/**
 * Pure client-side defensive CSV and TXT recipient parser.
 * Handles BOM, CRLF, varying separators, quoted values, headers, duplicates, and malformed rows.
 */

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_ROW_LIMIT = 5000;

export interface RejectedRow {
  rowNumber: number;
  value: string;
  reason: 'Duplicate email' | 'Invalid email format';
}

export interface ParseResult {
  validEmails: string[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  totalRows: number;
  rejectedRows: RejectedRow[];
  fileName: string;
  fileSizeBytes: number;
  formattedFileSize: string;
}

/**
 * Pragmatic email validation regex conforming to standard web email patterns.
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Header detection keywords.
 */
const HEADER_KEYWORDS = ['email', 'e-mail', 'recipient', 'address', 'mail', 'contact'];

/**
 * Format bytes into human-readable string: e.g. "14.2 KB", "1.5 MB".
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extracts candidate tokens from a single delimited line.
 * Respects quotes, commas, semicolons, and tabs.
 */
function extractTokens(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim().replace(/^["']|["']$/g, ''));
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim().replace(/^["']|["']$/g, ''));
  }

  return tokens;
}

/**
 * Finds an email address token within a line or list of columns.
 */
function findEmailInTokens(tokens: string[]): string | null {
  for (const token of tokens) {
    // Direct match
    if (EMAIL_REGEX.test(token)) {
      return token.toLowerCase();
    }

    // Handle "Name <email@domain.com>" format
    const angleMatch = token.match(/<([^>]+)>/);
    if (angleMatch && EMAIL_REGEX.test(angleMatch[1].trim())) {
      return angleMatch[1].trim().toLowerCase();
    }
  }
  return null;
}

/**
 * Parses raw text content extracted from a CSV or TXT lead file.
 */
export function parseLeadText(
  rawText: string,
  fileName: string,
  fileSizeBytes: number
): ParseResult {
  // 1. Strip UTF-8 BOM if present
  let cleanText = rawText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  // 2. Normalize Windows \r\n and old Mac \r to \n
  const lines = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.length > MAX_ROW_LIMIT) {
    throw new Error(
      `File exceeds the ${MAX_ROW_LIMIT.toLocaleString()} row limit. Please split your leads list.`
    );
  }

  const validEmails: string[] = [];
  const seenEmails = new Set<string>();
  const rejectedRows: RejectedRow[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;
  let totalDataRows = 0;

  // 3. Inspect row 0 to detect if it is a header row
  let startIndex = 0;
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine) {
      const firstLineTokens = extractTokens(firstLine);
      const isHeader = firstLineTokens.some((t) =>
        HEADER_KEYWORDS.includes(t.toLowerCase())
      );
      const containsValidEmail = !!findEmailInTokens(firstLineTokens);

      if (isHeader && !containsValidEmail) {
        startIndex = 1; // Skip header row
      }
    }
  }

  // 4. Process each data row
  for (let i = startIndex; i < lines.length; i++) {
    const rowNumber = i + 1;
    const rawLine = lines[i].trim();

    // Ignore trailing empty lines at end of file
    if (!rawLine) {
      continue;
    }

    totalDataRows++;
    const tokens = extractTokens(rawLine);
    const email = findEmailInTokens(tokens);

    if (email) {
      if (seenEmails.has(email)) {
        duplicateCount++;
        if (rejectedRows.length < 15) {
          rejectedRows.push({
            rowNumber,
            value: email,
            reason: 'Duplicate email',
          });
        }
      } else {
        seenEmails.add(email);
        validEmails.push(email);
      }
    } else {
      invalidCount++;
      if (rejectedRows.length < 15) {
        const previewVal = rawLine.length > 40 ? `${rawLine.slice(0, 37)}...` : rawLine;
        rejectedRows.push({
          rowNumber,
          value: previewVal || '(empty)',
          reason: 'Invalid email format',
        });
      }
    }
  }

  return {
    validEmails,
    validCount: validEmails.length,
    invalidCount,
    duplicateCount,
    totalRows: totalDataRows,
    rejectedRows,
    fileName,
    fileSizeBytes,
    formattedFileSize: formatBytes(fileSizeBytes),
  };
}

/**
 * Validates file constraints and reads file as text.
 */
export async function parseLeadFile(file: File): Promise<ParseResult> {
  // Validate file size cap
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds the 2MB size limit (${formatBytes(file.size)}). Please upload a smaller file.`
    );
  }

  // Validate extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'csv' && extension !== 'txt') {
    throw new Error('Only .csv and .txt files are supported.');
  }

  // Read file text with FileReader fallback for older browsers and jsdom
  let text: string;
  if (typeof file.text === 'function') {
    text = await file.text();
  } else {
    text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  return parseLeadText(text, file.name, file.size);
}
