import { normalizeFullUrl, isValidFullUrl } from '@url-shortener/shared';

describe('shared url-validation (landing + API)', () => {
  it('accepts https URLs with a valid hostname', () => {
    expect(normalizeFullUrl('https://example.com/page')).toBe(
      'https://example.com/page',
    );
    expect(isValidFullUrl('https://example.com/page')).toBe(true);
  });

  it('adds https when protocol is missing', () => {
    expect(normalizeFullUrl('example.com/page')).toBe(
      'https://example.com/page',
    );
  });

  it('rejects invalid strings', () => {
    expect(normalizeFullUrl('not a url')).toBeNull();
    expect(normalizeFullUrl('example')).toBeNull();
    expect(normalizeFullUrl('ftp://example.com')).toBeNull();
    expect(normalizeFullUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeFullUrl('')).toBeNull();
  });

  it('accepts localhost and IP addresses', () => {
    expect(normalizeFullUrl('http://localhost:3000/docs')).toBe(
      'http://localhost:3000/docs',
    );
    expect(normalizeFullUrl('http://127.0.0.1/path')).toBe(
      'http://127.0.0.1/path',
    );
  });
});
