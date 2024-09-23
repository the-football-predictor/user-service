import { Pool } from 'pg';
import env from "../common/config/env";

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

export { DB };
