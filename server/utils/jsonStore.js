import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');


if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export function readJson(filename, defaultValue = []) {
  const filePath = join(DATA_DIR, filename);
  try {
    if (!existsSync(filePath)) {
      writeJson(filename, defaultValue);
      return defaultValue;
    }
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

export function writeJson(filename, data) {
  const filePath = join(DATA_DIR, filename);
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

export function appendToJson(filename, item) {
  const data = readJson(filename, []);
  data.push(item);
  return writeJson(filename, data);
}

export function findById(filename, id) {
  const data = readJson(filename, []);
  return data.find((item) => item.id === id);
}

export function updateById(filename, id, updates) {
  const data = readJson(filename, []);
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  writeJson(filename, data);
  return data[index];
}

export function deleteById(filename, id) {
  const data = readJson(filename, []);
  const filtered = data.filter((item) => item.id !== id);
  if (filtered.length === data.length) return false;
  writeJson(filename, filtered);
  return true;
}
