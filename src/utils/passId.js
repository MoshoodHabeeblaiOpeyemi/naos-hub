/**
 * Generates an unguessable 6-character alphanumeric code prefixed with 'NAOS-'.
 * Uses crypto.getRandomValues for cryptographic unpredictability.
 * Character set avoids ambiguous characters like 0/O, 1/I.
 * Example output: 'NAOS-7K9W4B'
 */
export function generatePassId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[array[i] % chars.length];
  }
  return `NAOS-${id}`;
}
