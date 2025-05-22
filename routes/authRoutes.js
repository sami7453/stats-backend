// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const router = express.Router();

// POST /login/
router.post('/', async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    // Compare le mot de passe brut avec le hash stocké
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const match = await bcrypt.compare(password, hash);
    if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Génère le JWT
    const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token });
});

module.exports = router;
