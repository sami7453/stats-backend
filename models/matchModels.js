const pool = require('../db/pools');

class MatchModel {

    // ----------------- READ -----------------

    static async getAllMatches() {
        const result = await pool.query('SELECT * FROM matches');
        return result.rows;
    }

    static async getMatchById(id) {
        const result = await pool.query('SELECT * FROM matches WHERE id_match = $1', [id]);
        return result.rows[0];
    }

    static async getMatchesByPlayerId(playerId) {
        const result = await pool.query(
            `
          SELECT
            m.id_match,
            m.match_date,
            m.opponent,
            m.our_score,
            m.opponent_score,
            m.score
          FROM matches m
          JOIN player_stats ps
            ON m.id_match = ps.match_id
          WHERE ps.player_id = $1
          ORDER BY m.match_date;
          `,
            [playerId]
        );
        return result.rows;
    }

    static async getLastMatch() {
        const result = await pool.query(
            `SELECT
         id_match,
         match_date,
         opponent,
         our_score,
         opponent_score,
         CONCAT(our_score, '-', opponent_score) AS score
       FROM matches
       ORDER BY match_date DESC
       LIMIT 1`
        );
        return result.rows[0];
    }

    // ----------------- CREATE -----------------

    static async createMatch(matchData) {
        const { match_date, opponent, our_score, opponent_score } = matchData;
        const result = await pool.query(
            'INSERT INTO matches (match_date, opponent, our_score, opponent_score) VALUES ($1, $2, $3, $4) RETURNING *',
            [match_date, opponent, our_score, opponent_score]
        );
        return result.rows[0];
    }

    // ------------------ UPDATE -----------------

    static async updateMatch(id, matchData) {
        const { match_date, opponent, our_score, opponent_score } = matchData;
        const result = await pool.query(
            'UPDATE matches SET match_date = $1, opponent = $2, our_score = $3, opponent_score = $4 WHERE id_match = $5 RETURNING *',
            [match_date, opponent, our_score, opponent_score, id]
        );
        return result.rows[0];
    }

    // ------------------ DELETE -----------------

    static async deleteMatch(id) {
        const result = await pool.query('DELETE FROM matches WHERE id_match = $1 RETURNING *', [id]);
        return result.rows[0];
    }

}


module.exports = MatchModel;