const connectToDatabase = require('./config/db.js');

async function checkItem() {
    const connection = await connectToDatabase();
    try {
        const [rows] = await connection.query('SELECT * FROM tbl_product WHERE ID = 1671');
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkItem();
