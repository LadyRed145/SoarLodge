/** Reúne los CSS modularizados para las pruebas estáticas de regresión. */
import { readFileSync } from 'node:fs';
const order = [
  '../src/styles/tokens.css',
  '../src/styles/base.css',
  '../src/styles/responsive/compact.css',
  '../src/styles/responsive/desktop.css',
  '../src/styles/responsive/tablet.css',
  '../src/styles/responsive/mobile.css',
  '../src/styles/accessibility.css',
];
export function readStyles() {
  return order.map(file => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
}
