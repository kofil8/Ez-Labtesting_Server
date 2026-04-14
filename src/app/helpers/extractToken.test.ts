import { extractToken } from './extractToken';

describe('extractToken', () => {
  it('extracts a token from a Bearer header', () => {
    expect(extractToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('extracts a token from a case-insensitive Bearer header with extra spaces', () => {
    expect(extractToken('   bearer   abc.def.ghi   ')).toBe('abc.def.ghi');
  });

  it('returns the raw token when no Bearer scheme is used', () => {
    expect(extractToken('abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('returns null for an empty Bearer token', () => {
    expect(extractToken('Bearer   ')).toBeNull();
  });

  it('reads the first non-empty value from a header array', () => {
    expect(extractToken(['', 'Bearer abc.def.ghi'])).toBe('abc.def.ghi');
  });
});
