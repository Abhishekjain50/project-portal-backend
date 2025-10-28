import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDTO {
  @ApiProperty({
    name: "username",
    example: "adminSuper",
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    name: "password",
    example: "admin@123",
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
