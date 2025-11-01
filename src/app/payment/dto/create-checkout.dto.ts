import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MinAmountForCurrency } from "./min-amount.validator";

export class CreateCheckoutDto {
  @ApiProperty({
    name: "amount",
    example: 20,
    description: "Payment amount (minimum 2 AED for AED currency, 0.50 for USD/EUR)",
  })
  @IsNumber()
  @IsNotEmpty()
  @MinAmountForCurrency({ message: "Amount is below the minimum required for this currency" })
  amount: number;

  @ApiProperty({
    name: "currency",
    example: "aed",
    description: "Currency code (default: aed)",
    required: false,
  })
  @IsString()
  currency?: string;

  @ApiProperty({
    name: "successUrl",
    example: "https://your-website.com/success",
    description: "URL to redirect after successful payment",
    required: false,
  })
  @IsString()
  successUrl?: string;

  @ApiProperty({
    name: "cancelUrl",
    example: "https://your-website.com/cancel",
    description: "URL to redirect after cancelled payment",
    required: false,
  })
  @IsString()
  cancelUrl?: string;
}

