import { IsNotEmpty, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDTO {
  @ApiProperty({
    name: "otp",
    example: 1234,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;

  @IsNumber()
  @IsNotEmpty()
  user_id: number;
}
