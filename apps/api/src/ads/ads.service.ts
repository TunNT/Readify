import { Injectable } from "@nestjs/common";
import type { AdPlacement } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PublicAdsQueryDto } from "./ads.dto";

function adPriorityRank(ad: { priority: number }) {
  return ad.priority > 0 ? ad.priority : Number.MAX_SAFE_INTEGER;
}

function sortByHighestPriority<T extends AdPlacement>(ads: T[]) {
  return ads.sort((left, right) => adPriorityRank(left) - adPriorityRank(right) || left.createdAt.getTime() - right.createdAt.getTime());
}

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async publicPlacements(query: PublicAdsQueryDto) {
    const now = new Date();
    const candidates = await this.prisma.adPlacement.findMany({
      where: { isEnabled: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: [{ createdAt: "asc" }]
    });
    const data = sortByHighestPriority(candidates.filter((ad) => {
      if (ad.scope === "GLOBAL") return true;
      if (ad.scope === "PAGE_TYPE") return Boolean(query.pageType && ad.scopeValue === query.pageType);
      if (!ad.scopeValue) return false;
      return ad.scopeValue.endsWith("*") ? query.path.startsWith(ad.scopeValue.slice(0, -1)) : query.path === ad.scopeValue;
    }));
    return { data };
  }
}
