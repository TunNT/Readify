import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class RankingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(["recommended", "featured", "hot", "catalog"])
  list: "recommended" | "featured" | "hot" | "catalog" = "hot";
}
