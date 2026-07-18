import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IndividualWinnerDto {
  @IsString()
  public award: string;

  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public teamId?: string | null;
}

export class EnterResultDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public placement?: string[];

  @IsOptional()
  @IsObject()
  public juryRaw?: Record<string, number>;

  @IsOptional()
  @IsObject()
  public audienceRaw?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualWinnerDto)
  public individualWinners?: IndividualWinnerDto[];
}
