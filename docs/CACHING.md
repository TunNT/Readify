# Public API caching

Public reader APIs use two cache layers:

1. Cloudflare edge caching, controlled by `Cloudflare-CDN-Cache-Control`.
2. Redis origin caching, which protects Postgres for requests from both Next.js
   SSR and external clients.

TTL values live in
`apps/api/src/cache/public-cache.policies.ts`. Controllers must opt in with
`@PublicCache(PUBLIC_CACHE.<policy>)`. Every route without that decorator,
including auth, admin, health, and every mutation, returns `Cache-Control:
no-store`.

## Runtime headers

- `X-Origin-Cache: MISS`: Postgres was queried and the result was stored.
- `X-Origin-Cache: HIT`: Redis served the response.
- `X-Origin-Cache: BYPASS`: the route is private/non-cacheable, or Redis was
  unavailable and the request safely fell back to Postgres.

Query parameters are sorted before building a Redis key. Parameter values are
never discarded.

## Invalidation

Admin mutations increment a namespace version in Redis. This invalidates the
namespace in O(1) without scanning or deleting keys; old versions expire by TTL.
Redis is deliberately ephemeral and may be restarted without data recovery.

## Cloudflare Cache Rules

Create the bypass rule before the public cache rule:

```text
http.request.method ne "GET"
or starts_with(http.request.uri.path, "/api/auth")
or starts_with(http.request.uri.path, "/api/admin")
or http.request.uri.path eq "/api/health"
```

Set cache eligibility to **Bypass cache**.

For the public rule, match `GET /api/*`, set cache eligibility to **Eligible
for cache**, respect the origin/Cloudflare cache-control headers, and enable
query string sorting. Do not ignore query strings for ads, catalog, or search.

Search responses intentionally return `Cloudflare-CDN-Cache-Control: no-store`
while still using a short Redis origin cache.
