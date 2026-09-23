/**
 * Date and time formatting utilities.
 * Ensures consistent local timezone display, relative time hints, and full hover tooltips.
 */

/**
 * Formats an ISO UTC timestamp into a compact string matching Figma:
 * e.g., "Sep 23, 4:30:00 PM"
 */
export function formatCompactDateTime(isoString: string): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns a human-friendly relative hint for future scheduled times:
 * e.g. "in 12 min", "in 2 hours", "tomorrow at 10:00 AM".
 * Returns null if the timestamp is in the past or more than 7 days ahead.
 */
export function formatRelativeHint(
  isoString: string,
  baseDate: Date = new Date()
): string | null {
  if (!isoString) return null;
  const target = new Date(isoString);
  if (isNaN(target.getTime())) return null;

  const diffMs = target.getTime() - baseDate.getTime();
  if (diffMs <= 0) return null; // Past or right now

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return 'in < 1 min';
  }
  if (diffMinutes < 60) {
    return `in ${diffMinutes} min`;
  }
  if (diffHours < 24) {
    return `in ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  return null;
}

/**
 * Formats a full date and time string including timezone for accessible title tooltips:
 * e.g. "Wednesday, September 23, 2026, 4:30:00 PM GMT+5:30"
 */
export function formatFullDateTimeWithZone(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
}
