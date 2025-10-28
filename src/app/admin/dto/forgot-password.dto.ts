import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({
    name: "username",
    example: "admin@gmail.com",
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
