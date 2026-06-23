export type Category = {
  slug: string;
  name: string;
  icon?: string | null;
  novelCount?: number;
};

export type ChapterLink = {
  slug: string;
  number: number;
  title: string;
};

export type Novel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorName?: string | null;
  status: "ONGOING" | "COMPLETED" | "HIATUS";
  coverUrl?: string | null;
  categories: Category[];
  tags?: Array<{ slug: string; name: string }>;
  chapterCount: number;
  viewCount: number;
  rating: { average: number; count: number };
  publishedAt?: string | null;
  updatedAt?: string | null;
  firstChapter?: ChapterLink | null;
  latestChapter?: ChapterLink | null;
};

export type ChapterListItem = ChapterLink & {
  excerpt: string;
  publishedAt?: string | null;
  contentAvailable: boolean;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type HomeResponse = {
  data: {
    recommended: Novel[];
    featured: Novel[];
    hotRankings: Array<{ position: number; novel: Novel }>;
    categories: Category[];
    stats: { novelCount: number; chapterCount: number; free: boolean };
  };
};

export type NovelListResponse = { data: Novel[]; meta: PaginationMeta; category?: Category };
export type NovelResponse = { data: Novel };
export type CategoriesResponse = { data: Category[] };
export type ChaptersResponse = {
  data: ChapterListItem[];
  novel: Pick<Novel, "id" | "slug" | "title">;
  meta: PaginationMeta;
};
export type ChapterResponse = {
  data: ChapterLink & {
    content: string;
    excerpt: string;
    contentAvailable: boolean;
    novel: Pick<Novel, "id" | "slug" | "title">;
    previous?: ChapterLink | null;
    next?: ChapterLink | null;
  };
};
export type ContentPageResponse = {
  data: { slug: string; title: string; contentHtml: string; importedAt: string; updatedAt: string };
};
