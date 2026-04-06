const connectToDatabase = require('./config/db.js');

async function checkBarcodes() {
    const connection = await connectToDatabase();
    try {
        const [rows] = await connection.query('SELECT ID, electotronixPN, barcode FROM tbl_product WHERE barcode IS NOT NULL');
        console.log(`Found ${rows.length} items with barcodes.`);
        rows.slice(0, 5).forEach(r => console.log(`ID: ${r.ID} | PN: ${r.electotronixPN} | Barcode: ${r.barcode}`));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkBarcodes();
