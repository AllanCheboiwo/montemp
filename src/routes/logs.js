const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const pool = require('../db/pool');

router.use(authenticate);

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, title, start_time, end_time, tag_id, notes
             FROM time_logs
             WHERE user_id = $1`,
            [req.user.id]
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get logs" });
    }
});

router.post('/', async (req, res) => {
    const { title, start_time, end_time, tag_id, notes } = req.body;

    if (!title || !start_time || !end_time) {
        return res.status(400).json({ message: "title, start_time and end_time are required" });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO time_logs (user_id, title, start_time, end_time, tag_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, start_time, end_time, tag_id, notes`,
            [req.user.id, title, start_time, end_time, tag_id ?? null, notes ?? null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create log" });
    }
});

router.put('/:id', async (req, res) => {
    const { title, start_time, end_time, tag_id, notes } = req.body;

    if (!title || !start_time || !end_time) {
        return res.status(400).json({ message: "title, start_time and end_time are required" });
    }

    try {
        const { rows } = await pool.query(
            `UPDATE time_logs
             SET title = $1, start_time = $2, end_time = $3, tag_id = $4, notes = $5
             WHERE id = $6 AND user_id = $7
             RETURNING id, title, start_time, end_time, tag_id, notes`,
            [title, start_time, end_time, tag_id ?? null, notes ?? null, req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update log" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM time_logs WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete log" });
    }
});

module.exports = router;
