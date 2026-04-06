// add_new_tables.js — Database migration for PAWIN Assets
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pawin_tech',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  try {
    // =========================================
    // 1. Create tbl_maintenance
    // =========================================
    const [tbls] = await connection.query("SHOW TABLES LIKE 'tbl_maintenance'");
    if (tbls.length === 0) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tbl_maintenance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          borrow_id INT NULL,
          asset_id INT NULL,
          description TEXT NULL,
          cost DECIMAL(10, 2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          created_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ Created tbl_maintenance');
    } else {
      console.log('ℹ️  tbl_maintenance already exists, skipping');
    }

    // =========================================
    // 2. Create tbl_audit_log
    // =========================================
    const [tbls2] = await connection.query("SHOW TABLES LIKE 'tbl_audit_log'");
    if (tbls2.length === 0) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tbl_audit_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          action VARCHAR(255) NULL,
          entity_type VARCHAR(100) NULL,
          entity_id INT NULL,
          details TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ Created tbl_audit_log');
    } else {
      console.log('ℹ️  tbl_audit_log already exists, skipping');
    }

    // =========================================
    // 3. Add 'department' column to users if not present
    // =========================================
    const [cols1] = await connection.query(
      "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'department'",
      [process.env.DB_NAME || 'pawin_tech']
    );
    if (cols1.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL AFTER `address`");
      console.log("✅ Added 'department' column to users");
    } else {
      console.log("ℹ️  'department' column already exists in users, skipping");
    }

    // =========================================
    // 4. Add 'location' column to users if not present
    // =========================================
    const [cols2] = await connection.query(
      "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'location'",
      [process.env.DB_NAME || 'pawin_tech']
    );
    if (cols2.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN `location` VARCHAR(100) DEFAULT NULL AFTER `department`");
      console.log("✅ Added 'location' column to users");
    } else {
      console.log("ℹ️  'location' column already exists in users, skipping");
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
