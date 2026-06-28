import { AdCodeType, AdDevice, AdLocation, AdScope, NovelStatus, UserRole } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { ArrayUnique, IsArray, IsBoolean, IsDefined, IsEmail, IsEnum, IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class AdminListQueryDto {
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() limit = 30;
  @IsString() @IsOptional() search?: string;
  @Transform(({ value }) => value === "true") @IsBoolean() @IsOptional() includeDeleted = false;
}

export class NovelInputDto {
  @IsString() @MinLength(1) @MaxLength(240) @IsOptional() title?: string;
  @Matches(slugPattern) @MaxLength(240) @IsOptional() slug?: string;
  @IsString() @MaxLength(160) @IsOptional() authorName?: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(NovelStatus) @IsOptional() status?: NovelStatus;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsString() @IsOptional() coverAssetId?: string | null;
  @IsArray() @ArrayUnique() @IsString({ each: true }) @IsOptional() categoryIds?: string[];
  @IsArray() @ArrayUnique() @IsString({ each: true }) @IsOptional() tagIds?: string[];
}

export class ChapterInputDto {
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() number?: number;
  @Matches(slugPattern) @MaxLength(240) @IsOptional() slug?: string;
  @IsString() @MinLength(1) @MaxLength(300) @IsOptional() title?: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() excerpt?: string;
  @IsISO8601() @IsOptional() publishedAt?: string | null;
}

export class TaxonomyInputDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @Matches(slugPattern) @MaxLength(120) slug!: string;
  @IsString() @MaxLength(60) @IsOptional() icon?: string | null;
}

export class UserInputDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(120) displayName!: string;
  @IsIn([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.ADS_MANAGER]) role!: UserRole;
  @IsString() @MinLength(10) @MaxLength(200) @IsOptional() password?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class AdPlacementInputDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @Matches(/^[A-Z0-9_:-]+$/) @MaxLength(120) @IsOptional() key?: string;
  @IsEnum(AdScope) scope!: AdScope;
  @ValidateIf((value: AdPlacementInputDto) => value.scope !== AdScope.GLOBAL) @IsDefined() @IsString() @MaxLength(500) scopeValue?: string;
  @IsEnum(AdLocation) location!: AdLocation;
  @IsEnum(AdCodeType) codeType!: AdCodeType;
  @IsString() @MinLength(1) code!: string;
  @IsEnum(AdDevice) @IsOptional() device: AdDevice = AdDevice.ALL;
  @Type(() => Number) @IsInt() @Min(10) @Max(10000) @IsOptional() wordInterval?: number | null;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() maxInsertions?: number | null;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) @IsOptional() priority = 1;
  @IsBoolean() @IsOptional() isEnabled?: boolean;
  @IsISO8601() @IsOptional() startsAt?: string | null;
  @IsISO8601() @IsOptional() endsAt?: string | null;
}

export class AdStatusInputDto {
  @IsBoolean() isEnabled!: boolean;
}

export class SiteSettingInputDto {
  @IsString() @MinLength(1) @MaxLength(120) siteName!: string;
  @IsUrl({ require_tld: false, require_protocol: true }) @MaxLength(500) siteUrl!: string;
  @IsString() @MinLength(1) @MaxLength(160) seoTitle!: string;
  @IsString() @MinLength(1) @MaxLength(320) seoDescription!: string;
  @IsString() @IsOptional() logoAssetId?: string | null;
  @IsString() @IsOptional() faviconAssetId?: string | null;
  @IsString() @IsOptional() socialImageAssetId?: string | null;
}

export class ContentPageInputDto {
  @Matches(slugPattern) @MaxLength(120) slug!: string;
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() contentHtml!: string;
}

export class RankingInputDto {
  @IsString() @Matches(/^[a-z0-9_-]+$/) listKey!: string;
  @IsString() novelId!: string;
  @Type(() => Number) @IsInt() @Min(1) position!: number;
  @IsString() @MaxLength(100) @IsOptional() label?: string | null;
}
