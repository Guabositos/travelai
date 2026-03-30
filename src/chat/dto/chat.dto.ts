import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}