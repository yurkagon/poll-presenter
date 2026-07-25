import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class SetJuryDto {
  @IsString()
  @MinLength(1)
  public teamId: string;

  @IsNumber()
  @Min(0)
  @Max(12)
  public score: number;
}
