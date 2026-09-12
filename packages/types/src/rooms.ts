/**
 * Partner rooms (salles). Each player account has one VPower wallet per room.
 * Goldendragon / Magiccity stay hidden until the client reopens them.
 */
export const ROOM_SLUGS = ['vblink', '100plus', 'dragonfury', 'dgames'] as const;

export type RoomSlug = (typeof ROOM_SLUGS)[number];

export const ROOM_NAMES: Record<RoomSlug, string> = {
  vblink: 'VBlink',
  '100plus': '100plus',
  dragonfury: 'Dragon Fury',
  dgames: 'DGames',
};

/** Rooms shown on the portal and in the wallet UI. */
export const VISIBLE_ROOM_SLUGS = ROOM_SLUGS;

export function isRoomSlug(value: string): value is RoomSlug {
  return (ROOM_SLUGS as readonly string[]).includes(value);
}

export function roomName(slug: string): string {
  return isRoomSlug(slug) ? ROOM_NAMES[slug] : slug;
}
