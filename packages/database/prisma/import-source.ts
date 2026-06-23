import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import pLimit from "p-limit";
import { AssetProvider, NovelStatus, PrismaClient } from "@prisma/client";

type SourceNovel = {
  author?: string;
  chapters?: number;
  cover_url?: string;
  description?: string;
  last_updated?: string;
  rating?: number;
  tags?: string[];
  title: string;
  url: string;
};

type ChapterSeed = {
  number: number;
  slug: string;
  title: string;
  sourceUrl: string;
  publishedAt?: Date;
};

const prisma = new PrismaClient();
const sourceBaseUrl = (process.env.SOURCE_BASE_URL ?? "https://goodluckark.com").replace(/\/$/, "");
const concurrency = positiveInt(process.env.CRAWLER_CONCURRENCY, 4);
const requestDelayMs = positiveInt(process.env.CRAWLER_DELAY_MS, 250);
const timeoutMs = positiveInt(process.env.CRAWLER_TIMEOUT_MS, 30_000);
const retries = positiveInt(process.env.CRAWLER_RETRIES, 3);
const limit = pLimit(concurrency);
const mode = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ?? "catalog";
const novelFilter = process.argv.find((arg) => arg.startsWith("--novel="))?.split("=")[1];
const novelLimit = positiveInt(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1], 0);
const chapterLimit = positiveInt(process.argv.find((arg) => arg.startsWith("--chapter-limit="))?.split("=")[1], 0);
const staticPageSlugs = ["about", "faq", "contact", "privacy", "terms", "help", "feedback", "report"];

function findWorkspaceRoot(start = process.cwd()) {
  let current = start;
  while (current !== path.dirname(current)) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) return current;
    current = path.dirname(current);
  }
  return start;
}

const workspaceRoot = findWorkspaceRoot();

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function absoluteUrl(value: string) {
  return new URL(value, `${sourceBaseUrl}/`).toString();
}

function slugFromNovelUrl(value: string) {
  const parts = new URL(absoluteUrl(value)).pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? "novel";
}

