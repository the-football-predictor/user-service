import { Pool } from "pg";
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

  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default new DB();
