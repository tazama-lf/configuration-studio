// Tazama config identifiers (rule/typology/network-map IDs and id@cfg references)
// only ever contain letters, digits, '.' and '@' (e.g. "901@1.0.0").
const ID_DISALLOWED_CHARS = /[^a-zA-Z0-9.@]/g;

export function sanitizeId(value: string): string {
  return value.replace(ID_DISALLOWED_CHARS, '');
}
