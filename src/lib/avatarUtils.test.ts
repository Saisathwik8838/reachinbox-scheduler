import { describe, it, expect } from 'vitest';
import { getInitials } from './avatarUtils';

describe('avatarUtils -> getInitials', () => {
  it('extracts two uppercase initials from first and last names', () => {
    expect(getInitials('Aarav Sharma')).toBe('AS');
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('handles single names cleanly', () => {
    expect(getInitials('Aarav')).toBe('AA');
    expect(getInitials('A')).toBe('A');
  });

  it('falls back to the first letter of email if name is missing', () => {
    expect(getInitials(null, 'maya.chen@northwind.co')).toBe('M');
    expect(getInitials('', 'john.doe@example.com')).toBe('J');
  });

  it('returns default initial U if both name and email are empty', () => {
    expect(getInitials(null, null)).toBe('U');
    expect(getInitials('', '')).toBe('U');
    expect(getInitials('   ', '   ')).toBe('U');
  });
});
