import { NovelStatus } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export const novelSortValues = ["updated", "chapters", "rating", "title"] as const;
export type NovelSort = (typeof novelSortValues)[number];

export class ListNovelsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsEnum(NovelStatus)
  status?: NovelStatus;

  @IsOptional()
  @IsIn(novelSortValues)
  sort: NovelSort = "updated";
}
