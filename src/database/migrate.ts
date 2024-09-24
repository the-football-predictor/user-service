// src/migrate.ts
import fs from "fs";
import path from "path";
import db from "./db";

interface Migration {
  migration_name: string;
}

async function getAppliedMigrations(): Promise<Migration[]> {
  const result = await db.query("SELECT migration_name FROM migrations");
  return result.rows;
}

async function addMigration(migrationName: string): Promise<void> {
  await db.query("INSERT INTO migrations (migration_name) VALUES ($1)", [
    migrationName,
  ]);
}

async function removeMigration(migrationName: string): Promise<void> {
  await db.query("DELETE FROM migrations WHERE migration_name = $1", [
    migrationName,
  ]);
}

async function runMigration(
  file: string,
  direction: "up" | "down"
): Promise<void> {
  const filePath = path.join(__dirname, "migrations", file);
  const sql = fs.readFileSync(filePath, "utf-8");

  const [up, down] = sql.split("-- Downward migration");
  const query = direction === "up" ? up : down;

  if (!query) {
    throw new Error(`Missing ${direction} migration block in file: ${file}`);
  }

  await db.query(query);
}

async function applyMigrations(direction: "up" | "down"): Promise<void> {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"));

  // Sort files by name (timestamped files ensure the order)
  files.sort();

  const appliedMigrations = await getAppliedMigrations();

  if (direction === "up") {
    // Apply only migrations that haven't been applied yet
    const toApply = files.filter(
      (file) => !appliedMigrations.some((m) => m.migration_name === file)
    );

    for (const file of toApply) {
      try {
        console.log(`Applying migration: ${file}`);
        await runMigration(file, "up");
        await addMigration(file);
        console.log(`Migration ${file} applied successfully.`);
      } catch (error) {
        console.error(`Failed to apply migration ${file}:`, error);
        process.exit(1);
      }
    }
  } else if (direction === "down") {
    // Rollback migrations in reverse order
    const toRollback = appliedMigrations
      .map((m) => m.migration_name)
      .reverse()
      .filter((file) => files.includes(file));

    for (const file of toRollback) {
      try {
        console.log(`Reverting migration: ${file}`);
        await runMigration(file, "down");
        await removeMigration(file);
        console.log(`Migration ${file} reverted successfully.`);
      } catch (error) {
        console.error(`Failed to revert migration ${file}:`, error);
        process.exit(1);
      }
    }
  }

  console.log(
    `${
      direction === "up" ? "All" : "All applicable"
    } migrations executed successfully.`
  );
  await db.close();
}

const direction = process.argv[2] || "up"; // Default to 'up', can be set to 'down' to rollback
applyMigrations(direction as unknown as "up" | "down").catch((err) => {
  console.error("Migration process failed:", err);
});
