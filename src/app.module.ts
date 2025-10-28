import {
  Logger,
  MiddlewareConsumer,
  Module,
  ValidationPipe,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ResponseService } from "./common/response.service";
import { databaseConfig } from "./config/database.config";
import { MulterModule } from "@nestjs/platform-express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import { APP_PIPE } from "@nestjs/core";
import { AdminModule } from "./app/admin/admin.module";

@Module({
  controllers: [],
  providers: [
    ResponseService,
    Logger,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AdminModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
