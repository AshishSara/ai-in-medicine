import { isPublicHttps } from './events.js';

export const RESOURCE_TYPES = {
  website: { title: 'Study websites', label: 'Study website', action: 'Explore the website' },
  notebooklm: { title: 'NotebookLM notebooks', label: 'NotebookLM', action: 'Open notebook' },
  obsidian: { title: 'Obsidian notes & files', label: 'Obsidian', action: 'Open files' },
  drive: { title: 'Shared Drive', label: 'Google Drive', action: 'Open in Drive' }
};

export function driveFolderId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com' || url.port || url.username || url.password) return null;
    return /^\/drive\/folders\/([a-zA-Z0-9_-]+)\/?$/.exec(url.pathname)?.[1] || null;
  } catch {
    return null;
  }
}

export function driveEmbedUrl(value) {
  const id = driveFolderId(value);
  if (!id) throw new Error('Drive previews require a Google Drive folder URL.');
  return `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}#list`;
}

export function driveCollections(resource) {
  return [{ id: 'all', title: 'All resources', description: 'The full shared folder', url: resource.url }, ...(resource.collections || [])];
}

export function validateResources(resources) {
  if (!Array.isArray(resources)) throw new Error('Resources must be a JSON array.');
  const fields = ['id', 'kind', 'title', 'description', 'url', 'access'];
  const ids = new Set();
  for (const resource of resources) {
    if (!resource || typeof resource !== 'object' || Array.isArray(resource)) throw new Error('Each resource must be an object.');
    if (Object.keys(resource).some(key => ![...fields, 'collections'].includes(key))) throw new Error('Only public resource fields may be included.');
    if (fields.some(key => typeof resource[key] !== 'string' || !resource[key].trim())) throw new Error('Every resource needs an ID, type, title, description, URL, and access label.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.id) || ids.has(resource.id)) throw new Error('Resource IDs must be unique lowercase slugs.');
    ids.add(resource.id);
    if (!Object.hasOwn(RESOURCE_TYPES, resource.kind)) throw new Error(`Unknown resource type: ${resource.kind}`);
    if (!isPublicHttps(resource.url)) throw new Error('Resource links must use HTTPS without embedded credentials.');
    if (!['public', 'google-sign-in', 'drive-permissions'].includes(resource.access)) throw new Error('Resources need an accurate access label.');
    if (resource.access === 'drive-permissions' && resource.kind !== 'drive') throw new Error('Drive access labels apply only to Drive resources.');
    if (resource.collections !== undefined) {
      if (resource.kind !== 'drive' || !driveFolderId(resource.url) || !Array.isArray(resource.collections)) throw new Error('Collections require a Google Drive folder.');
      const collectionIds = new Set(['all']);
      for (const collection of resource.collections) {
        const collectionFields = ['id', 'title', 'description', 'url'];
        if (!collection || typeof collection !== 'object' || Array.isArray(collection) || Object.keys(collection).some(key => !collectionFields.includes(key)) || collectionFields.some(key => typeof collection[key] !== 'string' || !collection[key].trim())) throw new Error('Every collection needs an ID, title, description, and folder URL.');
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection.id) || collectionIds.has(collection.id)) throw new Error('Collection IDs must be unique lowercase slugs; all is reserved.');
        collectionIds.add(collection.id);
        if (!driveFolderId(collection.url)) throw new Error('Collections must point to Google Drive folders.');
      }
    }
  }
  return resources;
}

export function groupResources(resources) {
  validateResources(resources);
  return Object.entries(RESOURCE_TYPES).map(([kind, details]) => ({ kind, ...details, resources: resources.filter(resource => resource.kind === kind) })).filter(group => group.resources.length);
}
