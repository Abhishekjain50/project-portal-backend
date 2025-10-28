import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDTO {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({
    name: "password",
    example: "1234",
  })
  @IsNotEmpty()
  @IsString()
  password: string;

}
