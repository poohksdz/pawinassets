const connectToDatabase = require('./config/db.js');

async function findMax() {
    const connection = await connectToDatabase();
    try {
        const prefix = '00880082';
        const [rows] = await connection.query(
            `SELECT electotronixPN, barcode FROM tbl_product WHERE electotronixPN LIKE ? OR barcode LIKE ? ORDER BY GREATEST(COALESCE(CAST(SUBSTRING(electotronixPN, 9) AS UNSIGNED), 0), COALESCE(CAST(SUBSTRING(barcode, 9) AS UNSIGNED), 0)) DESC LIMIT 5`,
            [`${prefix}%`, `${prefix}%`]
        );
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findMax();
