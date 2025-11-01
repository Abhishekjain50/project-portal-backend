import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { ResponseService } from "src/common/response.service";
import { Payment } from "src/entities/payment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, ResponseService],
  exports: [PaymentService],
})
export class PaymentModule {}

