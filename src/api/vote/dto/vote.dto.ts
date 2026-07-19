import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class CastEuroVoteDto {
  @IsString()
  @MinLength(6)
  public deviceId: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  public ranking: string[];
}
