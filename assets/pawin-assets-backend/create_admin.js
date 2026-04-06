// สร้าง Admin User ใน TiDB
const dotenv = require('dotenv');
dotenv.config();
const connectToDatabase = require('./config/db.js');
const pool = require('./config/db.js').pool;
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const connection = await pool.getConnection();
  try {
    const hash = bcrypt.hashSync('1234', 10);

    // Ensure AUTO_INCREMENT on _id
    try {
      await connection.query('ALTER TABLE users MODIFY _id INT AUTO_INCREMENT');
    } catch (e) {
      // TiDB doesn't support this, skip
    }

    // Check if user already exists
    const [existing] = await connection.query('SELECT _id FROM users WHERE email = ?', ['admin@gmail.com']);
    if (existing.length > 0) {
      await connection.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@gmail.com']);
      console.log('Admin user updated: admin@gmail.com / 1234');
    } else {
      // Use MAX(_id) + 1 for TiDB compatibility
      const [maxId] = await connection.query('SELECT COALESCE(MAX(_id), 0) as max_id FROM users');
      const newId = maxId[0].max_id + 1;
      await connection.query(
        `INSERT INTO users (_id, name, email, password, isAdmin, isPCBAdmin, isStore, isStaff)
         VALUES (?, ?, ?, ?, 1, 1, 1, 1)`,
        [newId, 'Admin', 'admin@gmail.com', hash]
      );
      console.log('Admin user created: admin@gmail.com / 1234');
    }

    console.log('Admin created: admin@gmail.com / 1234');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    connection.release();
    await pool.end();
    process.exit();
  }
}

createAdmin();
