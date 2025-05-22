const express = require('express');
const router = express.Router();
const matchModels = require('../models/matchModels');
const requireAuth = require('../middleware/auth');
const statsModel = require('../models/statsModel');

// ----------------- READ -----------------

router.get('/', async (req, res) => {
    try {
        const matches = await matchModels.getAllMatches();
        res.status(200).json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id(\\d+)', async (req, res) => {
    const matchId = parseInt(req.params.id, 10);
    if (isNaN(matchId)) {
        return res.status(400).json({ error: 'Invalid match ID' });
    }
    try {
        const match = await statsModel.getMatchById(matchId);
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        res.status(200).json(match);
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /matches/player/:playerId
router.get('/player/:playerId', async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: 'Invalid player ID' });
    }
    try {
        const matches = await matchModels.getMatchesByPlayerId(playerId);
        res.json(matches);
    } catch (err) {
        console.error('Error fetching matches:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/last', async (req, res) => {
    try {
        const last = await matchModels.getLastMatch();
        if (!last) return res.status(404).json({ error: 'No matches found' });
        res.json(last);
    } catch (err) {
        console.error('Error fetching last match:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------ CREATE -----------------

router.post('/', requireAuth, async (req, res) => {
    const matchData = req.body;
    try {
        const newMatch = await statsModel.createMatch(matchData);
        res.status(201).json(newMatch);
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    const matchId = parseInt(req.params.id, 10);
    if (isNaN(matchId)) {
        return res.status(400).json({ error: 'Invalid match ID' });
    }
    const matchData = req.body;
    try {
        const updatedMatch = await statsModel.updateMatch(matchId, matchData);
        if (!updatedMatch) {
            return res.status(404).json({ error: 'Match not found' });
        }
        res.status(200).json(updatedMatch);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const matchId = parseInt(req.params.id, 10);
    if (isNaN(matchId)) {
        return res.status(400).json({ error: 'Invalid match ID' });
    }
    try {
        const deletedMatch = await statsModel.deleteMatch(matchId);
        if (!deletedMatch) {
            return res.status(404).json({ error: 'Match not found' });
        }
        res.status(200).json(deletedMatch);
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;