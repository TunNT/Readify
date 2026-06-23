CREATE TYPE "AssetProvider" AS ENUM ('LOCAL', 'S3');
CREATE TYPE "NovelStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS');

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "provider" "AssetProvider" NOT NULL DEFAULT 'LOCAL',
  "originalUrl" TEXT,
  "localPath" TEXT,
  "storageKey" TEXT,
  "publicUrl" TEXT,
  "contentType" TEXT,
  "byteSize" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Novel" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "authorName" TEXT,
  "status" "NovelStatus" NOT NULL DEFAULT 'ONGOING',
  "sourceUrl" TEXT,
  "coverAssetId" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "ratingAverage" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "sourceCreatedAt" TIMESTAMP(3),
  "sourceUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Novel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "sourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NovelCategory" (
  "novelId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "NovelCategory_pkey" PRIMARY KEY ("novelId","categoryId")
);

CREATE TABLE "Chapter" (
  "id" TEXT NOT NULL,
  "novelId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL DEFAULT '',
  "sourceUrl" TEXT,
  "sourceCreatedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ranking" (
  "id" TEXT NOT NULL,
  "novelId" TEXT NOT NULL,
  "listKey" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadingHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "novelId" TEXT NOT NULL,
  "chapterId" TEXT,
  "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Novel_slug_key" ON "Novel"("slug");
CREATE UNIQUE INDEX "Novel_sourceUrl_key" ON "Novel"("sourceUrl");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Chapter_sourceUrl_key" ON "Chapter"("sourceUrl");
CREATE UNIQUE INDEX "Chapter_novelId_number_key" ON "Chapter"("novelId", "number");
CREATE UNIQUE INDEX "Chapter_novelId_slug_key" ON "Chapter"("novelId", "slug");
CREATE UNIQUE INDEX "Ranking_listKey_position_key" ON "Ranking"("listKey", "position");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE INDEX "Asset_provider_idx" ON "Asset"("provider");
CREATE INDEX "Novel_title_idx" ON "Novel"("title");
CREATE INDEX "Novel_status_idx" ON "Novel"("status");
CREATE INDEX "Chapter_publishedAt_idx" ON "Chapter"("publishedAt");
CREATE INDEX "Ranking_listKey_idx" ON "Ranking"("listKey");
CREATE INDEX "ReadingHistory_userId_idx" ON "ReadingHistory"("userId");
CREATE INDEX "ReadingHistory_sessionId_idx" ON "ReadingHistory"("sessionId");

ALTER TABLE "Novel" ADD CONSTRAINT "Novel_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NovelCategory" ADD CONSTRAINT "NovelCategory_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NovelCategory" ADD CONSTRAINT "NovelCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
