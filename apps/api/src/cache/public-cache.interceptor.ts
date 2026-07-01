import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { from, lastValueFrom, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { PUBLIC_CACHE_POLICY, type PublicCachePolicy } from "./public-cache.decorator";
import { PublicCacheService } from "./public-cache.service";

type CacheRequest = { method: string; originalUrl: string };
type CacheResponse = { setHeader(name: string, value: string): void };

@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly cache: PublicCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<CacheRequest>();
    const response = context.switchToHttp().getResponse<CacheResponse>();
    const policy = this.reflector.getAllAndOverride<PublicCachePolicy>(PUBLIC_CACHE_POLICY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (request.method !== "GET" || !policy) {
      this.disableCaching(response);
      return next.handle();
    }

    this.setPublicHeaders(response, policy);
    return from(this.cache.remember(
      policy.namespace,
      canonicalCacheKey(request.originalUrl),
      policy.originTtl,
      () => lastValueFrom(next.handle())
    )).pipe(
      map(({ status, value }) => {
        response.setHeader("X-Origin-Cache", status);
        return value;
      }),
      catchError((error: unknown) => {
        this.disableCaching(response);
        return throwError(() => error);
      })
    );
  }

  private setPublicHeaders(response: CacheResponse, policy: PublicCachePolicy) {
    const stale = policy.staleWhileRevalidate ?? 300;
    response.setHeader("Cache-Control", `public, max-age=${policy.browserTtl}, stale-while-revalidate=${stale}`);
    response.setHeader(
      "Cloudflare-CDN-Cache-Control",
      policy.edgeTtl > 0
        ? `public, max-age=${policy.edgeTtl}, stale-while-revalidate=${stale}`
        : "no-store"
    );
  }

  private disableCaching(response: CacheResponse) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Cloudflare-CDN-Cache-Control", "no-store");
    response.setHeader("X-Origin-Cache", "BYPASS");
  }
}

export function canonicalCacheKey(originalUrl: string) {
  const url = new URL(originalUrl, "http://cache.local");
  url.searchParams.sort();
  return `${url.pathname}${url.search}`;
}
