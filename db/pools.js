// db/pools.js
const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd
        ? { rejectUnauthorized: false }  // Railway (prod) : SSL
        : false                          // Local : pas de SSL
});

module.exports = pool;
