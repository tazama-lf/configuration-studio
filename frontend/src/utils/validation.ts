// Tazama config identifiers (rule/typology/network-map IDs and id@cfg references)
// only ever contain letters, digits, '.' and '@' (e.g. "901@1.0.0").
const ID_DISALLOWED_CHARS = /[^a-zA-Z0-9.@]/g;

export function sanitizeId(value: string): string {
  return value.replace(ID_DISALLOWED_CHARS, '');
}

// Config version fields (e.g. "1.0.0") only ever contain digits and dots.
export const CONFIG_VERSION_PATTERN = /^\d+(?:\.\d+)*$/;

export function isValidConfigVersion(value: string): boolean {
  return CONFIG_VERSION_PATTERN.test(value);
}

const SUB_RULE_REF_PAD = 2;

/**
 * Computes the next auto-generated sub-rule reference (e.g. ".01", ".X02") for a
 * list of items, continuing from the highest existing numeric suffix rather than
 * the current item count — so removing an item never causes a later duplicate.
 */
export function getNextSubRuleRef(
  existingRefs: string[],
  options: { prefix?: string; start?: number } = {},
): string {
  const prefix = options.prefix ?? '';
  const start = options.start ?? 0;
  const pattern = new RegExp(`^\\.${prefix}(\\d+)$`);

  let highest = start - 1;
  for (const ref of existingRefs) {
    const match = pattern.exec(ref);
    if (match) {
      const n = Number(match[1]);
      if (n > highest) highest = n;
    }
  }

  const next = highest + 1;
  return `.${prefix}${String(next).padStart(SUB_RULE_REF_PAD, '0')}`;
}
