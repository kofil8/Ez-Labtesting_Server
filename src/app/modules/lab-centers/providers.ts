export type ProviderCode = 'ACCESS' | 'CPL' | 'QUEST' | 'LABCORP';

export const PROVIDER_CODES: ProviderCode[] = ['ACCESS', 'CPL', 'QUEST', 'LABCORP'];

export const PROVIDER_LABELS: Record<ProviderCode, string> = {
  ACCESS: 'Access Medical Labs',
  CPL: 'Clinical Pathology Laboratories',
  QUEST: 'Quest Diagnostics',
  LABCORP: 'Labcorp',
};

const PROVIDER_MATCHERS: Record<ProviderCode, string[]> = {
  ACCESS: ['access medical labs', 'access'],
  CPL: ['clinical pathology laboratories', 'cpl'],
  QUEST: ['quest diagnostics', 'quest'],
  LABCORP: ['labcorp', 'laboratory corporation of america'],
};

export const normalizeProviderCode = (code?: string | null): ProviderCode | null => {
  const normalized = (code || '').trim().toUpperCase();

  if (normalized.includes('ACCESS')) return 'ACCESS';
  if (normalized.includes('QUEST')) return 'QUEST';
  if (normalized.includes('LABCORP')) return 'LABCORP';
  if (normalized.includes('CPL')) return 'CPL';

  return null;
};

export const matchesProviderCode = (
  providerCode: ProviderCode,
  values: Array<string | null | undefined>,
): boolean => {
  const haystack = values
    .map((value) => (value || '').toLowerCase())
    .join(' ');

  return PROVIDER_MATCHERS[providerCode].some((matcher) => haystack.includes(matcher));
};
