import { validatePrefix, parseHibpRangeResponse } from './password.utils';

describe('validatePrefix', () => {
  it('returns normalized uppercase prefix', () => {
    expect(validatePrefix('abcde')).toBe('ABCDE');
  });

  it('throws for invalid prefix', () => {
    expect(() => validatePrefix('abc')).toThrow('Prefix must be a 5-character hexadecimal string');
    expect(() => validatePrefix('abcde!')).toThrow();
  });
});

describe('parseHibpRangeResponse', () => {
  it('parses suffix lines into objects', () => {
    const payload = '12345:10\nFFFFF:1';
    expect(parseHibpRangeResponse(payload)).toEqual([
      { suffix: '12345', count: 10 },
      { suffix: 'FFFFF', count: 1 },
    ]);
  });

  it('ignores malformed entries', () => {
    const payload = 'ABCDE:not-a-number\n';
    expect(parseHibpRangeResponse(payload)).toEqual([]);
  });
});
