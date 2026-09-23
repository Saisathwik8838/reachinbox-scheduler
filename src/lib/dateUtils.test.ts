import { describe, it, expect } from 'vitest';
import {
  formatCompactDateTime,
  formatRelativeHint,
  formatFullDateTimeWithZone,
} from './dateUtils';

describe('dateUtils', () => {
  describe('formatCompactDateTime', () => {
    it('formats ISO timestamps into localized compact strings', () => {
      const iso = '2026-09-23T16:30:00.000Z';
      const result = formatCompactDateTime(iso);
      expect(result).not.toBe('—');
      expect(result).toContain('Sep 23');
    });

    it('returns dash on invalid timestamp', () => {
      expect(formatCompactDateTime('')).toBe('—');
      expect(formatCompactDateTime('invalid-date')).toBe('—');
    });
  });

  describe('formatRelativeHint', () => {
    it('returns relative minutes for events within an hour', () => {
      const base = new Date('2026-09-23T12:00:00Z');
      const target = new Date('2026-09-23T12:12:00Z').toISOString();
      expect(formatRelativeHint(target, base)).toBe('in 12 min');
    });

    it('returns relative hours for events today', () => {
      const base = new Date('2026-09-23T12:00:00Z');
      const target = new Date('2026-09-23T15:00:00Z').toISOString();
      expect(formatRelativeHint(target, base)).toBe('in 3 hrs');
    });

    it('returns null for timestamps in the past', () => {
      const base = new Date('2026-09-23T12:00:00Z');
      const target = new Date('2026-09-23T11:00:00Z').toISOString();
      expect(formatRelativeHint(target, base)).toBeNull();
    });
  });

  describe('formatFullDateTimeWithZone', () => {
    it('formats full timestamp with date and time information', () => {
      const iso = '2026-09-23T16:30:00.000Z';
      const result = formatFullDateTimeWithZone(iso);
      expect(result).toContain('September');
      expect(result).toContain('2026');
    });

    it('returns empty string for invalid dates', () => {
      expect(formatFullDateTimeWithZone('')).toBe('');
      expect(formatFullDateTimeWithZone('invalid')).toBe('');
    });
  });
});
