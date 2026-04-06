const connectToDatabase = require('./config/db.js');

async function checkSchema() {
    const connection = await connectToDatabase();
    try {
        const [rows] = await connection.query('DESCRIBE tbl_product');
        for (const row of rows) {
            console.log(`${row.Field}: ${row.Type} (${row.Null}, ${row.Key})`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
