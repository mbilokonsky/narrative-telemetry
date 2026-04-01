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

  // Dubliners (auto-generated formalist readings)
  {
    slug: 'the-sisters',
    title: 'The Sisters',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/the-sisters-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'an-encounter',
    title: 'An Encounter',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/an-encounter-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'araby-auto',
    title: 'Araby (auto)',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/araby-formalist.json',
    readings: ['Formalist Reading of Araby'],
  },
  {
    slug: 'eveline',
    title: 'Eveline',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/eveline-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'after-the-race',
    title: 'After the Race',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/after-the-race-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'two-gallants',
    title: 'Two Gallants',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/two-gallants-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Technique'],
  },
  {
    slug: 'the-boarding-house',
    title: 'The Boarding House',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/the-boarding-house-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'a-little-cloud',
    title: 'A Little Cloud',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/a-little-cloud-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'counterparts',
    title: 'Counterparts',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/counterparts-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'clay',
    title: 'Clay',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/clay-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'a-painful-case',
    title: 'A Painful Case',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/a-painful-case-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'ivy-day-in-the-committee-room',
    title: 'Ivy Day in the Committee Room',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/ivy-day-in-the-committee-room-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'a-mother',
    title: 'A Mother',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/a-mother-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Technique'],
  },
  {
    slug: 'grace',
    title: 'Grace',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/grace-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'the-dead',
    title: 'The Dead',
    author: 'James Joyce',
    collection: 'dubliners',
    dataPath: '/data/dubliners/the-dead-formalist.json',
    readings: ["Formalist Reading of 'The Dead'"],
  },

  // Mansfield stories (auto-generated formalist readings)
  {
    slug: 'at-the-bay',
    title: 'At the Bay',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/at-the-bay-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Technique'],
  },
  {
    slug: 'the-garden-party',
    title: 'The Garden Party',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-garden-party-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'miss-brill',
    title: 'Miss Brill',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/miss-brill-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'the-daughters-of-the-late-colonel',
    title: 'The Daughters of the Late Colonel',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-daughters-of-the-late-colonel-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'her-first-ball',
    title: 'Her First Ball',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/her-first-ball-formalist.json',
    readings: ["Formalist Reading: 'Her First Ball'"],
  },
  {
    slug: 'the-voyage',
    title: 'The Voyage',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-voyage-formalist.json',
    readings: ['Formalist Reading: Structure and Narrative Technique'],
  },
  {
    slug: 'the-stranger',
    title: 'The Stranger',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-stranger-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'marriage-a-la-mode',
    title: 'Marriage a la Mode',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/marriage-a-la-mode-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Technique'],
  },
  {
    slug: 'mr-and-mrs-dove',
    title: 'Mr. and Mrs. Dove',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/mr-and-mrs-dove-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'the-young-girl',
    title: 'The Young Girl',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-young-girl-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'life-of-ma-parker',
    title: 'Life of Ma Parker',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/life-of-ma-parker-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Form'],
  },
  {
    slug: 'the-singing-lesson',
    title: 'The Singing Lesson',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-singing-lesson-formalist.json',
    readings: ['Formalist Reading'],
  },
  {
    slug: 'the-ladys-maid',
    title: "The Lady's Maid",
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/the-ladys-maid-formalist.json',
    readings: ['Formalist Reading: Structure, Style, and Narrative Form'],
  },
  {
    slug: 'bank-holiday',
    title: 'Bank Holiday',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/bank-holiday-formalist.json',
    readings: ['Formalist Reading: A Carnival Day'],
  },
  {
    slug: 'an-ideal-family',
    title: 'An Ideal Family',
    author: 'Katherine Mansfield',
    collection: 'mansfield',
    dataPath: '/data/mansfield/an-ideal-family-formalist.json',
    readings: ['Formalist Reading'],
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
