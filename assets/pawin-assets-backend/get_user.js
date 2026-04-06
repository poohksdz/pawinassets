const connectToDatabase = require('./config/db.js');

async function getUsers() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [rows] = await connection.query('SELECT email FROM users LIMIT 1');
        console.log('USER_EMAIL:', rows[0]?.email);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

getUsers();
