import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q!: string;
}
