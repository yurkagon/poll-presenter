import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EventCategory,
  EventType,
  EventWeight,
  ParticipantMode,
} from '../../../../shared/types';

const CATEGORIES: EventCategory[] = ['PUNCT', 'SPORT', 'CREATIVE', 'GENERAL'];
const TYPES: EventType[] = [
  'PLACEMENT',
  'HYBRID',
  'INDIVIDUAL',
  'SIMPLE_VOTE',
  'EURO_VOTE',
  'JURY',
];
const WEIGHTS: EventWeight[] = ['NORMAL', 'BIG', 'KEY'];
const MODES: ParticipantMode[] = ['TEAMS', 'ADHOC', 'INDIVIDUALS'];

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  public name: string;

  @IsOptional()
  @IsString()
  public dayId?: string | null;

  @IsIn(CATEGORIES)
  public category: EventCategory;

  @IsIn(TYPES)
  public type: EventType;

  @IsIn(WEIGHTS)
  public weight: EventWeight;

  @IsIn(MODES)
  public participantMode: ParticipantMode;

  @IsBoolean()
  public affectsScore: boolean;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  public name?: string;

  @IsOptional()
  @IsString()
  public dayId?: string | null;

  @IsOptional()
  @IsIn(CATEGORIES)
  public category?: EventCategory;

  @IsOptional()
  @IsIn(TYPES)
  public type?: EventType;

  @IsOptional()
  @IsIn(WEIGHTS)
  public weight?: EventWeight;

  @IsOptional()
  @IsIn(MODES)
  public participantMode?: ParticipantMode;

  @IsOptional()
  @IsBoolean()
  public affectsScore?: boolean;
}
