import { driveCollections, driveEmbedUrl, groupResources } from './resources.js';

const library = document.querySelector('#resource-library');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resourceGroup(group) {
  const section = element('section', 'resource-group');
  section.dataset.kind = group.kind;
  const heading = element('h3', 'resource-group-title', group.title);
  heading.id = `resources-${group.kind}`;
  section.setAttribute('aria-labelledby', heading.id);
  const embedded = group.resources.filter(resource => resource.collections !== undefined);
  const linked = group.resources.filter(resource => resource.collections === undefined);
  section.append(heading);
  if (linked.length) section.append(resourceCards({ ...group, resources: linked }));
  section.append(...embedded.map(driveBrowser));
  return section;
}

function resourceCards(group) {
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
    const access = element('span', 'resource-access', resource.access === 'google-sign-in' ? 'Google sign-in required' : resource.access === 'drive-permissions' ? 'Access managed in Drive' : 'Public resource');
    access.id = `resource-access-${resource.id}`;
    const description = element('p', '', resource.description);
    description.id = `resource-description-${resource.id}`;
    if (group.kind === 'website') {
      card.classList.add('resource-card-feature');
      const copy = element('div');
      copy.append(meta, cardHeading, description);
      const tail = element('div', 'resource-card-tail');
      tail.append(action, access);
      card.append(copy, tail);
    } else card.append(meta, cardHeading, description, action, access);
    item.append(card);
    list.append(item);
  }
  return list;
}

function driveBrowser(resource) {
  const browser = element('div', 'drive-browser');
  browser.id = `resource-${resource.id}`;
  const intro = element('div', 'drive-intro');
  const title = element('h4', '', resource.title);
  intro.append(title, element('p', '', resource.description));
  const categories = element('div', 'drive-categories');
  categories.setAttribute('role', 'group');
  categories.setAttribute('aria-label', `${resource.title} categories`);
  const panel = element('div', 'drive-panel');
  panel.id = `drive-panel-${resource.id}`;
  const toolbar = element('div', 'drive-toolbar');
  const current = element('div');
  const currentTitle = element('h5');
  currentTitle.id = `drive-current-${resource.id}`;
  panel.setAttribute('aria-labelledby', currentTitle.id);
  current.append(element('span', 'resource-kind', 'Google Drive folder'), currentTitle);
  const open = element('a', 'text-link', 'Open in Drive ↗');
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  open.append(element('span', 'sr-only', ' (opens in a new tab)'));
  toolbar.append(current, open);
  const frame = element('iframe', 'drive-frame');
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer';
  const status = element('p', 'drive-status');
  status.setAttribute('role', 'status');
  const help = element('p', 'drive-help', 'Folder not loading? Use “Open in Drive” above. You may need to sign in with an account that has access.');
  const buttons = [];
  function select(collection, selected) {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
    currentTitle.textContent = collection.title;
    open.href = collection.url;
    open.setAttribute('aria-label', `Open ${collection.title} in Drive (opens in a new tab)`);
    frame.title = `${resource.title} — ${collection.title}`;
    frame.src = driveEmbedUrl(collection.url);
    status.textContent = `Showing ${collection.title}. Files and subfolders open in Google Drive.`;
  }
  const collections = driveCollections(resource);
  for (const collection of collections) {
    const button = element('button', 'drive-category');
    button.type = 'button';
    button.setAttribute('aria-controls', panel.id);
    button.append(element('span', 'drive-category-title', collection.title), element('span', 'drive-category-description', collection.description));
    button.addEventListener('click', () => select(collection, button));
    buttons.push(button);
    categories.append(button);
  }
  select(collections[0], buttons[0]);
  panel.append(toolbar, status, frame, help);
  browser.append(intro, categories, panel);
  return browser;
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
