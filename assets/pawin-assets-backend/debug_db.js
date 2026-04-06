const connectToDatabase = require('./config/db.js');

async function debug() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        console.log('COLUMNS_START');
        console.log(JSON.stringify(columns, null, 2));
        console.log('COLUMNS_END');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

debug();
