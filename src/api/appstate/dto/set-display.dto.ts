import { IsIn, IsOptional, IsString } from 'class-validator';
import { DisplayMode } from '../../../../shared/types';

const DISPLAY_MODES: DisplayMode[] = ['LOBBY', 'EVENT', 'LEADERBOARD', 'IDLE'];

export class SetDisplayDto {
  @IsIn(DISPLAY_MODES)
  public displayMode: DisplayMode;

  @IsOptional()
  @IsString()
  public activeEventId?: string | null;
}
