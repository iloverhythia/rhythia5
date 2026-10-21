import * as fs from "fs";

const COLLECTIONS_PATH = "./cache/collections.json";

export function loadCollections(): Record<string, string[]> {
  try {
    return JSON.parse(fs.readFileSync(COLLECTIONS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function getCollectionsOf(mapId: string): string[] {
  return Object.entries(loadCollections())
    .filter(([, ids]) => ids.includes(String(mapId)))
    .map(([name]) => name);
}

export function toggleInCollection(name: string, mapId: string): boolean {
  const collections = loadCollections();
  const ids = collections[name] ?? [];
  const id = String(mapId);
  const added = !ids.includes(id);
  collections[name] = added ? [...ids, id] : ids.filter((x) => x !== id);
  if (collections[name].length === 0) delete collections[name];
  fs.mkdirSync("./cache", { recursive: true });
  fs.writeFileSync(COLLECTIONS_PATH, JSON.stringify(collections, null, 2));
  return added;
}
