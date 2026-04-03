export interface StoryEntry {
  slug: string;
  title: string;
  author: string;
  collection: 'dubliners' | 'mansfield' | 'hand-coded';
  dataPath: string;
  textPath?: string;
  readings: string[];
}

export const storyCatalog: StoryEntry[] = [
  // Hand-coded Araby with formalist + postcolonial readings
  {
    slug: 'araby',
    title: 'Araby',
    author: 'James Joyce',
    collection: 'hand-coded',
    dataPath: '/data/araby.json',
    textPath: '/data/araby.txt',
    readings: ['formalist', 'postcolonial'],
  },

  // Dubliners (regenerated with dual readings)
  {
    slug: 'the-dead',
    title: 'The Dead',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/the-dead.json',
    textPath: '/data/dubliners/the-dead.txt',
    readings: ['Formalist Reading', 'Psychoanalytic Reading'],
  },
  {
    slug: 'eveline',
    title: 'Eveline',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/eveline.json',
    textPath: '/data/dubliners/eveline.txt',
    readings: ['Formalist Reading: Structure, Style, and Narrative Technique', 'Feminist Reading'],
  },
  {
    slug: 'a-painful-case',
    title: 'A Painful Case',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/a-painful-case.json',
    textPath: '/data/dubliners/a-painful-case.txt',
    readings: ['Psychoanalytic Reading', 'Marxist Reading'],
  },
  {
    slug: 'counterparts',
    title: 'Counterparts',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/counterparts.json',
    textPath: '/data/dubliners/counterparts.txt',
    readings: ['Marxist Reading', 'Psychoanalytic Reading'],
  },
  {
    slug: 'the-boarding-house',
    title: 'The Boarding House',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/the-boarding-house.json',
    textPath: '/data/dubliners/the-boarding-house.txt',
    readings: ['Formalist Reading', 'Feminist Reading'],
  },

  // Mansfield (regenerated with dual readings)
  {
    slug: 'the-garden-party',
    title: 'The Garden Party',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-garden-party.json',
    textPath: '/data/mansfield/the-garden-party.txt',
    readings: ['Formalist Reading', 'Marxist Reading'],
  },
  {
    slug: 'miss-brill',
    title: 'Miss Brill',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/miss-brill.json',
    textPath: '/data/mansfield/miss-brill.txt',
    readings: ['Formalist Reading', 'Psychoanalytic Reading'],
  },
  {
    slug: 'the-daughters-of-the-late-colonel',
    title: 'The Daughters of the Late Colonel',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-daughters-of-the-late-colonel.json',
    textPath: '/data/mansfield/the-daughters-of-the-late-colonel.txt',
    readings: ['Feminist Reading', 'Psychoanalytic Reading'],
  },
  {
    slug: 'life-of-ma-parker',
    title: 'Life of Ma Parker',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/life-of-ma-parker.json',
    textPath: '/data/mansfield/life-of-ma-parker.txt',
    readings: ['Marxist Reading', 'Phenomenological Reading'],
  },
  {
    slug: 'her-first-ball',
    title: 'Her First Ball',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/her-first-ball.json',
    textPath: '/data/mansfield/her-first-ball.txt',
    readings: ['Formalist Reading', 'Phenomenological Reading'],
  },
];

export function getStoryBySlug(slug: string): StoryEntry | undefined {
  return storyCatalog.find(s => s.slug === slug);
}

export function getStoriesByAuthor(author: string): StoryEntry[] {
  return storyCatalog.filter(s => s.author === author);
}

export function getStoriesByCollection(collection: StoryEntry['collection']): StoryEntry[] {
  return storyCatalog.filter(s => s.collection === collection);
}
