const connectToDatabase = require('./config/db.js');

async function debug() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        console.log('--- START ---');
        columns.forEach(c => {
            console.log(`FIELD: ${c.Field}`);
        });
        console.log('--- END ---');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

debug();
