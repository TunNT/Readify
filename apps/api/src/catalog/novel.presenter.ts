import { Prisma } from "@prisma/client";

export const novelCardSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  authorName: true,
  status: true,
  viewCount: true,
  ratingAverage: true,
  ratingCount: true,
  sourceChapterCount: true,
  publishedAt: true,
  sourceUpdatedAt: true,
  updatedAt: true,
  coverAsset: {
    select: {
      publicUrl: true,
      contentType: true,
      width: true,
      height: true
    }
  },
  categories: {
    select: {
      category: {
        select: { slug: true, name: true, icon: true }
      }
    }
  },
  tags: {
    select: {
      tag: { select: { slug: true, name: true } }
    }
  }
} satisfies Prisma.NovelSelect;

export type NovelCardRecord = Prisma.NovelGetPayload<{ select: typeof novelCardSelect }>;

export function presentNovelCard(novel: NovelCardRecord, apiPublicUrl: string) {
  const coverPath = novel.coverAsset?.publicUrl;
  return {
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    description: novel.description,
    authorName: novel.authorName,
    status: novel.status,
    coverUrl: coverPath ? `${apiPublicUrl}${coverPath}` : null,
    cover: novel.coverAsset,
    categories: novel.categories.map(({ category }) => category),
    tags: novel.tags.map(({ tag }) => tag),
    chapterCount: novel.sourceChapterCount,
    viewCount: novel.viewCount,
    rating: {
      average: Number(novel.ratingAverage),
      count: novel.ratingCount
    },
    publishedAt: novel.publishedAt,
    updatedAt: novel.sourceUpdatedAt ?? novel.updatedAt
  };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasPreviousPage: page > 1,
    hasNextPage: page * limit < total
  };
}
