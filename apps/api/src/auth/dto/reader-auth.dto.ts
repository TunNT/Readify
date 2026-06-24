import { Type } from "class-transformer";
import { IsArray, IsEmail, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class ReaderLoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(200) password!: string;
}

export class ReaderRegisterDto extends ReaderLoginDto {
  @IsString() @MinLength(1) @MaxLength(120) displayName!: string;
}

export class LocalNovelDto {
  @IsString() @MinLength(1) @MaxLength(240) slug!: string;
  @IsISO8601() @IsOptional() savedAt?: string;
  @IsNumber() @Min(0) @Max(100) @IsOptional() progress?: number;
}

export class ReaderHistoryDto {
  @IsNumber() @Min(0) @Max(100) @IsOptional() progress?: number;
}

export class ReaderSyncDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LocalNovelDto) library: LocalNovelDto[] = [];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LocalNovelDto) history: LocalNovelDto[] = [];
}
