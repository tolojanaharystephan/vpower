/**
 * Partner rooms (salles). Each player account has one VPower wallet per room.
 * Add a new room here (e.g. dgamesonline) — wallets are created on next access.
 */
export const ROOM_SLUGS = ['vblink', 'goldendragon', 'magiccity', '100plus'] as const;

export type RoomSlug = (typeof ROOM_SLUGS)[number];

export const ROOM_NAMES: Record<RoomSlug, string> = {
  vblink: 'VBlink',
  goldendragon: 'Goldendragon',
  magiccity: 'Magiccity',
  '100plus': '100plus',
};

export function isRoomSlug(value: string): value is RoomSlug {
  return (ROOM_SLUGS as readonly string[]).includes(value);
}

export function roomName(slug: string): string {
  return isRoomSlug(slug) ? ROOM_NAMES[slug] : slug;
}
