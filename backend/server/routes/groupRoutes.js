const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all groups (optionally public only)
router.get('/', async (req, res) => {
  try {
    const { onlyPublic } = req.query;
    let query = 'SELECT * FROM group';
    if (onlyPublic === 'true') {
      query += ' WHERE is_private = FALSE';
    }
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group by id (with members)
router.get('/:group_id', async (req, res) => {
  try {
    const group_id = req.params.group_id;
    const groupResult = await db.query('SELECT * FROM group WHERE group_id = $1', [group_id]);
    if (groupResult.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    const group = groupResult.rows[0];
    const members = await db.query(
      'SELECT gm.*, u.username, u.email FROM group_member gm JOIN "User" u ON gm.user_id = u.user_id WHERE gm.group_id = $1',
      [group_id]
    );
    group.members = members.rows;
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new group
router.post('/', async (req, res) => {
  try {
    const { name, description, is_private, password_hash, created_by } = req.body;
    const groupResult = await db.query(
      'INSERT INTO group (name, description, is_private, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, is_private || false, password_hash || null]
    );
    const group = groupResult.rows[0];
    // Record creator in group_creation
    await db.query(
      'INSERT INTO group_creation (created_by, group_id) VALUES ($1, $2)',
      [created_by, group.group_id]
    );
    // Add creator as member (role: admin)
    await db.query(
      'INSERT INTO group_member (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.group_id, created_by, 'admin']
    );
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a group
router.post('/:group_id/join', async (req, res) => {
  try {
    const { user_id, password_hash } = req.body;
    const group_id = req.params.group_id;
    // Check if already a member
    const exists = await db.query('SELECT 1 FROM group_member WHERE group_id = $1 AND user_id = $2', [group_id, user_id]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Already a member' });
    // If private, check password
    const group = await db.query('SELECT is_private, password_hash FROM group WHERE group_id = $1', [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    if (group.rows[0].is_private && group.rows[0].password_hash !== password_hash) {
      return res.status(403).json({ error: 'Incorrect password' });
    }
    await db.query('INSERT INTO group_member (group_id, user_id) VALUES ($1, $2)', [group_id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave a group
router.post('/:group_id/leave', async (req, res) => {
  try {
    const { user_id } = req.body;
    const group_id = req.params.group_id;
    await db.query('DELETE FROM group_member WHERE group_id = $1 AND user_id = $2', [group_id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List groups a user is a member of
router.get('/user/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { rows } = await db.query(
      'SELECT g.* FROM group g JOIN group_member gm ON g.group_id = gm.group_id WHERE gm.user_id = $1',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
