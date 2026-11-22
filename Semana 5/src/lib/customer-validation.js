/** Reglas compartidas entre checkout y servidor para la simulación académica. */
export function cleanTravelerNameInput(value) {
  if (typeof value !== 'string') return '';
  // Conserva letras Unicode (incluidas ñ y vocales con tilde) y espacios.
  return value.normalize('NFC').replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ').replace(/^ +/, '').slice(0, 90);
}

export function validTravelerName(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.normalize('NFC');
  // Ni siquiera al inicio o al final aceptamos saltos de línea o tabulaciones.
  if (!/^[\p{L} ]+$/u.test(normalized)) return false;
  const name = normalized.trim();
  return name.length >= 2 && name.length <= 90 && /^\p{L}+(?: \p{L}+)*$/u.test(name);
}

/** Validación deliberadamente práctica para correos de demostración.
 * Acepta +, puntos, guiones y subdominios; descarta puntos dobles y TLD incompletos.
 */
export function validTravelerEmail(value) {
  if (typeof value !== 'string' || value.length > 150 || value !== value.trim()) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length < 1 || local.length > 64 || !/^[A-Za-z0-9._%+-]+$/.test(local) ||
      local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || !/^[A-Za-z]{2,63}$/.test(labels.at(-1))) return false;
  return labels.every(label => label.length >= 1 && label.length <= 63 &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
}
