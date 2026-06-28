CREATE TABLE "SiteSetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "siteName" TEXT NOT NULL DEFAULT 'WeAreNovelArk',
  "siteUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
  "seoTitle" TEXT NOT NULL DEFAULT 'WeAreNovelArk',
  "seoDescription" TEXT NOT NULL DEFAULT 'Read free romance, fantasy, werewolf, and contemporary novels.',
  "logoAssetId" TEXT,
  "faviconAssetId" TEXT,
  "socialImageAssetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteSetting_logoAssetId_idx" ON "SiteSetting"("logoAssetId");
CREATE INDEX "SiteSetting_faviconAssetId_idx" ON "SiteSetting"("faviconAssetId");
CREATE INDEX "SiteSetting_socialImageAssetId_idx" ON "SiteSetting"("socialImageAssetId");

ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_logoAssetId_fkey"
  FOREIGN KEY ("logoAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_faviconAssetId_fkey"
  FOREIGN KEY ("faviconAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_socialImageAssetId_fkey"
  FOREIGN KEY ("socialImageAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SiteSetting" ("id") VALUES ('default');
