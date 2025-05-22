// routes/playerRoutes.js
const express = require('express');
const router = express.Router();
const PlayerModel = require('../models/playerModel');
const PassportModel = require('../models/passportModel');
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/auth');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `player-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.gif'];
        cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ----------------- READ -----------------

// GET /players
router.get('/', async (req, res) => {
    try {
        const players = await PlayerModel.getAllPlayers();
        res.status(200).json(players);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /players/search-by-position/:position
router.get('/search-by-position/:position', async (req, res) => {
    const { position } = req.params;
    if (!position) {
        return res.status(400).json({ error: 'Please provide a valid position' });
    }
    try {
        const players = await PlayerModel.researchPlayerByPosition(position);
        if (players.length === 0) {
            return res.status(404).json({ error: 'No players found with the specified position' });
        }
        res.status(200).json(players);
    } catch (err) {
        console.error('Error searching players by position:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /players/search-by-passport/:contry
router.get('/search-by-passport/:country', async (req, res) => {
    const country = req.params.country.trim();
    if (!country) {
        return res.status(400).json({ error: 'Please provide a passport country' });
    }
    try {
        const players = await PlayerModel.researchPlayerByPassport(country);
        if (players.length === 0) {
            return res.status(404).json({ error: 'No players found for this passport country' });
        }
        res.json(players);
    } catch (err) {
        console.error('Error searching players by passport country:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /players/search-by-age?age=35
router.get('/search-by-age', async (req, res) => {
    const age = parseInt(req.query.age, 10);
    if (isNaN(age) || age < 0) {
        return res.status(400).json({ error: 'Please provide a valid non-negative integer for age' });
    }
    try {
        const players = await PlayerModel.researchPlayerByAge(age);
        if (players.length === 0) {
            return res.status(404).json({ error: 'No players found with the specified age' });
        }
        res.status(200).json(players);
    } catch (err) {
        console.error('Error searching players by age:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /players/:id
router.get('/:id(\\d+)', async (req, res) => {
    const playerId = parseInt(req.params.id, 10);
    try {
        const player = await PlayerModel.getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(200).json(player);
    } catch (err) {
        console.error('Error fetching player:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/highlight/:statKey', async (req, res) => {
    try {
        const top = await PlayerModel.getTopPlayerByStat(req.params.statKey);
        if (!top) return res.status(404).json({ error: 'No data' });
        res.json(top);
    } catch (err) {
        console.error('Error fetching highlight:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// ----------------- CREATE -----------------

// POST /players
router.post(
    '/',
    upload.single('photo'),
    requireAuth,
    async (req, res) => {
        try {
            // 1. Build photo URL
            const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

            // 2. Parse passportIds if provided
            let passportIds = [];
            if (req.body.passportIds) {
                try {
                    passportIds = JSON.parse(req.body.passportIds);
                } catch {
                    return res.status(400).json({ error: 'passportIds must be a JSON array' });
                }
                if (!Array.isArray(passportIds)) {
                    return res.status(400).json({ error: 'passportIds must be an array' });
                }
            }

            // 3. Call model
            const newPlayer = await PlayerModel.createPlayer({
                gender: req.body.gender,
                last_name: req.body.last_name,
                first_name: req.body.first_name,
                birth_date: req.body.birth_date,
                height_cm: parseFloat(req.body.height_cm),
                weight_kg: parseFloat(req.body.weight_kg),
                position: req.body.position,
                photo_url: photoUrl,
                passportIds
            });

            res.status(201).json(newPlayer);
        } catch (err) {
            console.error('Error creating player:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ----------------- UPDATE INFO -----------------

// PUT /players/:id
router.put(
    '/:id(\\d+)',
    requireAuth,
    upload.single('photo'),
    async (req, res) => {
        const playerId = parseInt(req.params.id, 10);
        if (isNaN(playerId)) {
            return res.status(400).json({ error: 'Invalid player ID' });
        }
        try {
            // 1. Récupère le nouveau photo_url si y en a une
            const photoUrl = req.file
                ? `/uploads/${req.file.filename}`
                : undefined;

            // 2. Appelle le modèle en lui passant body + photoUrl
            const updated = await PlayerModel.updatePlayerInfo(playerId, {
                ...req.body,
                photo_url: photoUrl
            });

            if (!updated) {
                return res.status(404).json({ error: 'Player not found' });
            }
            res.json(updated);
        } catch (err) {
            console.error('Error updating player:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ----------------- UPDATE PASSPORTS -----------------

// PUT /players/:id/passports
router.put('/:id(\\d+)/passports', requireAuth, async (req, res) => {
    const playerId = parseInt(req.params.id, 10);
    const { passportIds } = req.body;

    if (!Array.isArray(passportIds)) {
        return res.status(400).json({ error: 'passportIds must be an array of integers' });
    }

    try {
        await PassportModel.updatePassportsByPlayerId(playerId, passportIds);
        const passports = await PassportModel.getPassportByPlayerId(playerId);
        res.json(passports);
    } catch (err) {
        console.error('Error updating passports:', err);
        if (err.message.startsWith('Invalid passport ID')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ----------------- DELETE -----------------

// DELETE /players/:id
router.delete('/:id(\\d+)', requireAuth, async (req, res) => {
    const playerId = parseInt(req.params.id, 10);
    try {
        const deletedPlayer = await PlayerModel.deletePlayer(playerId);
        if (!deletedPlayer) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting player:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
