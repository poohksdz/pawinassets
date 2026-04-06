const connectToDatabase = require('./config/db.js');
const fs = require('fs');

async function debug() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        const fields = columns.map(c => c.Field);
        fs.writeFileSync('db_cols.txt', fields.join('\n'));
        console.log('Done writing to db_cols.txt');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

debug();
