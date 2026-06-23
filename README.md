# WeAreNovelArk Clone

Full-stack reading site scaffold for a WeAreNovelArk-style web experience.

## Stack

- Frontend: Next.js, React, TypeScript
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Runtime/deploy: Docker Compose
- Assets: local `storage/covers` now, S3-ready via the `Asset` table later

## Local Setup

Copy the environment template:

```bash
cp .env.example .env
```

If port `5432` is already occupied, change both `POSTGRES_PORT` and the port in `DATABASE_URL`. This workspace currently uses `55432` locally.

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL only:

```bash
docker compose up -d db
```

Generate Prisma client:

```bash
pnpm db:generate
```

Create/apply local migrations:

```bash
pnpm db:migrate
```

Seed database:

```bash
pnpm db:seed
```

Import the complete public catalog, novel metadata, chapter index, static pages,
and local cover files from the authorized source:

```bash
pnpm db:seed:source
```

Import chapter bodies as well. This is resumable and skips chapter content that
is already present, so it can be run again after an interruption:

```bash
pnpm db:seed:source:full
```

For a small validation run, pass crawler options directly:

```bash
pnpm --filter @wearenovelark/database db:seed:source -- --limit=2
pnpm --filter @wearenovelark/database db:seed:source:full -- --novel=bracelet-of-lies --chapter-limit=5
```

Run both apps locally:

```bash
pnpm dev
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:4000/api/health`

## Backend API

All responses use JSON. Paginated endpoints return `data` and `meta`; `meta`
contains `page`, `limit`, `total`, `totalPages`, `hasPreviousPage`, and
`hasNextPage`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/home` | Recommended, featured, hot ranking, categories, and site stats |
| `GET` | `/api/novels` | Novel list with pagination, search, category, status, and sorting |
| `GET` | `/api/novels/:slug` | Novel detail plus first/latest chapter |
| `GET` | `/api/novels/:slug/chapters` | Paginated chapter index with ascending/descending order |
| `GET` | `/api/novels/:slug/chapters/:chapterSlug` | Reader content with previous/next chapter |
| `GET` | `/api/categories` | Categories and novel counts |
| `GET` | `/api/categories/:slug` | Paginated novels in a category |
| `GET` | `/api/rankings` | `recommended`, `featured`, `hot`, or complete `catalog` ranking |
| `GET` | `/api/search?q=...` | Full-text-style title, author, and description search |
| `GET` | `/api/pages/:slug` | Imported static pages such as about, FAQ, privacy, and terms |
| `GET` | `/api/ads?path=...&pageType=...` | Active ad placements matched to the current route |

Novel list query example:

```bash
curl 'http://localhost:4000/api/novels?page=1&limit=20&category=werewolf&status=COMPLETED&sort=chapters'
```

Supported novel sorting values are `updated`, `chapters`, `rating`, and
`title`. Chapter lists support `order=asc` or `order=desc`. Limits are capped at
`100` and invalid query values return HTTP `400`.

## Frontend Routes

| Route | Experience |
| --- | --- |
| `/` | Source-matched homepage with recommended, featured, categories, rankings, and stats |
| `/novels` | Complete paginated novel catalog |
| `/search?q=...` | Search results and empty states |
| `/categories` | All imported categories |
| `/category/:slug` | Paginated category listing |
| `/novels/:slug` | Novel detail, metadata, library action, and chapter catalog |
| `/novels/:slug/:chapterSlug` | Reader with chapter drawer, theme, font size, and previous/next navigation |
| `/library` | Saved stories and reading history, synchronized for signed-in readers |
| `/admin/login` | Secure administrator sign-in |
| `/admin` | Catalog, taxonomy, user, ranking, page, and ad management |
| `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/help`, `/feedback`, `/report` | Imported static content pages |

Guests keep Library and Reading History in browser `localStorage`. Readers can
register or sign in from the public header; the first successful login merges
local entries into PostgreSQL by story slug and returns the combined result to
the browser. Later saves, visits, and clears update both local state and the
reader account. Reader theme and font size remain device-local preferences.

Reader accounts always receive the `READER` role and use a separate
`HttpOnly`, `SameSite=Strict` cookie from Admin sessions. A reader cannot sign
in at `/admin/login`. Public self-registration never creates an administrative
role; `SUPER_ADMIN` continues to create Admin accounts from **Users**.

Reader endpoints:

```text
POST /api/auth/register       POST /api/auth/login
POST /api/auth/logout         GET  /api/auth/me
POST /api/auth/sync           GET  /api/auth/collections
POST /api/auth/library/:slug  DELETE /api/auth/library/:slug
POST /api/auth/history/:slug  DELETE /api/auth/collections/{library|history}
```

Next.js server rendering uses `INTERNAL_API_URL`. Browser requests for `/api`
and `/covers` use same-origin Next.js rewrites, avoiding Docker-only hostnames in
the browser. Local `.env` points both URLs to `http://localhost:4000`; Docker
uses `http://api:4000` internally.

