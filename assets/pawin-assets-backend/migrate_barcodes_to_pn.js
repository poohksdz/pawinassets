const connectToDatabase = require('./config/db.js');

async function migrateData() {
    const connection = await connectToDatabase();
    try {
        console.log('Migrating existing barcode items...');
        const [result] = await connection.query(
            'UPDATE tbl_product SET manufacturePN = electotronixPN, electotronixPN = barcode WHERE barcode IS NOT NULL AND barcode != ""'
        );
        console.log(`Successfully migrated ${result.affectedRows} items.`);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrateData();
