import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEvents, groupEvents, isPublicHttps, eventTime, calendarFile } from '../assets/events.js';

// Synthetic fixtures stay in tests; they are never included in site data or builds.
const fixture = (overrides = {}) => ({ id: 'test-only', title: 'Test fixture', description: 'Synthetic test input.', start: '2030-03-10T14:00:00-04:00', end: '2030-03-10T15:00:00-04:00', timeZone: 'America/Toronto', location: 'Test location', sourceUrl: 'https://example.org/announcement', ...overrides });

test('published data validates and does not contain sample events', async () => {
  const data = JSON.parse(await readFile(new URL('../data/events.json', import.meta.url), 'utf8'));
  validateEvents(data);
  assert.ok(data.every(event => !event.sourceUrl.includes('example.org') && event.id !== 'test-only'));
});
test('empty calendar stays honestly empty', () => assert.deepEqual(groupEvents([]), { upcoming: [], past: [] }));
test('ongoing events stay upcoming until the exact end time', () => {
  const event = fixture();
  assert.equal(groupEvents([event], Date.parse(event.start)).upcoming.length, 1);
  assert.equal(groupEvents([event], Date.parse(event.end) - 1).upcoming.length, 1);
  assert.equal(groupEvents([event], Date.parse(event.end)).past.length, 1);
});
test('upcoming sorts oldest first and archive newest first', () => {
  const entries = [fixture({ id: 'later', start: '2030-03-12T14:00:00-04:00', end: '2030-03-12T15:00:00-04:00' }), fixture()];
  assert.deepEqual(groupEvents(entries, 0).upcoming.map(e => e.id), ['test-only', 'later']);
  assert.deepEqual(groupEvents(entries, Date.parse('2031-01-01')).past.map(e => e.id), ['later', 'test-only']);
});
test('cancelled events remain visible and cannot generate an invite', () => {
  const event = fixture({ status: 'cancelled' });
  assert.equal(groupEvents([event], 0).upcoming[0].status, 'cancelled');
  assert.throws(() => calendarFile(event, 'https://example.org/club/'), /Cancelled/);
});
test('malformed dates, timezone-free dates, end ordering and unknown zones fail', () => {
  for (const overrides of [{ start: '2030-02-30T14:00:00-05:00' }, { start: '2030-03-10T14:00:00' }, { end: '2030-03-10T13:00:00-04:00' }, { timeZone: 'Unknown/Nowhere' }]) assert.throws(() => validateEvents([fixture(overrides)]));
});
test('requires public source, unique safe IDs, and known fields', () => {
  assert.throws(() => validateEvents([fixture(), fixture()]));
  assert.throws(() => validateEvents([fixture({ id: '<script>' })]));
  assert.throws(() => validateEvents([fixture({ sourceUrl: '' })]));
  assert.throws(() => validateEvents([fixture({ privateNotes: 'must not be published' })]));
  assert.throws(() => validateEvents({}));
});
test('unsafe URLs and URL credentials are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'http://example.org', 'https://user:secret@example.org', 'https://example.org/\r\nINJECT']) assert.equal(isPublicHttps(url), false);
  assert.equal(isPublicHttps('https://example.org/registration?q=club'), true);
  assert.throws(() => validateEvents([fixture({ registrationUrl: 'javascript:alert(1)' })]));
});
test('date display uses event timezone and names the end date across midnight', () => {
  const label = eventTime(fixture({ start: '2030-03-10T23:00:00-04:00', end: '2030-03-11T01:00:00-04:00' }));
  assert.match(label, /March 11/);
  assert.match(label, /11:00/);
  assert.match(label, /1:00/);
});
test('calendar export preserves timezone, escapes text, and folds UTF-8 lines', () => {
  const event = fixture({ title: 'Care, evidence; questions', description: 'Line one\nEND:VEVENT\n' + 'é'.repeat(90) });
  const ics = calendarFile(event, 'https://example.org/club/#about', new Date('2030-01-01T00:00:00Z'));
  assert.match(ics, /DTSTART:20300310T180000Z/);
  assert.match(ics, /DTEND:20300310T190000Z/);
  assert.match(ics, /SUMMARY:Care\\, evidence\\; questions/);
  assert.match(ics, /URL:https:\/\/example.org\/club\/#event-test-only/);
  assert.equal(ics.split('\r\n').filter(line => line === 'END:VEVENT').length, 1);
  assert.ok(ics.split('\r\n').every(line => Buffer.byteLength(line, 'utf8') <= 75));
});
