const express = require('express');
const router = express.Router({ mergeParams: true });
const statsModel = require('../models/statsModel');
const requireAuth = require('../middleware/auth');

// ----------------- READ -----------------

router.get('/', async (req, res) => {
    try {
        const stats = await statsModel.getAllStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/:id(\\d+)', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id < 1) {
        return res
            .status(400)
            .json({ error: 'Please provide a valid ID (positive integer)' });
    }

    try {
        const stats = await statsModel.getStatsById(id);
        if (!stats) {
            return res
                .status(404)
                .json({ error: 'No stats found with the specified ID' });
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching stats by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/search-by-player/:playerId(\\d+)', async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);

    if (isNaN(playerId) || playerId < 1) {
        return res
            .status(400)
            .json({ error: 'Please provide a valid player ID (positive integer)' });
    }

    try {
        const stats = await statsModel.researchStatsByPlayerId(playerId);
        if (stats.length === 0) {
            return res
                .status(404)
                .json({ error: 'No stats found for the specified player' });
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error searching stats by player ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/search-by-player/average/:playerId(\\d+)', async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);

    if (isNaN(playerId) || playerId < 1) {
        return res
            .status(400)
            .json({ error: 'Please provide a valid player ID (positive integer)' });
    }

    try {
        const stats = await statsModel.getAverageStatsByPlayerId(playerId);
        if (!stats) {
            return res
                .status(404)
                .json({ error: 'No stats found with the specified ID' });
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching average stats by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

// ----------------- CREATE -----------------
// POST /players/:playerId/stats
router.post('/', requireAuth, async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: 'Player ID must be a number' });
    }
    try {
        const newStats = await statsModel.createStats(playerId, req.body);
        res.status(201).json(newStats);
    } catch (err) {
        console.error('Error creating stats:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ----------------- UPDATE -----------------
// PUT /players/:playerId/stats/:id
router.put('/:id(\\d+)', requireAuth, async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    const statId = parseInt(req.params.id, 10);
    if (isNaN(playerId) || isNaN(statId)) {
        return res.status(400).json({ error: 'Player ID and Stat ID must be numbers' });
    }
    try {
        const updated = await statsModel.updateStats(statId, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Stats not found' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating stats:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;