function dateOrUndefined(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function decodeEntities(value?: string | null) {
  if (!value) return value ?? "";
  return load(`<span>${value}</span>`, null, false).text();
}

function statusFromSource(value?: string): NovelStatus {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "completed") return NovelStatus.COMPLETED;
  if (normalized === "hiatus") return NovelStatus.HIATUS;
  return NovelStatus.ONGOING;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchResponse(url: string, attempt = 1): Promise<Response> {
  if (requestDelayMs > 0) await wait(requestDelayMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8",
        "user-agent": "WeAreNovelArk authorized data importer/1.0"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    if (attempt >= retries) throw new Error(`Failed ${url} after ${attempt} attempts: ${String(error)}`);
    await wait(500 * 2 ** (attempt - 1));
    return fetchResponse(url, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string) {
  return (await fetchResponse(url)).text();
}

function resolveCoverDirectory() {
  const configured = process.env.LOCAL_ASSET_BASE_PATH ?? "storage/covers";
  return path.isAbsolute(configured) ? configured : path.resolve(workspaceRoot, configured);
}

function resolveLocalPath(localPath: string) {
  return path.isAbsolute(localPath) ? localPath : path.resolve(workspaceRoot, localPath);
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function extensionFor(contentType: string, sourceUrl: string) {
  const sourceExtension = path.extname(decodeURIComponent(new URL(sourceUrl).pathname)).toLowerCase();
  if (/^\.(avif|gif|jpe?g|png|svg|webp)$/.test(sourceExtension)) return sourceExtension;
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("svg")) return ".svg";
  return ".jpg";
}

async function importCover(slug: string, sourcePath?: string) {
  if (!sourcePath) return undefined;
  const originalUrl = absoluteUrl(sourcePath);
  const existing = await prisma.asset.findUnique({ where: { originalUrl } });
  if (existing?.localPath && await fileExists(resolveLocalPath(existing.localPath))) return existing;

  const response = await fetchResponse(originalUrl);
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = extensionFor(contentType, originalUrl);
  const filename = `${slug}${extension}`;
  const directory = resolveCoverDirectory();
  const target = path.join(directory, filename);
  await mkdir(directory, { recursive: true });
  await writeFile(target, buffer);

  const localPath = path.posix.join("storage/covers", filename);
  const publicBase = (process.env.PUBLIC_COVER_BASE_URL ?? "/covers").replace(/\/$/, "");
  return prisma.asset.upsert({
    where: { originalUrl },
    update: {
      provider: AssetProvider.LOCAL,
      localPath,
      storageKey: `covers/${filename}`,
      publicUrl: `${publicBase}/${encodeURIComponent(filename)}`,
      contentType,
      byteSize: buffer.length,
      checksum: createHash("sha256").update(buffer).digest("hex")
    },
    create: {
      provider: AssetProvider.LOCAL,
      originalUrl,
      localPath,
      storageKey: `covers/${filename}`,
      publicUrl: `${publicBase}/${encodeURIComponent(filename)}`,
      contentType,
      byteSize: buffer.length,
      checksum: createHash("sha256").update(buffer).digest("hex")
    }
  });
}

function parseCatalog(html: string): SourceNovel[] {
  const $ = load(html);
  const raw = $("#novels-data").text().trim();
  if (!raw) throw new Error("Source homepage does not contain #novels-data");
  const parsed = JSON.parse(raw) as SourceNovel[];
  return parsed.filter((novel) => novel.title && novel.url).map((novel) => ({
    ...novel,
    title: decodeEntities(novel.title),
    author: decodeEntities(novel.author),
    description: decodeEntities(novel.description),
    tags: novel.tags?.map((tag) => decodeEntities(tag))
  }));
}

function parseHomepageRankings(html: string) {
  const $ = load(html);
  const slugsFor = (selector: string) => {
    const slugs = $(selector).map((_, node) => {
      const href = $(node).attr("href");
      return href?.includes("/novels/") ? slugFromNovelUrl(href) : null;
    }).get();
    return [...new Set(slugs)];
  };

  return {
    recommended: slugsFor(".recommended .novel-card .novel-title a"),
    featured: slugsFor(".featured .novel-card .novel-title a"),
    hot: slugsFor(".rank-list .rank-title")
  };
}

async function syncRankingList(listKey: string, slugs: string[]) {
  const novels = await prisma.novel.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true }
  });
  const novelIds = new Map(novels.map((novel) => [novel.slug, novel.id]));

  await prisma.$transaction([
    prisma.ranking.deleteMany({ where: { listKey } }),
    prisma.ranking.createMany({
      data: slugs.flatMap((slug, index) => {
        const novelId = novelIds.get(slug);
        return novelId ? [{ novelId, listKey, position: index + 1, label: listKey }] : [];
      })
    })
  ]);
}

function parseDetail(html: string, catalogNovel: SourceNovel) {
  const $ = load(html);
  let structured: Record<string, unknown> = {};
  try {
    structured = JSON.parse($("script[type='application/ld+json']").first().text()) as Record<string, unknown>;
  } catch {
    // Visible detail fields remain the fallback when structured data is malformed.
  }

  const meta = $(".meta-item").map((_, node) => $(node).text().trim()).get();
  const status = meta.find((value) => ["ongoing", "completed", "hiatus"].includes(value.toLowerCase()));
  const chapters: ChapterSeed[] = [];
  $(".chapter-link").each((index, node) => {
    const href = $(node).attr("href");
    if (!href) return;
    const slug = new URL(absoluteUrl(href)).pathname.split("/").filter(Boolean).at(-1) ?? `chapter-${index + 1}`;
    const numberMatch = slug.match(/(\d+)$/);
    chapters.push({
      number: numberMatch ? Number.parseInt(numberMatch[1], 10) : index + 1,
      slug,
      title: decodeEntities($(node).find(".chapter-title").text().trim() || `Chapter ${index + 1}`),
      sourceUrl: absoluteUrl(href),
      publishedAt: dateOrUndefined($(node).find(".chapter-date").text().trim())
    });
  });

  const author = structured.author as { name?: string } | undefined;
  return {
    title: decodeEntities(String(structured.name ?? $(".book-title").text().trim() ?? catalogNovel.title)),
    authorName: decodeEntities(author?.name ?? $(".book-author").text().replace(/^By\s+/i, "").trim() ?? catalogNovel.author),
    description: decodeEntities(String(structured.description ?? $(".description-text").text().trim() ?? catalogNovel.description ?? "")),
    coverPath: String(structured.image ?? $(".book-cover img").attr("src") ?? catalogNovel.cover_url ?? ""),
    ratingAverage: Number(structured.aggregateRating && (structured.aggregateRating as { ratingValue?: string }).ratingValue) || catalogNovel.rating || 0,
    ratingCount: Number(structured.aggregateRating && (structured.aggregateRating as { ratingCount?: string }).ratingCount) || 0,
    publishedAt: dateOrUndefined(structured.datePublished as string | undefined),
    sourceUpdatedAt: dateOrUndefined(structured.dateModified as string | undefined),
    status: statusFromSource(status),
    chapters
  };
}

