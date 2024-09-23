import dotenv from "dotenv";
import { Pool } from "pg"; // PostgreSQL client

dotenv.config();

/**
 * Env variables required for all environment (development, production, testing, staging)
 */
const requiredVariables = ["port"];

/**
 * Env variables required for both production and staging
 */
const productionAndStagingVariables = [
  "postgres_host",
  "postgres_port",
  "postgres_db",
  "postgres_user",
  "postgres_password",
];

/**
 * Requires PostgreSQL in production and staging, else uses PostgreSQL connection string directly
 * in dev or any other environment
 */
if (["production", "staging"].includes(process.env.NODE_ENV as string)) {
  requiredVariables.push(...productionAndStagingVariables);
} else {
  requiredVariables.push(
    "postgres_host",
    "postgres_port",
    "postgres_db",
    "postgres_user",
    "postgres_password"
  );
}

const env = {
  /**
   * NodeJS runtime environment.
   * Possible values are "development" and "production".
   *
   * DON'T SET THIS MANUALLY
   */
  node_env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8000,

  // PostgreSQL environment variables
  postgres_host: process.env.POSTGRES_HOST || "localhost",
  postgres_port: Number(process.env.POSTGRES_PORT) || 5432,
  postgres_db: process.env.POSTGRES_DB,
  postgres_user: process.env.POSTGRES_USER || "postgres",
  postgres_password: process.env.POSTGRES_PASSWORD,

  service_name:
    process.env.SERVICE_NAME || "The prediction Game",

  /**
   * This application's runtime environment
   * Possible values are "development", "test", "production", "staging"
   */
  app_env: process.env.APP_ENV || "development",

  jwt_secret: process.env.JWT_SECRET,
  expiresIn: process.env.EXPIRES_IN || "1d",

  adminSecret: process.env.ADMIN_SECRET,
  superAdminSecret: process.env.SUPER_ADMIN_SECRET,

  email: process.env.EMAIL_ADDRESS,
  email_service: process.env.EMAIL_SERVICE,
  email_app_password: process.env.EMAIL_AUTH_PASSWORD,
};

const missingVariables = requiredVariables.reduce(
  (acc, varName) => (!env[varName] ? acc.concat(varName.toUpperCase()) : acc),
  []
);

if (!!missingVariables.length)
  throw new Error(
    `The following required variables are missing: ${missingVariables}`
  );

/**
 * PostgreSQL Database class
 */
class DB {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: env.postgres_host,
      port: env.postgres_port,
      database: env.postgres_db,
      user: env.postgres_user,
      password: env.postgres_password,
    });

    this.pool.on("error", (err: Error) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
      process.exit(-1);
    });
  }

  /**
   * Connect to the PostgreSQL database
   */
  public async connect() {
    try {
      const client = await this.pool.connect();
      console.log("Connected to PostgreSQL database");
      return client;
    } catch (err) {
      console.error("Failed to connect to PostgreSQL database", err);
      throw err;
    }
  }

  /**
   * Disconnect from the PostgreSQL database
   */
  public async disconnect() {
    try {
      await this.pool.end();
      console.log("Disconnected from PostgreSQL database");
    } catch (err) {
      console.error("Error disconnecting from PostgreSQL database", err);
      throw err;
    }
  }
}

export default env;
