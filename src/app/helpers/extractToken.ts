export const extractToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;

  // If Bearer token
  if (authorizationHeader.startsWith('Bearer ')) {
    const parts = authorizationHeader.split(' ');
    if (parts.length === 2) return parts[1];
    return null;
  }

  // If raw token
  return authorizationHeader;
};
