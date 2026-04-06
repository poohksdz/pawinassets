const connectToDatabase = require('./config/db.js');

async function migrateNotificationsTable() {
    let connection;
    try {
        connection = await connectToDatabase();
        console.log('Migrating tbl_notifications schema...');

        // 1. Add 'title' column if it doesn't exist
        try {
            await connection.query('ALTER TABLE tbl_notifications ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER message');
            console.log('Added column: title');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log('Column title already exists.');
            else throw err;
        }

        // 2. Rename 'isRead' to 'is_read'
        try {
            await connection.query('ALTER TABLE tbl_notifications CHANGE isRead is_read BOOLEAN DEFAULT FALSE');
            console.log('Renamed column: isRead -> is_read');
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') console.log('Column isRead not found (might already be renamed).');
            else throw err;
        }

        // 3. Rename 'createdAt' to 'created_at'
        try {
            await connection.query('ALTER TABLE tbl_notifications CHANGE createdAt created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Renamed column: createdAt -> created_at');
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') console.log('Column createdAt not found (might already be renamed).');
            else throw err;
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrateNotificationsTable();
