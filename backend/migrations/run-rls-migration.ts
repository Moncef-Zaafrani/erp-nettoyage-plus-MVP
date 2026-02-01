// Run RLS and demo client migration
// Usage: npx ts-node migrations/run-rls-migration.ts

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runRlsMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '007_add_demo_client_and_enable_rls.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🔐 Enabling RLS and adding demo client...');
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 What was done:');
    console.log('   1. Created demo client record linked to client@nettoyageplus.com');
    console.log('   2. Enabled RLS on all 24 tables');
    console.log('   3. Created permissive policies for service_role');
    console.log('   4. Fixed function search_path for update_updated_at_column');

    // Verify demo client
    const result = await client.query(`
      SELECT c.name, c."clientCode", c.email, u.email as user_email 
      FROM clients c 
      LEFT JOIN users u ON c."userId" = u.id 
      WHERE c.email = 'client@nettoyageplus.com'
    `);
    
    if (result.rows.length > 0) {
      console.log('');
      console.log('📊 Demo client verification:');
      console.log(`   Name: ${result.rows[0].name}`);
      console.log(`   Code: ${result.rows[0].clientCode}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Linked User: ${result.rows[0].user_email}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runRlsMigration();
