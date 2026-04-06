const connectToDatabase = require('./config/db.js');

async function checkProductTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('DESCRIBE tbl_product');
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

checkProductTable();
