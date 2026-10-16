import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { groupResources, validateResources } from '../assets/resources.js';

const fixture = (overrides = {}) => ({ id: 'test-resource', kind: 'notebooklm', title: 'Test resource', description: 'Synthetic test input.', url: 'https://example.org/resource', access: 'google-sign-in', ...overrides });

test('published resources validate and exclude example links', async () => {
  const data = JSON.parse(await readFile(new URL('../data/resources.json', import.meta.url), 'utf8'));
  validateResources(data);
  assert.ok(data.every(resource => !new URL(resource.url).hostname.endsWith('example.org')));
});
test('empty categories and empty cards are never generated', () => {
  assert.deepEqual(groupResources([]), []);
  const groups = groupResources([fixture()]);
  assert.deepEqual(groups.map(group => group.kind), ['notebooklm']);
  assert.equal(groups[0].resources.length, 1);
  assert.throws(() => validateResources([fixture({ title: '' })]));
});
test('unsafe URLs, restricted access, and unknown fields are rejected', () => {
  for (const change of [{ url: 'javascript:alert(1)' }, { url: 'https://user:secret@example.org' }, { access: 'restricted' }, { privateNotes: 'private' }, { kind: '__proto__' }]) assert.throws(() => validateResources([fixture(change)]));
});
test('resource IDs remain unique and category order is predictable', () => {
  assert.throws(() => validateResources([fixture(), fixture()]));
  assert.deepEqual(groupResources([fixture({ id: 'drive', kind: 'drive' }), fixture({ id: 'notes', kind: 'obsidian' }), fixture()]).map(group => group.kind), ['notebooklm', 'obsidian', 'drive']);
});
