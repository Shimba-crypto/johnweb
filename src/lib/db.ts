import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile<T>(filename: string): T[] {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeFile<T>(filename: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

export function getAll<T>(filename: string): T[] {
  return readFile<T>(filename);
}

export function getById<T extends { id: string }>(filename: string, id: string): T | undefined {
  return readFile<T>(filename).find((item) => item.id === id);
}

export function create<T extends { id: string }>(filename: string, item: T): T {
  const items = readFile<T>(filename);
  items.push(item);
  writeFile(filename, items);
  return item;
}

export function update<T extends { id: string }>(filename: string, id: string, updates: Partial<T>): T | undefined {
  const items = readFile<T>(filename);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...updates };
  writeFile(filename, items);
  return items[index];
}

export function remove<T extends { id: string }>(filename: string, id: string): boolean {
  const items = readFile<T>(filename);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  writeFile(filename, items);
  return true;
}

export function query<T>(filename: string, predicate: (item: T) => boolean): T[] {
  return readFile<T>(filename).filter(predicate);
}
