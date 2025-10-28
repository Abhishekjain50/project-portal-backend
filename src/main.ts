import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { Req, Res, ValidationPipe } from "@nestjs/common";
import { json } from "body-parser";
import * as fs from 'fs';
import * as express from "express";
import { Request, Response } from 'express';
import * as compression from "compression";

import {
  ExpressAdapter,
  NestExpressApplication,
} from "@nestjs/platform-express";
import * as path from "path";

async function bootstrap() {
  const server = express();
  server.use(compression());
  // const app = await NestFactory.create<NestExpressApplication>(
  //   AppModule,
  //   new ExpressAdapter(server)
  // );
  const ssl = process.env.SSL === 'false' ? true : false;
  let httpsOptions = null;
  if (ssl) {
    const keyPath = process.env.SSL_KEY_PATH || '';
    const certPath = process.env.SSL_CERT_PATH || '';
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, keyPath)),
      cert: fs.readFileSync(path.join(__dirname, certPath)),
    };
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions, logger: ['error', 'warn'] });
  // const port = Number(process.env.PORT) || 3333;
  // const hostname = process.env.HOSTNAME || 'localhost';

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "*",
    credentials: true,
  });

  // app.enableCors({
  //   allowedHeaders: "*",
  //   origin: "*",
  //   credentials: true,
  // });
  app.use(json({ limit: "15mb" }));

  server.get('/health', (req: Request, res: Response) => {
    res.send("success");
  });

  app.setGlobalPrefix("v1");

  // Serve static files from public directory
  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: '/public/',  // This adds /public prefix to all static files
  });

  // Enable ValidationPipe globally
  const validationOptions = {
    whitelist: true, // Automatically remove properties that are not decorated with validation decorators
  };
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  await app.listen(3000);
}
bootstrap();
