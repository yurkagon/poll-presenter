import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertParticipantDto {
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  public deviceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  public name?: string;
}

export class SelectTeamDto {
  @IsString()
  @MinLength(1)
  public teamId: string;
}
