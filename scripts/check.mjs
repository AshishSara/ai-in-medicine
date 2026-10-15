import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateEvents } from '../assets/events.js';

const root = new URL('../', import.meta.url);
const events = validateEvents(JSON.parse(await readFile(new URL('data/events.json', root), 'utf8')));
const html = await readFile(new URL('index.html', root), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs.');
for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (url.startsWith('#') && !ids.includes(url.slice(1))) throw new Error(`Broken anchor: ${url}`);
  if (url.startsWith('./')) await access(fileURLToPath(new URL(url, root)));
  if (url.startsWith('/')) throw new Error(`Use relative paths for GitHub project Pages: ${url}`);
  if (/^(http:|javascript:|data:)/i.test(url)) throw new Error(`Unexpected URL: ${url}`);
}
if (!html.includes('<html lang="en">') || !html.includes('name="viewport"')) throw new Error('Missing language or viewport metadata.');
console.log(`Validated ${events.length} public events, local asset links, anchors, and page metadata.`);
