import {
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  public name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8)
  public icon: string; // emoji

  @IsHexColor()
  public color: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public order?: number;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  public name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  public icon?: string;

  @IsOptional()
  @IsHexColor()
  public color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public order?: number;
}
