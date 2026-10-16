import { groupEvents, eventDate, eventTime, calendarFile } from './events.js';

const upcoming = document.querySelector('#upcoming-events');
const past = document.querySelector('#past-events-list');
const message = document.querySelector('#events-message');
const emptyUpcoming = upcoming.innerHTML;
const emptyPast = past.innerHTML;
let data = [];
let loaded = false;
let renderTimer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(label, url, className = '') {
  const node = element('a', className, label);
  node.href = url;
  return node;
}

function eventCard(event, isPast) {
  const card = element('article', 'event-card');
  card.id = `event-${event.id}`;
  card.tabIndex = -1;
  card.setAttribute('aria-labelledby', `title-${event.id}`);
  const date = element('div', 'event-date');
  date.setAttribute('aria-hidden', 'true');
  const options = { timeZone: event.timeZone };
  const start = new Date(event.start);
  date.append(element('span', '', new Intl.DateTimeFormat('en', { ...options, month: 'short' }).format(start)), element('strong', '', new Intl.DateTimeFormat('en', { ...options, day: 'numeric' }).format(start)), element('small', '', new Intl.DateTimeFormat('en', { ...options, year: 'numeric' }).format(start)));
  const body = element('div', 'event-body');
  const cancelled = event.status === 'cancelled';
  const label = cancelled ? 'Cancelled' : isPast ? 'Past event' : Date.parse(event.start) <= Date.now() ? 'Happening now' : 'Upcoming event';
  const heading = element('h3', '', event.title);
  heading.id = `title-${event.id}`;
  const time = element('time', '', `${eventDate(event)} · ${eventTime(event)}`);
  time.dateTime = event.start;
  const meta = element('p', 'event-meta');
  meta.append(time, element('br'), document.createTextNode(event.location));
  body.append(element('span', `event-status${cancelled ? ' cancelled' : ''}`, label), heading, meta, element('p', 'event-description', event.description));
  const actions = element('div', 'event-actions');
  if (event.registrationUrl && !isPast && !cancelled) actions.append(link('Register ↗', event.registrationUrl, 'button button-primary'));
  if (isPast && event.resourcesUrl) actions.append(link('Event resources ↗', event.resourcesUrl, 'button button-primary'));
  actions.append(link('Announcement ↗', event.sourceUrl));
  if (!isPast && !cancelled) {
    const calendar = element('button', '', 'Add to calendar');
    calendar.type = 'button';
    calendar.addEventListener('click', () => {
      const blob = new Blob([calendarFile(event, window.location.href)], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const download = link('', url);
      download.download = `${event.id}.ics`;
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    });
    actions.append(calendar);
  }
  const permalink = link('Link to event', `#event-${event.id}`);
  permalink.setAttribute('aria-label', `Link to ${event.title}`);
  actions.append(permalink);
  body.append(actions);
  card.append(date, body);
  return card;
}

function scrollToEvent() {
  if (!window.location.hash.startsWith('#event-')) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) { target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true }); }
  else { message.textContent = 'This event link is not in the current listings. Check the upcoming events for current announcements.'; }
}

function render() {
  const groups = groupEvents(data);
  if (groups.upcoming.length) upcoming.replaceChildren(...groups.upcoming.map(event => eventCard(event, false)));
  else upcoming.innerHTML = emptyUpcoming;
  if (groups.past.length) past.replaceChildren(...groups.past.map(event => eventCard(event, true)));
  else past.innerHTML = emptyPast;
  upcoming.setAttribute('aria-busy', 'false');
  clearTimeout(renderTimer);
  const nextChange = data.flatMap(event => [Date.parse(event.start), Date.parse(event.end)]).filter(time => time > Date.now()).sort((a, b) => a - b)[0];
  if (nextChange) renderTimer = setTimeout(() => {
    // Do not move an event while a visitor is using one of its controls.
    if (!document.activeElement?.closest('.event-card')) render();
  }, Math.min(nextChange - Date.now() + 1000, 2147483647));
}

async function loadEvents() {
  try {
    const response = await fetch(new URL('../data/events.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Event data unavailable');
    data = await response.json();
    render();
    loaded = true;
    scrollToEvent();
  } catch {
    upcoming.replaceChildren(element('p', 'events-message', 'Event listings are temporarily unavailable. Please try again later.'));
    upcoming.setAttribute('aria-busy', 'false');
    past.replaceChildren(element('p', 'muted', 'The event archive could not be loaded. Please try again later.'));
  }
}

window.addEventListener('hashchange', scrollToEvent);
document.addEventListener('visibilitychange', () => { if (loaded && !document.hidden) render(); });
loadEvents();