async function upsertCategory(tag: string) {
  const slug = tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return prisma.category.upsert({
    where: { slug },
    update: { name: tag, sourceUrl: `${sourceBaseUrl}/category/${slug}/` },
    create: { slug, name: tag, sourceUrl: `${sourceBaseUrl}/category/${slug}/` }
  });
}

async function importNovel(catalogNovel: SourceNovel, position: number) {
  const slug = slugFromNovelUrl(catalogNovel.url);
  const sourceUrl = absoluteUrl(catalogNovel.url);
  const detail = parseDetail(await fetchText(sourceUrl), catalogNovel);
  const cover = await importCover(slug, detail.coverPath);
  const categories = await Promise.all((catalogNovel.tags ?? []).map(upsertCategory));
  const importedAt = new Date();

  const novel = await prisma.novel.upsert({
    where: { slug },
    update: {
      title: detail.title,
      description: detail.description || catalogNovel.description || "",
      authorName: detail.authorName || catalogNovel.author,
      status: detail.status,
      sourceUrl,
      coverAssetId: cover?.id,
      ratingAverage: detail.ratingAverage,
      ratingCount: detail.ratingCount,
      publishedAt: detail.publishedAt,
      sourceUpdatedAt: detail.sourceUpdatedAt ?? dateOrUndefined(catalogNovel.last_updated),
      sourceChapterCount: detail.chapters.length || catalogNovel.chapters || 0,
      sourceImportedAt: importedAt
    },
    create: {
      slug,
      title: detail.title,
      description: detail.description || catalogNovel.description || "",
      authorName: detail.authorName || catalogNovel.author,
      status: detail.status,
      sourceUrl,
      coverAssetId: cover?.id,
      ratingAverage: detail.ratingAverage,
      ratingCount: detail.ratingCount,
      publishedAt: detail.publishedAt,
      sourceUpdatedAt: detail.sourceUpdatedAt ?? dateOrUndefined(catalogNovel.last_updated),
      sourceChapterCount: detail.chapters.length || catalogNovel.chapters || 0,
      sourceImportedAt: importedAt
    }
  });

  await prisma.novelCategory.deleteMany({ where: { novelId: novel.id } });
  if (categories.length > 0) {
    await prisma.novelCategory.createMany({
      data: categories.map((category) => ({ novelId: novel.id, categoryId: category.id })),
      skipDuplicates: true
    });
  }

  for (const chapter of detail.chapters) {
    await prisma.chapter.upsert({
      where: { novelId_number: { novelId: novel.id, number: chapter.number } },
      update: {
        slug: chapter.slug,
        title: chapter.title,
        sourceUrl: chapter.sourceUrl,
        publishedAt: chapter.publishedAt
      },
      create: {
        novelId: novel.id,
        number: chapter.number,
        slug: chapter.slug,
        title: chapter.title,
        content: "",
        sourceUrl: chapter.sourceUrl,
        publishedAt: chapter.publishedAt
      }
    });
  }

  await prisma.ranking.upsert({
    where: { listKey_position: { listKey: "catalog", position } },
    update: { novelId: novel.id, label: "Catalog" },
    create: { novelId: novel.id, listKey: "catalog", position, label: "Catalog" }
  });
  console.log(`[catalog ${position}] ${slug}: ${detail.chapters.length} chapters`);
}

