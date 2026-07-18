import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @MinLength(6)
  public deviceId: string;

  @IsString()
  @MinLength(1)
  public targetTeamId: string;
}

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
