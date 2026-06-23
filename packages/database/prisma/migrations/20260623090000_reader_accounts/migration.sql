ALTER TYPE "UserRole" ADD VALUE 'READER';

CREATE TABLE "ReaderSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReaderSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LibraryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderSession_tokenHash_key" ON "ReaderSession"("tokenHash");
CREATE INDEX "ReaderSession_userId_idx" ON "ReaderSession"("userId");
CREATE INDEX "ReaderSession_expiresAt_idx" ON "ReaderSession"("expiresAt");
CREATE UNIQUE INDEX "LibraryItem_userId_novelId_key" ON "LibraryItem"("userId", "novelId");
CREATE INDEX "LibraryItem_userId_savedAt_idx" ON "LibraryItem"("userId", "savedAt");

ALTER TABLE "ReaderSession" ADD CONSTRAINT "ReaderSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
