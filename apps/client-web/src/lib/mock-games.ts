export type MockGame = {
  id: string;
  slug: string;
  title: string;
  provider: string;
  tag: 'featured' | 'new' | 'popular';
  favorite?: boolean;
  accent: string;
  /** Short pitch for carousel banners (mock until Phase 6). */
  blurb: { fr: string; en: string };
};

/** Catalog shell data until Phase 6 sync. Clearly mock — not live provider data. */
export const MOCK_GAMES: MockGame[] = [
  {
    id: '1',
    slug: 'neon-reels',
    title: 'Neon Reels',
    provider: 'Studio A',
    tag: 'featured',
    favorite: true,
    accent: '#D4A017',
    blurb: {
      fr: 'Rouleaux électriques, jackpots qui claquent.',
      en: 'Electric reels, jackpots that hit hard.',
    },
  },
  {
    id: '2',
    slug: 'obsidian-spin',
    title: 'Obsidian Spin',
    provider: 'Studio B',
    tag: 'featured',
    favorite: true,
    accent: '#C45C26',
    blurb: {
      fr: 'Spin sombre, gains qui brûlent.',
      en: 'Dark spin, fiery wins.',
    },
  },
  {
    id: '3',
    slug: 'gold-circuit',
    title: 'Gold Circuit',
    provider: 'Studio A',
    tag: 'popular',
    favorite: true,
    accent: '#E8C547',
    blurb: {
      fr: 'Circuit doré pour les chasseurs de bonus.',
      en: 'Golden circuit for bonus hunters.',
    },
  },
  {
    id: '4',
    slug: 'velvet-ace',
    title: 'Velvet Ace',
    provider: 'Studio C',
    tag: 'new',
    accent: '#8B3A3A',
    blurb: {
      fr: 'Cartes velours, ambiance salon privé.',
      en: 'Velvet cards, private-room vibes.',
    },
  },
  {
    id: '5',
    slug: 'aurora-jack',
    title: 'Aurora Jack',
    provider: 'Studio B',
    tag: 'new',
    favorite: true,
    accent: '#3D7EA6',
    blurb: {
      fr: 'Aurores boréales et multiplies sauvages.',
      en: 'Northern lights and wild multipliers.',
    },
  },
  {
    id: '6',
    slug: 'ember-wheel',
    title: 'Ember Wheel',
    provider: 'Studio C',
    tag: 'popular',
    favorite: true,
    accent: '#B33B1E',
    blurb: {
      fr: 'La roue de braise tourne encore.',
      en: 'The ember wheel keeps spinning.',
    },
  },
  {
    id: '7',
    slug: 'midnight-flush',
    title: 'Midnight Flush',
    provider: 'Studio A',
    tag: 'featured',
    accent: '#5C4B8A',
    blurb: {
      fr: 'Poker de minuit, tension maximale.',
      en: 'Midnight poker, maximum tension.',
    },
  },
  {
    id: '8',
    slug: 'crystal-run',
    title: 'Crystal Run',
    provider: 'Studio B',
    tag: 'new',
    accent: '#2F6F6A',
    blurb: {
      fr: 'Course de cristaux, free spins en chaîne.',
      en: 'Crystal rush, chained free spins.',
    },
  },
];

export function gamesByTag(tag: MockGame['tag']) {
  return MOCK_GAMES.filter((g) => g.tag === tag);
}

export function favoriteGames() {
  return MOCK_GAMES.filter((g) => g.favorite);
}
