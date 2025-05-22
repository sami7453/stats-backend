// index.js
const express = require("express");
const cors = require("cors");
const path = require('path');
require("dotenv").config();

const app = express();

// 1) Middlewares globaux
app.use(cors());
app.use(express.json());

// 2) Authentification (nouveau)
//    → routes/authRoutes.js doit exporter un router définissant POST '/' 
//      pour se loguer
const authRoutes = require('./routes/authRoutes');
app.use('/login', authRoutes);

// 3) Tes routes existantes
//    • stats imbriquées sous /players/:playerId
app.use(
    '/players/:playerId/stats',
    require('./routes/statsRoutes')
);
//    • stats globales
app.use(
    '/stats',
    require('./routes/statsRoutes')
);
//    • CRUD joueurs, passeports, matchs
app.use('/players', require('./routes/playerRoutes'));
app.use('/passports', require('./routes/passportRoutes'));
app.use('/matches', require('./routes/matchRoutes'));

// 4) Dossier pour les images uploadées
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
