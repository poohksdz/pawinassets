const connectToDatabase = require('./config/db.js');

async function checkProductTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('DESCRIBE tbl_product');
        columns.forEach(col => console.log('FIELD:', col.Field, 'TYPE:', col.Type));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkProductTable();
