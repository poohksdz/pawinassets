const connectToDatabase = require('./config/db.js');

async function repairAndMigrate() {
    const connection = await connectToDatabase();
    try {
        const prefix = '00880082';

        // 1. Repair PN-only barcodes
        console.log('Repairing items with PN-only barcodes...');
        const [rows1] = await connection.query(
            "SELECT ID, electotronixPN FROM tbl_product WHERE electotronixPN LIKE ? AND (barcode IS NULL OR barcode = '')",
            [`${prefix}%`]
        );

        for (const row of rows1) {
            console.log(`Processing ID ${row.ID} (Syncing PN ${row.electotronixPN} to barcode)`);
            try {
                await connection.query("UPDATE tbl_product SET barcode = electotronixPN WHERE ID = ?", [row.ID]);
                console.log(`  Success.`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`  Collision on barcode ${row.electotronixPN}. This barcode is already used elsewhere.`);
                    // We might need to generate a new one for THIS item if the current one is taken by another row's barcode column
                    const [other] = await connection.query("SELECT ID, electotronixPN, barcode FROM tbl_product WHERE barcode = ?", [row.electotronixPN]);
                    console.log(`  Collides with ID ${other[0].ID} (PN: ${other[0].electotronixPN}, Barcode: ${other[0].barcode})`);
                }
            }
        }

        // 2. Migrate items with barcode but custom PN
        console.log('Migrating custom PN items with barcodes...');
        const [rowsToMigrate] = await connection.query(
            "SELECT ID, electotronixPN, barcode FROM tbl_product WHERE barcode IS NOT NULL AND barcode != '' AND electotronixPN != barcode"
        );

        for (const row of rowsToMigrate) {
            console.log(`Processing ID ${row.ID} (PN: ${row.electotronixPN}, Barcode: ${row.barcode})`);
            try {
                await connection.query(
                    "UPDATE tbl_product SET manufacturePN = electotronixPN, electotronixPN = barcode WHERE ID = ?",
                    [row.ID]
                );
                console.log(`  Success.`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`  Collision on PN change to ${row.barcode}. Building new sequence...`);
                    const [latest] = await connection.query(
                        `SELECT electotronixPN, barcode FROM tbl_product 
             WHERE electotronixPN LIKE ? OR barcode LIKE ? 
             ORDER BY GREATEST(
               COALESCE(CAST(SUBSTRING(electotronixPN, 9) AS UNSIGNED), 0), 
               COALESCE(CAST(SUBSTRING(barcode, 9) AS UNSIGNED), 0)
             ) DESC LIMIT 1`,
                        [`${prefix}%`, `${prefix}%`]
                    );
                    let nextNumber = 1;
                    if (latest.length > 0) {
                        const pnNum = latest[0].electotronixPN?.startsWith(prefix) ? parseInt(latest[0].electotronixPN.substring(prefix.length), 10) : 0;
                        const bcNum = latest[0].barcode?.startsWith(prefix) ? parseInt(latest[0].barcode.substring(prefix.length), 10) : 0;
                        nextNumber = Math.max(pnNum, bcNum) + 1;
                    }
                    const fresh = prefix + String(nextNumber).padStart(4, '0');
                    await connection.query(
                        "UPDATE tbl_product SET manufacturePN = electotronixPN, electotronixPN = ?, barcode = ? WHERE ID = ?",
                        [fresh, fresh, row.ID]
                    );
                    console.log(`  Updated with fresh: ${fresh}`);
                }
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

repairAndMigrate();
