import { isPublicHttps } from './events.js';

export const RESOURCE_TYPES = {
  notebooklm: { title: 'NotebookLM notebooks', label: 'NotebookLM', action: 'Open notebook' },
  obsidian: { title: 'Obsidian notes & files', label: 'Obsidian', action: 'Open files' },
  drive: { title: 'Pre-clerkship Drive', label: 'Google Drive', action: 'Open resource' }
};

export function validateResources(resources) {
  if (!Array.isArray(resources)) throw new Error('Resources must be a JSON array.');
  const fields = ['id', 'kind', 'title', 'description', 'url', 'access'];
  const ids = new Set();
  for (const resource of resources) {
    if (!resource || typeof resource !== 'object' || Array.isArray(resource)) throw new Error('Each resource must be an object.');
    if (Object.keys(resource).some(key => !fields.includes(key))) throw new Error('Only public resource fields may be included.');
    if (fields.some(key => typeof resource[key] !== 'string' || !resource[key].trim())) throw new Error('Every resource needs an ID, type, title, description, URL, and access label.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.id) || ids.has(resource.id)) throw new Error('Resource IDs must be unique lowercase slugs.');
    ids.add(resource.id);
    if (!Object.hasOwn(RESOURCE_TYPES, resource.kind)) throw new Error(`Unknown resource type: ${resource.kind}`);
    if (!isPublicHttps(resource.url)) throw new Error('Resource links must use HTTPS without embedded credentials.');
    if (!['public', 'google-sign-in'].includes(resource.access)) throw new Error('Only verified publicly shared resources may be listed.');
  }
  return resources;
}

export function groupResources(resources) {
  validateResources(resources);
  return Object.entries(RESOURCE_TYPES).map(([kind, details]) => ({ kind, ...details, resources: resources.filter(resource => resource.kind === kind) })).filter(group => group.resources.length);
}
