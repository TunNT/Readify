-- AlterTable
ALTER TABLE "Novel"
ADD COLUMN "sourceChapterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sourceImportedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN "sourceImportedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContentPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_originalUrl_key" ON "Asset"("originalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPage_sourceUrl_key" ON "ContentPage"("sourceUrl");
