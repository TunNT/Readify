import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@novelark.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "SUPER_ADMIN", isActive: true, ...(process.env.RESET_ADMIN_PASSWORD === "true" ? { passwordHash: hashPassword(adminPassword) } : {}) },
    create: { email: adminEmail, displayName: "Super Admin", role: "SUPER_ADMIN", isActive: true, passwordHash: hashPassword(adminPassword) }
  });
  if (!existingAdmin) console.log(`Seeded admin account: ${adminEmail}`);

  for (const tag of [{ slug: "alpha", name: "Alpha" }, { slug: "pack", name: "Pack" }, { slug: "billionaire", name: "Billionaire" }]) {
    await prisma.tag.upsert({ where: { slug: tag.slug }, update: { name: tag.name }, create: tag });
  }

  const sampleAds = [
    { key: "GLOBAL_HEAD", name: "Global head script", location: "HEAD" as const, scope: "GLOBAL" as const },
    { key: "NOVEL_DETAIL_TOP", name: "Novel detail top", location: "TOP" as const, scope: "PAGE_TYPE" as const, scopeValue: "NOVEL_DETAIL" },
    { key: "READER_INLINE", name: "Reader inline", location: "INLINE" as const, scope: "PAGE_TYPE" as const, scopeValue: "CHAPTER_READER", wordInterval: 50, maxInsertions: 5 }
  ];
  for (const ad of sampleAds) {
    await prisma.adPlacement.upsert({ where: { key: ad.key }, update: {}, create: { ...ad, codeType: "HTML", code: "<!-- Paste trusted ad code in Admin -->", priority: 1, isEnabled: false } });
  }

  const importedNovelCount = await prisma.novel.count({ where: { slug: { not: "phase-one-placeholder-novel" } } });
  if (importedNovelCount > 0) {
    await prisma.novel.deleteMany({ where: { slug: "phase-one-placeholder-novel" } });
    return;
  }

  const cover = await prisma.asset.upsert({
    where: { id: "seed-local-cover-placeholder" },
    update: {},
    create: {
      id: "seed-local-cover-placeholder",
      provider: "LOCAL",
      localPath: "storage/covers/placeholder.svg",
      publicUrl: "/covers/placeholder.svg",
      contentType: "image/svg+xml"
    }
  });

  const romance = await prisma.category.upsert({
    where: { slug: "romance" },
    update: {},
    create: {
      slug: "romance",
      name: "Romance",
      icon: "heart",
      sourceUrl: "https://goodluckark.com/category/romance/"
    }
  });

  const novel = await prisma.novel.upsert({
    where: { slug: "phase-one-placeholder-novel" },
    update: {},
    create: {
      slug: "phase-one-placeholder-novel",
      title: "Phase One Placeholder Novel",
      description: "Temporary seed data used until the crawler imports public source data.",
      sourceUrl: "https://goodluckark.com/",
      coverAssetId: cover.id,
      categories: {
        create: [{ categoryId: romance.id }]
      },
      chapters: {
        create: [
          {
            number: 1,
            slug: "chapter-1",
            title: "Chapter 1",
            content: "Crawler seed content will replace this placeholder in Phase 2.",
            excerpt: "Crawler seed content will replace this placeholder."
          }
        ]
      }
    }
  });

  await prisma.ranking.upsert({
    where: { listKey_position: { listKey: "popular", position: 1 } },
    update: { novelId: novel.id },
    create: {
      listKey: "popular",
      position: 1,
      novelId: novel.id,
      label: "Popular"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
