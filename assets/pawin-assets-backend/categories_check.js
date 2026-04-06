const connectToDatabase = require('./config/db.js');

async function getCategories() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [cats] = await connection.query('SELECT DISTINCT category FROM tbl_product WHERE category IS NOT NULL AND category != ""');
        const [subcats] = await connection.query('SELECT DISTINCT subcategory FROM tbl_product WHERE subcategory IS NOT NULL AND subcategory != ""');

        console.log('Categories:', cats.map(c => c.category).join(', '));
        console.log('Subcategories:', subcats.map(s => s.subcategory).join(', '));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

getCategories();
