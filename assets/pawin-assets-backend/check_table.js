const connectToDatabase = require('./config/db.js');

async function checkTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [rows] = await connection.query('SHOW TABLES LIKE "tbl_notifications"');
        if (rows.length === 0) {
            console.log('Table tbl_notifications DOES NOT EXIST');
        } else {
            console.log('Table tbl_notifications EXISTS');
            const [columns] = await connection.query('DESCRIBE tbl_notifications');
            console.log('COLUMNS_START');
            console.log(JSON.stringify(columns));
            console.log('COLUMNS_END');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkTable();
