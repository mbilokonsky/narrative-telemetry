import * as fs from 'fs';
import * as path from 'path';
import { StoryModel } from './types';

const DATA_DIR = path.resolve(__dirname, '..', 'data');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function storyPath(slug: string): string {
  return path.join(DATA_DIR, `${slug}.json`);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function saveStoryModel(model: StoryModel): string {
  ensureDataDir();
  const slug = slugify(model.title);
  const filePath = storyPath(slug);
  fs.writeFileSync(filePath, JSON.stringify(model, null, 2), 'utf-8');
  return filePath;
}

export function loadStoryModel(slug: string): StoryModel {
  const filePath = storyPath(slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No story model found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as StoryModel;
}

export function listStoryModels(): string[] {
  ensureDataDir();
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

export function deleteStoryModel(slug: string): void {
  const filePath = storyPath(slug);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
