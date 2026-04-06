const connectToDatabase = require('./config/db.js');

async function debug() {
    let connection;
    try {
        connection = await connectToDatabase();
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        const fields = columns.map(c => c.Field);
        console.log('Fields found:', fields.join(', '));

        const requiredFields = ['id', '_id', 'email', 'password', 'name', 'phone', 'address', 'isAdmin', 'isPCBAdmin', 'isStore', 'isStaff', 'penalty'];
        console.log('Comparison:');
        requiredFields.forEach(f => {
            console.log(`${f}: ${fields.includes(f) ? '✅' : '❌'}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

debug();
