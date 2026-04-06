const connectToDatabase = require('./config/db.js');

async function checkTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('DESCRIBE tbl_notifications');
        columns.forEach(col => console.log('FIELD:', col.Field));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkTable();
