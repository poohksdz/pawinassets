const connectToDatabase = require('./config/db.js');

async function checkUserTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('DESCRIBE users');
        console.log('COLUMNS_START');
        console.log(JSON.stringify(columns));
        console.log('COLUMNS_END');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkUserTable();
