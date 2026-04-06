const connectToDatabase = require('./config/db.js');

async function addBarcodeColumn() {
    let connection;
    try {
        connection = await connectToDatabase();
        console.log('Adding barcode column to tbl_product...');
        await connection.query('ALTER TABLE tbl_product ADD COLUMN barcode VARCHAR(50) UNIQUE DEFAULT NULL');
        console.log('Successfully added barcode column.');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column barcode already exists. Skipping...');
        } else {
            console.error('Error adding barcode column:', err.message);
        }
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

addBarcodeColumn();
