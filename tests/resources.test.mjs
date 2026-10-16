import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { driveCollections, driveEmbedUrl, driveFolderId, groupResources, validateResources } from '../assets/resources.js';

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

test('website previews require explicit public website opt-in', () => {
  const website = fixture({ kind: 'website', access: 'public', embed: true });
  assert.doesNotThrow(() => validateResources([website]));
  assert.doesNotThrow(() => validateResources([{ ...website, embed: false }]));
  assert.equal(groupResources([fixture({ kind: 'website', access: 'public' })])[0].resources[0].embed, undefined);
  for (const change of [{ embed: 'true' }, { embed: null }, { kind: 'notebooklm' }, { access: 'google-sign-in' }]) assert.throws(() => validateResources([{ ...website, ...change }]));
});

test('Drive embeds accept only canonical HTTPS Google Drive folder links', () => {
  const url = 'https://drive.google.com/drive/folders/test-folder_1?usp=sharing';
  assert.equal(driveFolderId(url), 'test-folder_1');
  assert.equal(driveEmbedUrl(url), 'https://drive.google.com/embeddedfolderview?id=test-folder_1#list');
  for (const bad of ['https://drive.google.com.evil.test/drive/folders/a', 'http://drive.google.com/drive/folders/a', 'https://user:secret@drive.google.com/drive/folders/a', 'https://drive.google.com/file/d/a/view', 'https://drive.google.com:8443/drive/folders/a', 'javascript:alert(1)']) {
    assert.equal(driveFolderId(bad), null);
    assert.throws(() => driveEmbedUrl(bad));
  }
});

test('Drive collections validate and keep the root fallback URL intact', () => {
  const folder = fixture({ kind: 'drive', url: 'https://drive.google.com/drive/folders/root-folder?usp=sharing', access: 'drive-permissions', collections: [{ id: 'year-1', title: 'Year 1', description: 'First-year materials', url: 'https://drive.google.com/drive/folders/year-1' }] });
  validateResources([folder]);
  assert.deepEqual(driveCollections(folder).map(collection => collection.id), ['all', 'year-1']);
  assert.equal(driveCollections(folder)[0].url, folder.url);
  for (const collections of [null, {}, [{ ...folder.collections[0], id: 'all' }], [folder.collections[0], folder.collections[0]], [{ ...folder.collections[0], url: 'https://example.org' }], [{ ...folder.collections[0], privateNotes: 'private' }]]) assert.throws(() => validateResources([{ ...folder, collections }]));
  assert.throws(() => validateResources([{ ...folder, kind: 'website' }]));
});
