import { IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  public nickname: string;

  @IsString()
  @MinLength(6)
  public password: string;
}
