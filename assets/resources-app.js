import { groupResources } from './resources.js';

const library = document.querySelector('#resource-library');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resourceGroup(group) {
  const section = element('section', 'resource-group');
  const heading = element('h3', 'resource-group-title', group.title);
  heading.id = `resources-${group.kind}`;
  section.setAttribute('aria-labelledby', heading.id);
  const list = element('ul', 'resource-grid');
  for (const resource of group.resources) {
    const item = element('li');
    const card = element('a', 'resource-card');
    card.id = `resource-${resource.id}`;
    card.href = resource.url;
    const cardHeading = element('h4', '', resource.title);
    cardHeading.id = `resource-title-${resource.id}`;
    card.setAttribute('aria-labelledby', cardHeading.id);
    card.setAttribute('aria-describedby', `resource-description-${resource.id} resource-access-${resource.id}`);
    const meta = element('div', 'resource-card-meta');
    meta.append(element('span', 'resource-kind', group.label), element('span', 'resource-arrow', '↗'));
    const action = element('span', 'resource-action', group.action);
    const access = element('span', 'resource-access', resource.access === 'google-sign-in' ? 'Google sign-in required' : 'Public resource');
    access.id = `resource-access-${resource.id}`;
    const description = element('p', '', resource.description);
    description.id = `resource-description-${resource.id}`;
    card.append(meta, cardHeading, description, action, access);
    item.append(card);
    list.append(item);
  }
  section.append(heading, list);
  return section;
}

async function loadResources() {
  try {
    const response = await fetch(new URL('../data/resources.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Resources unavailable');
    const groups = groupResources(await response.json());
    library.replaceChildren(...(groups.length ? groups.map(resourceGroup) : [element('p', 'resource-notice', 'No study resources have been added yet.')]));
  } catch {
    library.replaceChildren(element('p', 'resource-notice', 'The resource links could not be loaded. Please refresh the page or try again later.'));
  } finally {
    library.setAttribute('aria-busy', 'false');
  }
}

loadResources();