## Administration

Apply migrations and seed before the first admin login:

```bash
pnpm db:deploy
pnpm db:seed
```

Open `http://localhost:3000/admin/login`. Development seed defaults:

```text
Email: admin@novelark.local
Password: ChangeMe123!
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before production. Seed does not replace
an existing password unless explicitly requested:

```bash
set -a && . ./.env && set +a
RESET_ADMIN_PASSWORD=true ADMIN_PASSWORD='a-new-strong-password' pnpm --filter @wearenovelark/database db:seed
```

Authentication uses an opaque random token. Only its SHA-256 hash is stored in
`AdminSession`; the token is sent in an `HttpOnly`, `SameSite=Strict` cookie.
Set `ADMIN_COOKIE_SECURE=true` only after HTTPS is active.
`ADMIN_SESSION_DAYS` controls session lifetime.
`READER_SESSION_DAYS` controls public reader sessions and defaults to 30 days.
Set `READER_COOKIE_SECURE=true` after HTTPS is active in production.

| Role | Access |
| --- | --- |
| `SUPER_ADMIN` | All content, users, and trusted HTML/JavaScript ad code |
| `ADMIN` | Content CRUD and destructive content actions |
| `EDITOR` | Create and edit content without user/ad administration |
| `ADS_MANAGER` | Read ad configuration; raw code remains `SUPER_ADMIN` only |

Admin features include story publishing and soft delete, nested chapter CRUD,
cover upload, separate Category and Tag CRUD, users,
roles, account disabling, sessions, and audit logs. Cover uploads must be images
under 5 MB and are registered in `Asset`, preserving the future S3 migration path.
`ContentPage` and `Ranking` data and protected APIs are retained for
maintenance, but both modules are intentionally hidden from Admin navigation.

### Advertising Placements

Customer-facing Vietnamese documentation:

- [Hướng dẫn cấu hình và kiểm tra quảng cáo](docs/HUONG-DAN-QUANG-CAO.md)

#### Quick Start for the First Customer

1. Sign in at `http://localhost:3000/admin/login` and open **Ad placements**.
2. Select **Add placement** and enter a recognizable placement name.
3. Choose where the ad is allowed to appear. A placement currently targets one
   page type, one story target, or one custom path. Create another placement
   when the same code must run on another page type.
4. Choose a compatible position. `INLINE` works only in chapter-reader content;
   `TOP` and `BOTTOM` are page-level regions; script hooks do not guarantee a
   visible block by themselves.
5. Paste trusted partner HTML/JavaScript, leave **Enabled** off, and save.
6. Test with visible dummy HTML on desktop and mobile. Clear start/end dates
   unless the placement is intentionally scheduled.
7. Enable the placement only after its path, device, schedule, and rendering
   have been verified.

Important troubleshooting order: check **Enabled**, active start/end time,
selected target, position compatibility, device, available chapter content,
browser ad blockers, and partner-domain approval. Real Google inventory may not
serve on `localhost`; dummy HTML is the reliable local layout test.

Ads are disabled by default. Seed creates safe placeholders named
`GLOBAL_HEAD`, `NOVEL_DETAIL_TOP`, and `READER_INLINE`.

The Admin form generates each technical ad `key` automatically and keeps it
stable during edits. Operators choose friendly targets instead of entering
scope codes: entire website, a page type, one story detail page, every chapter
of a selected story, or an advanced custom URL path.

- Locations: `HEAD`, `OPEN_BODY`, `CLOSE_BODY`, `TOP`, `BOTTOM`, and `INLINE`.
- `GLOBAL` scope matches every public route.
- `PAGE_TYPE` accepts `HOME`, `CATEGORY`, `NOVEL_LIST`, `NOVEL_DETAIL`,
  `CHAPTER_READER`, `SEARCH`, or `CONTENT_PAGE`.
