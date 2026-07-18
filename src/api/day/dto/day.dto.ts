import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDayDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  public label: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public order?: number;
}

export class UpdateDayDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  public label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  public order?: number;
}
