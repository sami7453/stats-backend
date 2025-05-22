const express = require('express');
const router = express.Router();
const PassportModel = require('../models/passportModel');

router.get('/', async (req, res) => {
    try {
        const passports = await PassportModel.getAllPassports();
        res.status(200).json(passports);
    } catch (error) {
        console.error('Error fetching passports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    const passportId = parseInt(req.params.id, 10);
    if (isNaN(passportId)) {
        return res.status(400).json({ error: 'Invalid passport ID' });
    }
    try {
        const passport = await PassportModel.getPassportById(passportId);
        if (!passport) {
            return res.status(404).json({ error: 'Passport not found' });
        }
        res.status(200).json(passport);
    } catch (error) {
        console.error('Error fetching passport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/research/:country', async (req, res) => {
    const country = req.params.country;
    if (!country) {
        return res.status(400).json({ error: 'Country parameter is required' });
    }
    try {
        const passports = await PassportModel.researchPassportByCountry(country);
        if (passports.length === 0) {
            return res.status(404).json({ error: 'No passports found for this country' });
        }
        res.status(200).json(passports);
    } catch (err) {
        console.error('Error fetching passports:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/player/:playerId', async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: 'Invalid player ID' });
    }
    try {
        const passports = await PassportModel.getPassportByPlayerId(playerId);
        if (passports.length === 0) {
            return res.status(404).json({ error: 'No passports found for this player' });
        }
        res.status(200).json(passports);
    } catch (err) {
        console.error('Error fetching passports:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
