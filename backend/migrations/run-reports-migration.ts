// Run reports migration script
// Usage: npx ts-node migrations/run-reports-migration.ts

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || 
    'postgresql://postgres.gqjymgkaxmdapmmwvspp:HxZqGsgvwfNpaALq@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '004_add_reports_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📜 Running reports migration...');
    await client.query(sql);
    console.log('✅ Reports migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
