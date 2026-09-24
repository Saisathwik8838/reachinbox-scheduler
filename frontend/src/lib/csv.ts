export interface ParseLeadsResult {
  validEmails: string[];
  invalidRowsCount: number;
  totalRowsCount: number;
  fileName?: string;
  fileSizeFormatted?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Defensive CSV and TXT parser for email leads list.
 * Handles BOM, CRLF/LF, quoted values, custom delimiters (comma, semicolon, tab, pipe),
 * header rows, invalid emails, blank lines, and deduplication.
 */
export function parseLeadsContent(content: string, fileName?: string, fileSizeBytes?: number): ParseLeadsResult {
  // Strip UTF-8 BOM if present
  let sanitized = content.replace(/^\uFEFF/, '');

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rawLines = sanitized.split('\n');
  const validSet = new Set<string>();
  let invalidRows = 0;
  let totalDataRows = 0;

  let emailColumnIndex = -1;

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex].trim();
    if (!rawLine) {
      continue; // Skip purely empty lines
    }

    // Split line by common CSV delimiters (, ; \t |) respecting quotes
    const cells = splitCsvLine(rawLine);

    // Check if the very first non-empty row is a CSV header
    if (totalDataRows === 0 && lineIndex < 3) {
      const lowerCells = cells.map((c) => c.toLowerCase().trim());
      const headerIdx = lowerCells.findIndex(
        (cell) =>
          cell === 'email' ||
          cell === 'email address' ||
          cell === 'recipient' ||
          cell === 'mail' ||
          cell === 'leads' ||
          cell === 'contact email'
      );

      if (headerIdx !== -1) {
        emailColumnIndex = headerIdx;
        continue; // Header row skipped, not counted as invalid lead
      }
    }

    totalDataRows++;

    // Extract email candidate
    let candidate = '';
    if (emailColumnIndex !== -1 && emailColumnIndex < cells.length) {
      candidate = cells[emailColumnIndex].trim();
    } else {
      // Find the first cell or substring that matches an email pattern
      for (const cell of cells) {
        const trimmed = cell.trim();
        if (EMAIL_REGEX.test(trimmed)) {
          candidate = trimmed;
          break;
        }
      }

      // If no single cell matched cleanly, search for any email inside the whole line
      if (!candidate) {
        const matches = rawLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (matches && matches[0]) {
          candidate = matches[0];
        }
      }
    }

    const cleanEmail = candidate.trim().toLowerCase();
    if (cleanEmail && EMAIL_REGEX.test(cleanEmail)) {
      if (!validSet.has(cleanEmail)) {
        validSet.add(cleanEmail);
      } else {
        // Duplicate email in file
        invalidRows++;
      }
    } else {
      // Line contains no valid email
      invalidRows++;
    }
  }

  // Format file size
  let fileSizeFormatted = '';
  if (fileSizeBytes !== undefined) {
    if (fileSizeBytes < 1024) {
      fileSizeFormatted = `${fileSizeBytes} B`;
    } else if (fileSizeBytes < 1024 * 1024) {
      fileSizeFormatted = `${(fileSizeBytes / 1024).toFixed(1)} KB`;
    } else {
      fileSizeFormatted = `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  return {
    validEmails: Array.from(validSet),
    invalidRowsCount: invalidRows,
    totalRowsCount: totalDataRows,
    fileName,
    fileSizeFormatted,
  };
}

/**
 * Splits a CSV line into cells, handling quotes and multiple delimiters (, ; \t |).
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  // Detect predominant delimiter in the line
  const delimiterCounts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  let inQuoteScan = false;
  for (const ch of line) {
    if (ch === '"') inQuoteScan = !inQuoteScan;
    else if (!inQuoteScan && ch in delimiterCounts) {
      delimiterCounts[ch as keyof typeof delimiterCounts]++;
    }
  }

  let delimiter = ',';
  let maxCount = -1;
  for (const [delim, count] of Object.entries(delimiterCounts)) {
    if (count > maxCount && count > 0) {
      maxCount = count;
      delimiter = delim;
    }
  }

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
