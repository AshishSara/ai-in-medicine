// Pure event helpers shared by the browser and dependency-free Node tests.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
const REQUIRED = ['id', 'title', 'description', 'start', 'end', 'timeZone', 'location', 'sourceUrl'];
const OPTIONAL = ['registrationUrl', 'resourcesUrl', 'status'];

export function isPublicHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && Boolean(url.hostname) && !/[\r\n]/.test(value);
  } catch { return false; }
}

export function validateEvents(events) {
  if (!Array.isArray(events)) throw new Error('Events must be a JSON array.');
  const ids = new Set();
  for (const event of events) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Each event must be an object.');
    for (const key of Object.keys(event)) {
      if (![...REQUIRED, ...OPTIONAL].includes(key)) throw new Error(`Unknown field: ${key}. Keep only public event information.`);
    }
    for (const key of REQUIRED) {
      if (typeof event[key] !== 'string' || !event[key].trim()) throw new Error(`Missing ${key} on event ${event.id || '(no id)'}.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.id) || ids.has(event.id)) throw new Error(`Event ID must be a unique lowercase slug: ${event.id}`);
    ids.add(event.id);
    for (const key of ['start', 'end']) {
      if (!DATE_PATTERN.test(event[key]) || !Number.isFinite(Date.parse(event[key]))) throw new Error(`Invalid ${key}: include seconds and a timezone offset.`);
      // Date.parse otherwise silently accepts dates such as February 30.
      const [year, month, day] = event[key].slice(0, 10).split('-').map(Number);
      const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (month < 1 || month > 12 || day < 1 || day > maxDay) throw new Error(`Invalid calendar date in ${key}.`);
    }
    if (Date.parse(event.end) <= Date.parse(event.start)) throw new Error(`End must follow start: ${event.id}`);
    try { new Intl.DateTimeFormat('en', { timeZone: event.timeZone }); }
    catch { throw new Error(`Unknown timeZone: ${event.timeZone}`); }
    for (const key of ['sourceUrl', 'registrationUrl', 'resourcesUrl']) {
      if (event[key] !== undefined && !isPublicHttps(event[key])) throw new Error(`Invalid public HTTPS link: ${key}`);
    }
    if (event.status !== undefined && !['scheduled', 'cancelled'].includes(event.status)) throw new Error(`Invalid status: ${event.status}`);
  }
  return events;
}

export function groupEvents(events, now = Date.now()) {
  validateEvents(events);
  return {
    upcoming: events.filter(event => Date.parse(event.end) > now).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)),
    past: events.filter(event => Date.parse(event.end) <= now).sort((a, b) => Date.parse(b.start) - Date.parse(a.start))
  };
}

export function eventDate(event) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(event.start));
}

export function eventTime(event) {
  const options = { timeZone: event.timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
  const start = new Intl.DateTimeFormat('en-CA', options).format(startDate);
  const end = new Intl.DateTimeFormat('en-CA', options).format(endDate);
  return day.format(startDate) === day.format(endDate) ? `${start} – ${end}` : `${start} – ${eventDate({ ...event, start: event.end })}, ${end}`;
}

function escapeICS(value) { return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r/g, '\\n'); }
function foldICS(line) {
  let folded = '', length = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (length + size > 75) { folded += '\r\n '; length = 1; }
    folded += char;
    length += size;
  }
  return folded;
}
function utcDate(value) { return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }

export function calendarFile(event, pageUrl, now = new Date()) {
  validateEvents([event]);
  if (event.status === 'cancelled') throw new Error('Cancelled events cannot be added to a calendar.');
  const url = new URL(pageUrl);
  url.hash = `event-${event.id}`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI in Medicine//Club Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${escapeICS(event.id)}@${url.hostname}${url.pathname.replace(/\//g, '-')}`, `DTSTAMP:${utcDate(now)}`, `DTSTART:${utcDate(event.start)}`, `DTEND:${utcDate(event.end)}`, `SUMMARY:${escapeICS(event.title)}`, `DESCRIPTION:${escapeICS(`${event.description}\n\nDetails: ${url.href}`)}`, `LOCATION:${escapeICS(event.location)}`, `URL:${url.href}`, 'END:VEVENT', 'END:VCALENDAR'];
  return lines.map(foldICS).join('\r\n') + '\r\n';
}
