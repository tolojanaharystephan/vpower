export type GameStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type GameProvider = {
  id: string;
  name: string;
  slug: string;
  baseUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GameCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  accent: string | null;
  providerId: string;
  categoryId: string;
  status: GameStatus;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  rtp: number | null;
  volatility: string | null;
  minBet: number | null;
  maxBet: number | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type GameWithRelations = Game & {
  provider: Pick<GameProvider, 'id' | 'name' | 'slug'>;
  category: Pick<GameCategory, 'id' | 'name' | 'slug'>;
};

export type PaginatedGamesResponse = {
  data: GameWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserFavorite = {
  id: string;
  userId: string;
  gameId: string;
  createdAt: string;
};
