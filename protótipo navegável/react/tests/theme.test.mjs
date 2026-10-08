import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const jsx = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

for (const token of ['--color-external-bg', '--color-app-bg', '--color-surface', '--color-text', '--color-text-secondary', '--color-border', '--color-primary', '--color-danger', '--color-success', '--color-warning', '--color-focus', '--color-overlay']) {
  assert.match(css, new RegExp(`${token}:`), `token ${token} should exist`);
}
assert.match(css, /\[data-theme=dark\]/);
assert.match(css, /prefers-color-scheme:dark/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(jsx, /role="switch"/);
assert.match(jsx, /setTheme\(dark\?'light':'dark'\)/);
assert.doesNotMatch(jsx, /localStorage/);

console.log('theme: semantic tokens, switch, system preference and in-memory policy verified');
