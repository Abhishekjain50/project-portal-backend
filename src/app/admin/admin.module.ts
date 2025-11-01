import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as dotenv from "dotenv";
import { ResponseService } from "src/common/response.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { User } from "src/entities/user.entity";
import { UserToken } from "src/entities/userToken.entity";
import { Application } from "src/entities/application.entity";
import { EmailService } from "src/services/email.service";
import { PaymentModule } from "../payment/payment.module";
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserToken, Application]),
    PaymentModule
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtService,
    ResponseService,
    EmailService
  ],
  exports: [TypeOrmModule],
})
export class AdminModule { }
