import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MinAmountForCurrency } from "./min-amount.validator";

export class CreatePaymentDto {
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
    name: "cardNumber",
    example: "4242424242424242",
    description: "Card number (16 digits)",
  })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({
    name: "expMonth",
    example: "12",
    description: "Expiration month (1-12)",
  })
  @IsString()
  @IsNotEmpty()
  expMonth: string;

  @ApiProperty({
    name: "expYear",
    example: "2025",
    description: "Expiration year (YYYY)",
  })
  @IsString()
  @IsNotEmpty()
  expYear: string;

  @ApiProperty({
    name: "cvc",
    example: "123",
    description: "Card CVC/CVV (3-4 digits)",
  })
  @IsString()
  @IsNotEmpty()
  cvc: string;

  @ApiProperty({
    name: "currency",
    example: "aed",
    description: "Currency code (default: aed)",
    required: false,
  })
  @IsString()
  currency?: string;
}