async function importStaticPage(slug: string) {
  const sourceUrl = `${sourceBaseUrl}/${slug}/`;
  const $ = load(await fetchText(sourceUrl));
  $("script, style, header, footer, nav").remove();
  const main = $("main").first().length ? $("main").first() : $(".container").first();
  const title = main.find("h1").first().text().trim() || $("title").text().split("|")[0].trim() || slug;
  const contentHtml = main.html()?.trim() ?? "";
  await prisma.contentPage.upsert({
    where: { slug },
    update: { title, contentHtml, sourceUrl, importedAt: new Date() },
    create: { slug, title, contentHtml, sourceUrl }
  });
  console.log(`[page] ${slug}`);
}

async function importChapterContent(chapter: { id: string; sourceUrl: string | null; title: string }) {
  if (!chapter.sourceUrl) return;
  const $ = load(await fetchText(chapter.sourceUrl));
  const contentNode = $(".content").first();
  const content = contentNode.html()?.trim() ?? "";
  if (!content) throw new Error(`No .content found at ${chapter.sourceUrl}`);
  const excerpt = contentNode.text().replace(/\s+/g, " ").trim().slice(0, 280);
  await prisma.chapter.update({
    where: { id: chapter.id },
    data: {
      title: decodeEntities($(".chapter-title").first().text().trim() || chapter.title),
      content,
      excerpt,
      sourceCreatedAt: dateOrUndefined($("meta[property='article:published_time']").attr("content")),
      sourceImportedAt: new Date()
    }
  });
  console.log(`[chapter] ${chapter.sourceUrl}`);
}

async function main() {
  if (!["catalog", "full"].includes(mode)) throw new Error("--mode must be catalog or full");
  await prisma.novel.deleteMany({ where: { slug: "phase-one-placeholder-novel" } });
  const homeHtml = await fetchText(`${sourceBaseUrl}/`);
  const homepageRankings = parseHomepageRankings(homeHtml);
  let novels = parseCatalog(homeHtml).map((novel, index) => ({ novel, sourcePosition: index + 1 }));
  if (novelFilter) novels = novels.filter(({ novel }) => slugFromNovelUrl(novel.url) === novelFilter);
  if (novelLimit > 0) novels = novels.slice(0, novelLimit);
  console.log(`Importing ${novels.length} novels from ${sourceBaseUrl} in ${mode} mode`);

  await Promise.all(novels.map(({ novel, sourcePosition }) => limit(() => importNovel(novel, sourcePosition))));
  await Promise.all(Object.entries(homepageRankings).map(([listKey, slugs]) => syncRankingList(listKey, slugs)));
  await Promise.all(staticPageSlugs.map((slug) => limit(() => importStaticPage(slug))));

  if (mode === "full") {
    const selectedSlugs = novels.map(({ novel }) => slugFromNovelUrl(novel.url));
    let chapters = await prisma.chapter.findMany({
      where: {
        content: "",
        sourceUrl: { not: null },
        ...(novelFilter || novelLimit > 0 ? { novel: { slug: { in: selectedSlugs } } } : {})
      },
      orderBy: [{ novelId: "asc" }, { number: "asc" }],
      select: { id: true, sourceUrl: true, title: true }
    });
    if (chapterLimit > 0) chapters = chapters.slice(0, chapterLimit);
    console.log(`Importing content for ${chapters.length} chapters`);
    await Promise.all(chapters.map((chapter) => limit(() => importChapterContent(chapter))));
  }

  const [novelCount, chapterCount, contentCount, assetCount, pageCount] = await Promise.all([
    prisma.novel.count(),
    prisma.chapter.count(),
    prisma.chapter.count({ where: { content: { not: "" } } }),
    prisma.asset.count(),
    prisma.contentPage.count()
  ]);
  console.log({ novelCount, chapterCount, contentCount, assetCount, pageCount });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
