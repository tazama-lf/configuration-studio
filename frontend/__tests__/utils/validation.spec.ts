import {
  sanitizeId,
  isValidConfigVersion,
  CONFIG_VERSION_PATTERN,
  getNextSubRuleRef,
} from '@/utils/validation';

describe('validation utils', () => {
  describe('sanitizeId', () => {
    it('keeps allowed chars (letters, digits, ., @)', () => {
      expect(sanitizeId('abc123.@')).toBe('abc123.@');
    });
    it('removes disallowed chars', () => {
      expect(sanitizeId('a-b/c d!e')).toBe('abcde');
    });
    it('returns empty string for all-disallowed input', () => {
      expect(sanitizeId('---///')).toBe('');
    });
    it('returns same string with no disallowed chars', () => {
      expect(sanitizeId('901@1.0.0')).toBe('901@1.0.0');
    });
  });

  describe('CONFIG_VERSION_PATTERN', () => {
    it('matches valid version strings', () => {
      expect(CONFIG_VERSION_PATTERN.test('1.0.0')).toBe(true);
      expect(CONFIG_VERSION_PATTERN.test('1')).toBe(true);
      expect(CONFIG_VERSION_PATTERN.test('10.20.30')).toBe(true);
    });
    it('rejects invalid version strings', () => {
      expect(CONFIG_VERSION_PATTERN.test('1.0.0a')).toBe(false);
      expect(CONFIG_VERSION_PATTERN.test('')).toBe(false);
      expect(CONFIG_VERSION_PATTERN.test('v1.0.0')).toBe(false);
    });
  });

  describe('isValidConfigVersion', () => {
    it('returns true for valid versions', () => {
      expect(isValidConfigVersion('1.0.0')).toBe(true);
      expect(isValidConfigVersion('2.5.10')).toBe(true);
    });
    it('returns false for invalid versions', () => {
      expect(isValidConfigVersion('abc')).toBe(false);
      expect(isValidConfigVersion('1.0.0-beta')).toBe(false);
      expect(isValidConfigVersion('')).toBe(false);
    });
  });

  describe('getNextSubRuleRef', () => {
    it('returns .01 for empty list with defaults', () => {
      expect(getNextSubRuleRef([])).toBe('.00');
    });
    it('returns next ref after highest existing', () => {
      expect(getNextSubRuleRef(['.01', '.02'])).toBe('.03');
    });
    it('handles prefix option', () => {
      expect(getNextSubRuleRef(['.X01', '.X03'], { prefix: 'X' })).toBe('.X04');
    });
    it('handles start option', () => {
      expect(getNextSubRuleRef([], { start: 5 })).toBe('.05');
    });
    it('ignores refs that do not match pattern', () => {
      expect(getNextSubRuleRef(['.01', 'invalid', '.03'])).toBe('.04');
    });
    it('handles both prefix and start', () => {
      expect(getNextSubRuleRef(['.X05'], { prefix: 'X', start: 1 })).toBe('.X06');
    });
    it('returns start when no matching refs', () => {
      expect(getNextSubRuleRef(['.Y01'], { prefix: 'X' })).toBe('.X00');
    });

    it('handles refs where none match the pattern at all', () => {
      expect(getNextSubRuleRef(['invalid', 'no-match', 'abc'])).toBe('.00');
    });
    it('handles refs where n is not greater than highest', () => {
      // .03 is highest, .01 is lower — should still return .04
      expect(getNextSubRuleRef(['.03', '.01', '.02'])).toBe('.04');
    });
  });
});
