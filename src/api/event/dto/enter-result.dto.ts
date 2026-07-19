import { IsObject, IsOptional } from 'class-validator';

export class EnterResultDto {
  @IsOptional()
  @IsObject()
  public scores?: Record<string, number>;

  @IsOptional()
  @IsObject()
  public juryRaw?: Record<string, number>;

  @IsOptional()
  @IsObject()
  public audienceRaw?: Record<string, number>;
}
