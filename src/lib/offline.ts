// Offline study: papers are saved as JSON bundles into Cache Storage ("johnweb-offline-papers")
// with a small manifest in localStorage so pages know what's saved without a network call.
const KEY = "jw-offline-papers";
const CACHE = "johnweb-offline-papers";

export interface SavedPaper {
  id: string;
  title: string;
  year: number;
  grade: string;
  subject?: string;
  savedAt: string;
}

function readManifest(): SavedPaper[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeManifest(list: SavedPaper[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isSaved(id: string): boolean {
  return readManifest().some((p) => p.id === id);
}

export function getSavedPapers(): SavedPaper[] {
  return readManifest().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function savePaper(paper: { id: string; title: string; year: number; grade: string; subject?: string }): Promise<boolean> {
  try {
    const res = await fetch(`/api/papers/${paper.id}/offline`);
    if (!res.ok) return false;
    const cache = await caches.open(CACHE);
    await cache.put(`/api/papers/${paper.id}/offline`, res);
    const list = readManifest().filter((p) => p.id !== paper.id);
    list.push({ ...paper, savedAt: new Date().toISOString() });
    writeManifest(list);
    return true;
  } catch { return false; }
}

export async function removePaper(id: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE);
    await cache.delete(`/api/papers/${paperUrl(id)}`);
  } catch {}
  writeManifest(readManifest().filter((p) => p.id !== id));
}

export async function removeAllPapers(): Promise<void> {
  try { await caches.delete(CACHE); } catch {}
  writeManifest([]);
}

const paperUrl = (id: string) => `/api/papers/${id}/offline`;
