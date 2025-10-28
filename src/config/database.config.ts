import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: "mysql",
  host: "infinora.cd2ayua6gzyi.ap-south-1.rds.amazonaws.com",
  port: 3306,
  username: "infinora",
  password: "lFlgDLND12jY25ye",
  database: "project-portal",
  entities: [join(__dirname, "../entities/**/*.entity{.ts,.js}")],
  synchronize: true,
  logging: true,
  autoLoadEntities: true,
  extra: {
    "sql_mode": "",
    "connectionLimit": 25,
    "acquireTimeout": 30000,
  },
};

// Separate DataSource for manual connections
export const dataSource = new DataSource(databaseConfig as DataSourceOptions);

async function connectWithRetry() {
  try {
    await dataSource.initialize();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database connection failed. Retrying in 5 seconds...", error);
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();
