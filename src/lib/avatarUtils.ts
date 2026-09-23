/**
 * Extracts a 1-2 letter uppercase initials representation from a user's name or email.
 * e.g. "Aarav Sharma" -> "AS", "maya.chen@northwind.co" -> "M"
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  if (email && email.trim()) {
    const cleanEmail = email.trim();
    return cleanEmail[0].toUpperCase();
  }

  return 'U';
}
