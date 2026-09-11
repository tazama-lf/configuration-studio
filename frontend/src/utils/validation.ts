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
