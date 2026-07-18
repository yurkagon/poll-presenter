import { IsInt, IsString, MinLength } from 'class-validator';

export class AddJuryDto {
  @IsString()
  @MinLength(1)
  public teamId: string;

  @IsInt()
  public points: number;
}
