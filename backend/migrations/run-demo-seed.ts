// Run clean and seed demo migration
// Usage: npx ts-node migrations/run-demo-seed.ts

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

async function runDemoSeed() {
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

    // Generate password hash for Demo123!
    console.log('🔐 Generating password hash for Demo123!...');
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    console.log('✅ Password hash generated');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '006_clean_and_seed_demo.sql');
    let sql = fs.readFileSync(migrationPath, 'utf-8');

    // Replace placeholder hash with actual hash
    sql = sql.replace(/\$2b\$10\$EfLj8vA2YdN7nKX5Q3BzHuWsZqP1RcT4VmYxUoS9GiJaH6DkMwO0e/g, passwordHash);

    console.log('🧹 Cleaning database and seeding demo accounts...');
    console.log('⚠️  This will DELETE ALL existing data!');
    console.log('');
    
    await client.query(sql);
    
    console.log('✅ Database cleaned and seeded successfully!');
    console.log('');
    console.log('📋 Demo accounts created:');
    console.log('   1. superadmin@nettoyageplus.com (SUPER_ADMIN)');
    console.log('   2. admin@nettoyageplus.com (ADMIN)');
    console.log('   3. supervisor@nettoyageplus.com (SUPERVISOR)');
    console.log('   4. agent@nettoyageplus.com (AGENT)');
    console.log('   5. client@nettoyageplus.com (CLIENT)');
    console.log('');
    console.log('🔑 Password for all accounts: Demo123!');

    // Verify
    const result = await client.query('SELECT email, role, status FROM users ORDER BY role');
    console.log('');
    console.log('📊 Verification:');
    result.rows.forEach(row => {
      console.log(`   ${row.email} - ${row.role} (${row.status})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runDemoSeed();
