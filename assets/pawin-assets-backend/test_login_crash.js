const connectToDatabase = require('./config/db.js');

async function test() {
    const connection = await connectToDatabase();
    try {
        const [users] = await connection.query('SELECT * FROM users LIMIT 1');
        console.log('User found:', JSON.stringify(users[0]));

        // Check columns
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        console.log('Columns:', columns.map(c => c.Field).join(', '));
    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
test();
