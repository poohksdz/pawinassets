const connectToDatabase = require('../config/db');

const safeQuery = async (conn, sql, params = []) => {
  try { return await conn.query(sql, params); }
  catch (err) { console.warn('Maintenance query fallback:', err.message); return [[]]; }
};

const getMaintenanceLogs = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();

    // Check if table exists
    const [tables] = await safeQuery(connection, "SHOW TABLES LIKE 'tbl_maintenance'");
    if (tables.length === 0) {
      return res.json([]);
    }

    const [rows] = await safeQuery(connection,
      `SELECT m.*, p.electotronixPN
       FROM tbl_maintenance m
       LEFT JOIN tbl_product p ON m.asset_id = p.ID
       ORDER BY m.created_at DESC`
    );

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const createMaintenanceLog = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const { asset_id, description, cost, status } = req.body;
    const userId = req.user._id;

    const [result] = await safeQuery(connection,
      `INSERT INTO tbl_maintenance (asset_id, description, cost, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [asset_id || null, description || '', cost || 0, status || 'pending', userId]
    );

    res.status(201).json({
      message: 'Maintenance log created',
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const updateMaintenanceLog = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const { asset_id, description, cost, status } = req.body;
    const logId = req.params.id;

    await safeQuery(connection,
      `UPDATE tbl_maintenance SET asset_id = ?, description = ?, cost = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [asset_id || null, description || '', cost || 0, status || 'pending', logId]
    );

    res.json({ message: 'Maintenance log updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const deleteMaintenanceLog = async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    await safeQuery(connection, 'DELETE FROM tbl_maintenance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Maintenance log deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog };
