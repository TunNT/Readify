import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PublicAdsQueryDto } from "./ads.dto";

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async publicPlacements(query: PublicAdsQueryDto) {
    const now = new Date();
    const candidates = await this.prisma.adPlacement.findMany({
      where: { isEnabled: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }]
    });
    const data = candidates.filter((ad) => {
      if (ad.scope === "GLOBAL") return true;
      if (ad.scope === "PAGE_TYPE") return Boolean(query.pageType && ad.scopeValue === query.pageType);
      if (!ad.scopeValue) return false;
      return ad.scopeValue.endsWith("*") ? query.path.startsWith(ad.scopeValue.slice(0, -1)) : query.path === ad.scopeValue;
    });
    return { data };
  }
}
