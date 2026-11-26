import { isProductionEnv, parseCorsOrigins } from './runtime-config';

describe('parseCorsOrigins', () => {
  it('falls back to the dev frontend origin when unset', () => {
    expect(parseCorsOrigins(undefined)).toEqual(['http://localhost:5176']);
  });

  it('allows no origins when set to an empty string (fail closed)', () => {
    expect(parseCorsOrigins('')).toEqual([]);
  });

  it('allows no origins when set to only whitespace/commas', () => {
    expect(parseCorsOrigins('  , , ')).toEqual([]);
  });

  it('parses a single configured origin', () => {
    expect(parseCorsOrigins('https://studio.example.com')).toEqual(['https://studio.example.com']);
  });

  it('trims and drops empty entries from a comma-separated list', () => {
    expect(parseCorsOrigins('https://a.example.com, https://b.example.com , ')).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('strips trailing slashes so they match the browser Origin header', () => {
    expect(parseCorsOrigins('http://app.example/')).toEqual(['http://app.example']);
    expect(parseCorsOrigins('http://app.example///')).toEqual(['http://app.example']);
    expect(parseCorsOrigins('http://a.example/, http://b.example/')).toEqual(['http://a.example', 'http://b.example']);
  });
});

describe('isProductionEnv', () => {
  it('treats "production" as production', () => {
    expect(isProductionEnv('production')).toBe(true);
  });

  it('treats the "prod" shorthand as production', () => {
    expect(isProductionEnv('prod')).toBe(true);
  });

  it('treats "development", "dev", "test" as non-production', () => {
    expect(isProductionEnv('development')).toBe(false);
    expect(isProductionEnv('dev')).toBe(false);
    expect(isProductionEnv('test')).toBe(false);
  });

  it('defaults an unset NODE_ENV to non-production', () => {
    expect(isProductionEnv(undefined)).toBe(false);
  });
});
