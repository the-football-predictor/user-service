// src/generateMigration.ts
import fs from "fs";
import path from "path";

// Function to generate current timestamp in the format YYYYMMDDHHMM
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}`;
}

// Templates for different migration types with placeholders for required parameters
const templates: {
  [key: string]: { up: string; down: string; requiredParams: string[] };
} = {
  create_table: {
    up: `
-- Upward migration
CREATE TABLE IF NOT EXISTS table_name (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
`,
    down: `
-- Downward migration
DROP TABLE IF EXISTS table_name;
`,
    requiredParams: ["table_name"],
  },
  alter_table: {
    up: `
-- Upward migration
ALTER TABLE table_name
ADD COLUMN new_column VARCHAR(255);
`,
    down: `
-- Downward migration
ALTER TABLE table_name
DROP COLUMN new_column;
`,
    requiredParams: ["table_name", "new_column"],
  },
  add_index: {
    up: `
-- Upward migration
CREATE INDEX idx_table_column ON table_name (column_name);
`,
    down: `
-- Downward migration
DROP INDEX IF EXISTS idx_table_column;
`,
    requiredParams: ["table_name", "column_name"],
  },
  drop_table: {
    up: `
-- Upward migration
DROP TABLE IF EXISTS table_name;
`,
    down: `
-- Downward migration
CREATE TABLE IF NOT EXISTS table_name (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
`,
    requiredParams: ["table_name"],
  },
  rename_column: {
    up: `
-- Upward migration
ALTER TABLE table_name
RENAME COLUMN old_column TO new_column;
`,
    down: `
-- Downward migration
ALTER TABLE table_name
RENAME COLUMN new_column TO old_column;
`,
    requiredParams: ["table_name", "old_column", "new_column"],
  },
  modify_column: {
    up: `
-- Upward migration
ALTER TABLE table_name
ALTER COLUMN column_name SET DATA TYPE new_data_type;
`,
    down: `
-- Downward migration
ALTER TABLE table_name
ALTER COLUMN column_name SET DATA TYPE old_data_type;
`,
    requiredParams: [
      "table_name",
      "column_name",
      "new_data_type",
      "old_data_type",
    ],
  },
  drop_column: {
    up: `
-- Upward migration
ALTER TABLE table_name
DROP COLUMN column_name;
`,
    down: `
-- Downward migration
ALTER TABLE table_name
ADD COLUMN column_name column_data_type;
`,
    requiredParams: ["table_name", "column_name", "column_data_type"],
  },
  add_foreign_key: {
    up: `
-- Upward migration
ALTER TABLE table_name
ADD CONSTRAINT fk_name FOREIGN KEY (column_name)
REFERENCES foreign_table_name (foreign_column_name);
`,
    down: `
-- Downward migration
ALTER TABLE table_name
DROP CONSTRAINT IF EXISTS fk_name;
`,
    requiredParams: [
      "table_name",
      "fk_name",
      "column_name",
      "foreign_table_name",
      "foreign_column_name",
    ],
  },
  drop_foreign_key: {
    up: `
-- Upward migration
ALTER TABLE table_name
DROP CONSTRAINT fk_name;
`,
    down: `
-- Downward migration
ALTER TABLE table_name
ADD CONSTRAINT fk_name FOREIGN KEY (column_name)
REFERENCES foreign_table_name (foreign_column_name);
`,
    requiredParams: [
      "table_name",
      "fk_name",
      "column_name",
      "foreign_table_name",
      "foreign_column_name",
    ],
  },
  rename_table: {
    up: `
-- Upward migration
ALTER TABLE old_table_name
RENAME TO new_table_name;
`,
    down: `
-- Downward migration
ALTER TABLE new_table_name
RENAME TO old_table_name;
`,
    requiredParams: ["old_table_name", "new_table_name"],
  },
};

// Function to validate if the required parameters are provided
function validateParams(
  params: { [key: string]: string },
  requiredParams: string[]
) {
  for (const param of requiredParams) {
    if (!params[param]) {
      console.error(`Missing required parameter: ${param}`);
      process.exit(1);
    }
  }
}

// Function to replace placeholders in the template with actual values
function replacePlaceholders(
  template: string,
  params: { [key: string]: string }
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(key, "g"), value);
  }
  return result;
}

// Create a new migration file with the provided name, type, and parameters
function createMigrationFile(
  migrationName: string,
  migrationType: string,
  params: { [key: string]: string }
): void {
  const timestamp = getTimestamp();
  const fileName = `${timestamp}_${migrationName}.sql`;
  const migrationsDir = path.join(__dirname, "migrations");
  const filePath = path.join(migrationsDir, fileName);

  const template = templates[migrationType];
  if (!template) {
    console.error(`Unknown migration type: ${migrationType}`);
    process.exit(1);
  }

  // Validate required parameters
  validateParams(params, template.requiredParams);

  // Replace placeholders with actual parameter values
  const upMigration = replacePlaceholders(template.up, params);
  const downMigration = replacePlaceholders(template.down, params);

  const content = `
-- Upward migration
${upMigration.trim()}

-- Downward migration
${downMigration.trim()}
`;

  fs.writeFileSync(filePath, content.trim());
  console.log(`Migration file created: ${filePath}`);
}

// Get the migration name, type, and additional parameters from the command line
const migrationName = process.argv[2];
const migrationType = process.argv[3];
const paramsArg = process.argv.slice(4); // Get the remaining parameters as an array

if (!migrationName) {
  console.error("Please provide a migration name.");
  process.exit(1);
}

if (!migrationType) {
  console.error("Please provide a migration type.");
  process.exit(1);
}

// Convert paramsArg (array) to an object with key-value pairs
const params: { [key: string]: string } = {};
for (const param of paramsArg) {
  const [key, value] = param.split("=");
  params[key] = value;
}

createMigrationFile(migrationName, migrationType, params);