- `SPECIFIC_PAGE` accepts an exact path or a trailing wildcard, for example
  `/novels/example/*`.
- Device targeting supports `ALL`, `DESKTOP`, and `MOBILE`.
- Code types are `HTML`, `INLINE_JS`, and `EXTERNAL_SCRIPT`; external scripts
  must use HTTPS.

`wordInterval` is required for `INLINE`. The renderer counts readable words and
inserts after the nearest complete top-level paragraph, without splitting HTML.
`maxInsertions` caps ad density. Priority, enabled state, and start/end schedules
are managed per placement.

Raw ad code runs with page-level privileges. Only `SUPER_ADMIN` can mutate it.
Test partner tags while disabled, then validate desktop and mobile before enabling.

Primary protected endpoints:

```text
/api/admin/auth/*       /api/admin/dashboard     /api/admin/novels
/api/admin/chapters     /api/admin/categories    /api/admin/tags
/api/admin/assets       /api/admin/pages         /api/admin/rankings
/api/admin/ads          /api/admin/users
```

Mutations use JSON except cover upload, which uses `multipart/form-data` with
the field name `file`.

## Docker Local Run

Build and start database, API, and web:

```bash
docker compose up --build
```

Run migrations inside the API image when containers are up:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database prisma:deploy
```

Seed database:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed
```

The API container receives `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`RESET_ADMIN_PASSWORD`, `ADMIN_SESSION_DAYS`, `ADMIN_COOKIE_SECURE`,
`READER_SESSION_DAYS`, and `READER_COOKIE_SECURE` from the Compose environment.

Import source catalog and covers inside Docker:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed:source
```

Import all chapter bodies inside Docker:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed:source:full
```

Stop services:

```bash
docker compose down
```

## Asset Storage

Crawler-downloaded covers should be saved under:

```text
storage/covers
```

The database stores asset metadata in `Asset`:

- `provider`: `LOCAL` now, `S3` later
- `originalUrl`: source image URL
- `localPath`: local file path
- `storageKey`: future S3 object key
- `publicUrl`: URL used by frontend
- `contentType`, `byteSize`, `width`, `height`, `checksum`

Crawler controls are configured in `.env`:

- `SOURCE_BASE_URL`: authorized public source
- `CRAWLER_CONCURRENCY`: simultaneous requests; default `4`
- `CRAWLER_DELAY_MS`: polite delay before each request
- `CRAWLER_TIMEOUT_MS`: timeout per attempt
- `CRAWLER_RETRIES`: retry count with backoff

The source import is idempotent. Catalog entities are upserted by stable slug or
source URL, covers are reused by `originalUrl`, and full chapter import resumes
from rows whose `content` is still empty.

When S3 is added, keep the `Novel.coverAssetId` relation and update assets from `LOCAL` to `S3`.

## VPS Deployment With Docker Compose

1. Install Docker and Docker Compose on the VPS.
2. Copy the repository to the VPS.
3. Create `.env` from `.env.example` and set production values.
   Set `API_PUBLIC_URL` to the public API/reverse-proxy origin so returned cover
   URLs use the deployed hostname.
   Set a strong `ADMIN_PASSWORD`. After HTTPS works, set
   `ADMIN_COOKIE_SECURE=true` and `READER_COOKIE_SECURE=true`, then recreate the
   API container.
4. Point DNS/reverse proxy to the web service port, usually `3000`.
5. Build and start services:

```bash
docker compose up -d --build
```

6. Apply database migrations:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database prisma:deploy
```

7. Seed the initial administrator once:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed
```

8. Import or refresh the source catalog when needed:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed:source
```

9. Run the resumable full content import when the VPS should hold all chapter bodies:

```bash
docker compose run --rm api pnpm --filter @wearenovelark/database db:seed:source:full
```

10. Check health and admin login:

```bash
curl -i http://localhost:4000/api/health
curl -i http://localhost:3000/admin/login
```

11. For future releases:

```bash
git pull
docker compose up -d --build
docker compose run --rm api pnpm --filter @wearenovelark/database prisma:deploy
```

Seed should normally run only when importing or refreshing source data.
For schema releases, run `prisma:deploy` before recreating web/API services.
Back up PostgreSQL and `storage/covers` before production deployment.
