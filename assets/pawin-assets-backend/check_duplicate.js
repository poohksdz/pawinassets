const connectToDatabase = require('./config/db.js');

async function checkDuplicate() {
    const connection = await connectToDatabase();
    try {
        const [rows] = await connection.query('SELECT ID, electotronixPN, barcode FROM tbl_product WHERE electotronixPN = "008800820001"');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDuplicate();
