import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspect() {
  try {
    console.log('--- Tables ---');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.table(tables.rows);

    console.log('--- Columns in users ---');
    const userCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.table(userCols.rows);

    console.log('--- Applied Migrations ---');
    const migrations = await pool.query('SELECT * FROM pgmigrations');
    console.table(migrations.rows);

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await pool.end();
  }
}

inspect();
