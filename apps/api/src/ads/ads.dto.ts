import { IsOptional, IsString, MaxLength } from "class-validator";

export class PublicAdsQueryDto {
  @IsString() @MaxLength(500) path!: string;
  @IsString() @MaxLength(80) @IsOptional() pageType?: string;
}
