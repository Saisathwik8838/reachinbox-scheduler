import { describe, it, expect } from 'vitest';
import {
  parseLeadText,
  parseLeadFile,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
} from './csvParser';

describe('csvParser', () => {
  describe('formatBytes', () => {
    it('formats bytes into readable units', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(14540)).toBe('14.2 KB');
      expect(formatBytes(2097152)).toBe('2 MB');
    });
  });

  describe('parseLeadText', () => {
    it('parses standard single-column email list', () => {
      const csv = `alice@example.com\nbob@example.com\ncharlie@example.com`;
      const result = parseLeadText(csv, 'leads.txt', csv.length);

      expect(result.validCount).toBe(3);
      expect(result.invalidCount).toBe(0);
      expect(result.duplicateCount).toBe(0);
      expect(result.validEmails).toEqual([
        'alice@example.com',
        'bob@example.com',
        'charlie@example.com',
      ]);
    });

    it('skips header row when header keywords are detected', () => {
      const csv = `Full Name,Email Address,Company\nAlice,alice@example.com,Acme\nBob,bob@example.com,Beta`;
      const result = parseLeadText(csv, 'leads.csv', csv.length);

      expect(result.validCount).toBe(2);
      expect(result.validEmails).toEqual(['alice@example.com', 'bob@example.com']);
    });

    it('handles quoted fields with commas and semicolons', () => {
      const csv = `"Doe, John",john.doe@example.com;Northwind\n"Smith, Jane",jane.smith@example.com;Southwind`;
      const result = parseLeadText(csv, 'leads.csv', csv.length);

      expect(result.validCount).toBe(2);
      expect(result.validEmails).toEqual(['john.doe@example.com', 'jane.smith@example.com']);
    });

    it('strips UTF-8 BOM and normalizes Windows CRLF line endings', () => {
      const csv = `\uFEFFfirst@example.com\r\nsecond@example.com\r\nthird@example.com`;
      const result = parseLeadText(csv, 'bom_leads.csv', csv.length);

      expect(result.validCount).toBe(3);
      expect(result.validEmails).toEqual([
        'first@example.com',
        'second@example.com',
        'third@example.com',
      ]);
    });

    it('normalizes uppercase emails and de-duplicates identical emails', () => {
      const csv = `Maya.Chen@Northwind.co\nmaya.chen@northwind.co\nMAYA.CHEN@NORTHWIND.CO\nOther@example.com`;
      const result = parseLeadText(csv, 'leads.csv', csv.length);

      expect(result.validCount).toBe(2);
      expect(result.duplicateCount).toBe(2);
      expect(result.validEmails).toEqual([
        'maya.chen@northwind.co',
        'other@example.com',
      ]);
      expect(result.rejectedRows[0].reason).toBe('Duplicate email');
    });

    it('identifies and records invalid rows', () => {
      const csv = `valid@example.com\nnot-an-email\nanother@good.com\n@bad.com`;
      const result = parseLeadText(csv, 'leads.csv', csv.length);

      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(2);
      expect(result.rejectedRows.length).toBe(2);
      expect(result.rejectedRows[0].reason).toBe('Invalid email format');
      expect(result.rejectedRows[0].value).toBe('not-an-email');
    });

    it('enforces maximum 5,000 row cap', () => {
      const hugeList = Array.from({ length: 5005 }, (_, i) => `user${i}@example.com`).join('\n');
      expect(() => parseLeadText(hugeList, 'huge.csv', hugeList.length)).toThrow(
        /exceeds the 5,000 row limit/i
      );
    });
  });

  describe('parseLeadFile', () => {
    it('rejects unsupported file formats like .pdf or .xlsx', async () => {
      const file = new File(['dummy'], 'leads.xlsx', { type: 'application/vnd.ms-excel' });
      await expect(parseLeadFile(file)).rejects.toThrow(
        /only \.csv and \.txt files are supported/i
      );
    });

    it('rejects files exceeding the 2MB size cap', async () => {
      const oversizedContent = new Uint8Array(MAX_FILE_SIZE_BYTES + 100);
      const file = new File([oversizedContent], 'large.csv', { type: 'text/csv' });
      await expect(parseLeadFile(file)).rejects.toThrow(/exceeds the 2mb size limit/i);
    });

    it('successfully parses valid File object', async () => {
      const content = 'dev1@example.com\ndev2@example.com';
      const file = new File([content], 'leads.csv', { type: 'text/csv' });
      const result = await parseLeadFile(file);

      expect(result.fileName).toBe('leads.csv');
      expect(result.validCount).toBe(2);
      expect(result.validEmails).toEqual(['dev1@example.com', 'dev2@example.com']);
    });
  });
});
