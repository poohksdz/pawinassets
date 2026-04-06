const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawin_tech'
    });

    try {
        console.log('Renaming credit to penalty...');
        // Add penalty column first
        await connection.query('ALTER TABLE users ADD COLUMN penalty INT DEFAULT 0');

        // Migrate data (convert negative credit to positive penalty)
        await connection.query('UPDATE users SET penalty = ABS(credit) WHERE credit < 0');
        await connection.query('UPDATE users SET penalty = 0 WHERE credit >= 0');

        // Drop credit column
        await connection.query('ALTER TABLE users DROP COLUMN credit');

        console.log('Database updated successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column penalty already exists, skipping ADD COLUMN');
        } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('Column credit already dropped');
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await connection.end();
    }
}

run();
