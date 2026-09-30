/**
 * Portal hub mirrored from the client reference site https://www.vpower777.com/
 * Provider images are cached under /public/portal (remote hotlink was too slow / flaky).
 * Goldendragon / Magiccity cards are hidden until the client reopens them.
 */

export type PortalSocial = {
  network: 'facebook' | 'youtube' | 'instagram' | 'x';
  label: string;
  href: string;
};

export type PortalGenreKey = 'genreCasino' | 'genreFishing' | 'genreArcade' | 'genreCatalog';
export type PortalBadgeKey = 'badgePopular' | 'badgeNew';
export type PortalHighlightKey =
  | 'vblinkFeat1'
  | 'vblinkFeat2'
  | 'vblinkFeat3'
  | 'dragonfuryFeat1'
  | 'dragonfuryFeat2'
  | 'dragonfuryFeat3'
  | 'hundredPlusFeat1'
  | 'hundredPlusFeat2'
  | 'hundredPlusFeat3'
  | 'dgamesFeat1'
  | 'dgamesFeat2'
  | 'dgamesFeat3';

export type PortalProvider = {
  slug: 'vblink' | '100plus' | 'dragonfury' | 'dgames';
  name: string;
  taglineKey:
    | 'vblinkTagline'
    | 'hundredPlusTagline'
    | 'dragonfuryTagline'
    | 'dgamesTagline';
  bodyKey: 'vblinkBody' | 'hundredPlusBody' | 'dragonfuryBody' | 'dgamesBody';
  genreKey: PortalGenreKey;
  highlightKeys: [PortalHighlightKey, PortalHighlightKey, PortalHighlightKey];
  badge?: PortalBadgeKey;
  imageUrl: string;
  /** CSS object-position values to crop distinct previews from the banner. */
  previewFocus: [string, string, string, string, string, string];
  accent: string;
  /** SMS / text lines shown on the reference contact section */
  phones: string[];
  facebook?: string;
  instagram?: string;
  live?: boolean;
};

export const PORTAL_HERO_IMAGE = '/portal/hero.jpg';

export const PORTAL_GLOBAL_SOCIALS: PortalSocial[] = [
  {
    network: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/lucky777.us',
  },
  {
    network: 'x',
    label: 'X',
    href: 'https://twitter.com/USVpower777',
  },
  {
    network: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/us_goldendragon_vpower777/',
  },
  {
    network: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCphn0XAOsV7cUqVnIGuL_rg',
  },
];

/** Featured promo video embedded on the reference homepage */
export const PORTAL_YOUTUBE_EMBED = 'https://www.youtube-nocookie.com/embed/NTu4hYtvOyI';

export const PORTAL_PROVIDERS: PortalProvider[] = [
  {
    slug: 'vblink',
    name: 'VBlink',
    taglineKey: 'vblinkTagline',
    bodyKey: 'vblinkBody',
    genreKey: 'genreCasino',
    highlightKeys: ['vblinkFeat1', 'vblinkFeat2', 'vblinkFeat3'],
    badge: 'badgePopular',
    imageUrl: '/portal/vblink.jpg',
    previewFocus: ['18% 28%', '82% 22%', '48% 72%', '62% 48%', '30% 55%', '70% 68%'],
    accent: '#2ea3f2',
    phones: ['7077766022', '7277882977', '8136022077', '8138933656'],
    facebook: 'https://www.facebook.com/VP1888/',
    live: true,
  },
  {
    slug: 'dragonfury',
    name: 'Dragon Fury',
    taglineKey: 'dragonfuryTagline',
    bodyKey: 'dragonfuryBody',
    genreKey: 'genreFishing',
    highlightKeys: ['dragonfuryFeat1', 'dragonfuryFeat2', 'dragonfuryFeat3'],
    badge: 'badgeNew',
    imageUrl: '/portal/dragonfury.jpg',
    previewFocus: ['22% 18%', '78% 30%', '40% 78%', '55% 45%', '12% 62%', '88% 58%'],
    accent: '#c45c26',
    phones: ['7077766333', '2678888688', '5305808899', '8135396476'],
    live: true,
  },
  {
    slug: '100plus',
    name: '100plus',
    taglineKey: 'hundredPlusTagline',
    bodyKey: 'hundredPlusBody',
    genreKey: 'genreArcade',
    highlightKeys: ['hundredPlusFeat1', 'hundredPlusFeat2', 'hundredPlusFeat3'],
    badge: 'badgePopular',
    imageUrl: '/portal/100plus.jpg',
    previewFocus: ['15% 40%', '85% 25%', '50% 80%', '35% 55%', '68% 18%', '20% 75%'],
    accent: '#29c4a9',
    phones: ['7077766333', '2678888688', '5305808899', '8135396476'],
    facebook: 'https://www.facebook.com/100PLUSNEW/',
    instagram: 'https://www.instagram.com/us_100plus_new/',
    live: true,
  },
  {
    slug: 'dgames',
    name: 'dgamesonline',
    taglineKey: 'dgamesTagline',
    bodyKey: 'dgamesBody',
    genreKey: 'genreCatalog',
    highlightKeys: ['dgamesFeat1', 'dgamesFeat2', 'dgamesFeat3'],
    imageUrl: '/portal/dgames.jpg',
    previewFocus: ['25% 20%', '75% 35%', '45% 75%', '60% 50%', '10% 45%', '90% 70%'],
    accent: '#7c5cff',
    phones: [],
    live: true,
  },
];

export function getPortalProvider(slug: string) {
  return PORTAL_PROVIDERS.find((p) => p.slug === slug);
}

export function roomPlayHref(slug: string): string {
  if (slug === 'vblink') return '/play/vblink';
  if (slug === '100plus') return '/play/100plus';
  if (slug === 'dragonfury') return '/play/dragonfury';
  if (slug === 'dgames') return '/play/dgames';
  return `/games?provider=${slug}`;
}
