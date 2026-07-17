import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  public nickname: string;

  @IsString()
  @IsNotEmpty()
  public password: string;
}
