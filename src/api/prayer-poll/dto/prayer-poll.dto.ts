import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

import {
  PRAYER_POLL_MAX_AGE,
  PRAYER_POLL_MIN_AGE,
} from '../../../../shared/types';

export class AddAgeDto {
  @IsInt()
  @Min(PRAYER_POLL_MIN_AGE)
  @Max(PRAYER_POLL_MAX_AGE)
  public age: number;
}

export class CastAgeVoteDto extends AddAgeDto {
  @IsString()
  @MinLength(6)
  public deviceId: string;
}
