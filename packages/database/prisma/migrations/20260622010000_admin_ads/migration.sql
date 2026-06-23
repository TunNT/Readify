CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ADS_MANAGER');
CREATE TYPE "AdScope" AS ENUM ('GLOBAL', 'PAGE_TYPE', 'SPECIFIC_PAGE');
CREATE TYPE "AdLocation" AS ENUM ('HEAD', 'OPEN_BODY', 'CLOSE_BODY', 'TOP', 'BOTTOM', 'INLINE');
CREATE TYPE "AdCodeType" AS ENUM ('HTML', 'INLINE_JS', 'EXTERNAL_SCRIPT');
CREATE TYPE "AdDevice" AS ENUM ('ALL', 'DESKTOP', 'MOBILE');

ALTER TABLE "Novel"
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NovelTag" (
  "novelId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "NovelTag_pkey" PRIMARY KEY ("novelId", "tagId")
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdPlacement" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" "AdScope" NOT NULL DEFAULT 'GLOBAL',
  "scopeValue" TEXT,
  "location" "AdLocation" NOT NULL,
  "codeType" "AdCodeType" NOT NULL,
  "code" TEXT NOT NULL,
  "device" "AdDevice" NOT NULL DEFAULT 'ALL',
  "wordInterval" INTEGER,
  "maxInsertions" INTEGER,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE UNIQUE INDEX "AdPlacement_key_key" ON "AdPlacement"("key");
CREATE INDEX "Novel_isPublished_deletedAt_idx" ON "Novel"("isPublished", "deletedAt");
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AdPlacement_scope_scopeValue_idx" ON "AdPlacement"("scope", "scopeValue");
CREATE INDEX "AdPlacement_location_isEnabled_idx" ON "AdPlacement"("location", "isEnabled");

ALTER TABLE "NovelTag" ADD CONSTRAINT "NovelTag_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NovelTag" ADD CONSTRAINT "NovelTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
