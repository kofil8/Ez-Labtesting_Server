export const extractToken = (
  authorizationHeader?: string | string[] | null,
): string | null => {
  const headerValue = Array.isArray(authorizationHeader)
    ? authorizationHeader.find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      ) ?? null
    : authorizationHeader;

  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const normalizedHeader = headerValue.trim();
  if (!normalizedHeader) {
    return null;
  }

  const [scheme, ...tokenParts] = normalizedHeader.split(/\s+/);

  if (/^bearer$/i.test(scheme)) {
    const bearerToken = tokenParts.join(' ').trim();
    return bearerToken || null;
  }

  return normalizedHeader;
};
