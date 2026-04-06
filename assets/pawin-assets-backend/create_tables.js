// สร้างตารางที่ขาดใน TiDB
const dotenv = require('dotenv');
dotenv.config();
const pool = require('./config/db.js').pool;

async function createTables() {
  const conn = await pool.getConnection();
  try {
    // tbl_borrow
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tbl_borrow (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          status VARCHAR(50) DEFAULT 'pending_approval',
          borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          due_date DATETIME DEFAULT NULL,
          return_date DATETIME DEFAULT NULL,
          return_image TEXT DEFAULT NULL,
          penalty_fee DECIMAL(10,2) DEFAULT 0,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status)
        )
      `);
      console.log('✅ tbl_borrow created/already exists');
    } catch (e) {
      console.log('⚠️ tbl_borrow:', e.message);
    }

    // tbl_notifications
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tbl_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(200) DEFAULT NULL,
          message TEXT DEFAULT NULL,
          is_read TINYINT(1) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        )
      `);
      console.log('✅ tbl_notifications created/already exists');
    } catch (e) {
      console.log('⚠️ tbl_notifications:', e.message);
    }

    // tbl_transactions
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tbl_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          borrow_id INT DEFAULT NULL,
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          description TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        )
      `);
      console.log('✅ tbl_transactions created/already exists');
    } catch (e) {
      console.log('⚠️ tbl_transactions:', e.message);
    }

    // เพิ่ม column ที่ขาดใน users
    const columns = ['penalty', 'isPCBAdmin', 'isStore', 'isStaff'];
    for (const col of columns) {
      try {
        await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} TINYINT(1) DEFAULT 0`);
        console.log(`✅ Column '${col}' added to users`);
      } catch (e) {
        console.log(`ℹ️ Column '${col}' already exists or TiDB doesn't support ALTER`);
      }
    }

    console.log('\n🎉 All tables ready!');
  } finally {
    conn.release();
    await pool.end();
    process.exit();
  }
}

createTables();
