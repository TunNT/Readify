import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { CacheNamespace } from "./public-cache.decorator";

export type CacheResult<T> = { status: "HIT" | "MISS" | "BYPASS"; value: T };

@Injectable()
export class PublicCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(config: ConfigService) {
    this.redis = new Redis(config.get<string>("REDIS_URL", "redis://localhost:6379"), {
      connectTimeout: 1_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000)
    });
    // Cache is an optimization. Connection errors must not become unhandled
    // events or prevent the API from serving requests directly from Postgres.
    this.redis.on("error", () => undefined);
  }

  async remember<T>(namespace: CacheNamespace, key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<CacheResult<T>> {
    let cacheKey: string;
    try {
      await this.ensureConnected();
      const version = (await this.redis.get(this.versionKey(namespace))) ?? "0";
      cacheKey = `public:${namespace}:${version}:${key}`;
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) return { status: "HIT", value: JSON.parse(cached) as T };
    } catch {
      return { status: "BYPASS", value: await loader() };
    }

    const existing = this.pending.get(cacheKey) as Promise<T> | undefined;
    if (existing) return { status: "MISS", value: await existing };

    const pending = loader().then(async (value) => {
      try {
        await this.redis.set(cacheKey, JSON.stringify(value), "EX", ttlSeconds);
      } catch {
        // The database result is still valid even when Redis cannot persist it.
      }
      return value;
    }).finally(() => {
      this.pending.delete(cacheKey);
    });
    this.pending.set(cacheKey, pending);
    return { status: "MISS", value: await pending };
  }

  async invalidate(...namespaces: CacheNamespace[]) {
    if (!namespaces.length) return;
    try {
      await this.ensureConnected();
      const pipeline = this.redis.pipeline();
      new Set(namespaces).forEach((namespace) => pipeline.incr(this.versionKey(namespace)));
      await pipeline.exec();
    } catch {
      // TTL expiry remains the fallback when Redis is temporarily unavailable.
    }
  }

  async onModuleDestroy() {
    if (this.redis.status === "ready") await this.redis.quit();
    else this.redis.disconnect();
  }

  private async ensureConnected() {
    if (this.redis.status === "wait") await this.redis.connect();
    if (this.redis.status !== "ready") throw new Error("Redis is unavailable");
  }

  private versionKey(namespace: CacheNamespace) {
    return `public-cache-version:${namespace}`;
  }
}
