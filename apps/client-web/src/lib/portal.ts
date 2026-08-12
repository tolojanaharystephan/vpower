/**

 * Portal hub mirrored from the client reference site https://www.vpower777.com/

 * Provider images are cached under /public/portal (remote hotlink was too slow / flaky).

 */



export type PortalSocial = {

  network: 'facebook' | 'youtube' | 'instagram' | 'x';

  label: string;

  href: string;

};



export type PortalProvider = {

  slug: 'vblink' | 'goldendragon' | 'magiccity' | '100plus';

  name: string;

  taglineKey: 'vblinkTagline' | 'goldendragonTagline' | 'magiccityTagline' | 'hundredPlusTagline';

  bodyKey: 'vblinkBody' | 'goldendragonBody' | 'magiccityBody' | 'hundredPlusBody';

  imageUrl: string;

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

    imageUrl: '/portal/vblink.jpg',

    accent: '#2ea3f2',

    phones: ['7077766022', '7277882977', '8136022077', '8138933656'],

    facebook: 'https://www.facebook.com/VP1888/',

    live: true,

  },

  {

    slug: 'goldendragon',

    name: 'Goldendragon',

    taglineKey: 'goldendragonTagline',

    bodyKey: 'goldendragonBody',

    imageUrl: '/portal/goldendragon.jpg',

    accent: '#e09900',

    phones: ['7077766333', '2678888688', '5305808899', '8135396476'],

    facebook: 'https://www.facebook.com/GD16888/',

    live: true,

  },

  {

    slug: '100plus',

    name: '100plus',

    taglineKey: 'hundredPlusTagline',

    bodyKey: 'hundredPlusBody',

    imageUrl: '/portal/100plus.jpg',

    accent: '#29c4a9',

    phones: ['7077766333', '2678888688', '5305808899', '8135396476'],

    facebook: 'https://www.facebook.com/100PLUSNEW/',

    instagram: 'https://www.instagram.com/us_100plus_new/',

    live: true,

  },

  {

    slug: 'magiccity',

    name: 'Magiccity',

    taglineKey: 'magiccityTagline',

    bodyKey: 'magiccityBody',

    imageUrl: '/portal/magiccity.png',

    accent: '#8300e9',

    phones: ['7077766333', '2678888688', '5305808899', '8135396476'],

    facebook: 'https://www.facebook.com/USMagicCity777/',

    live: true,

  },

];



export function getPortalProvider(slug: string) {

  return PORTAL_PROVIDERS.find((p) => p.slug === slug);

}

