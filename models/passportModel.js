const pool = require('../db/pools');

class PassportModel {

    // ----------------- READ -----------------

    static async getAllPassports() {
        const result = await pool.query('SELECT * FROM passport');
        return result.rows;
    }

    static async getPassportById(id) {
        const result = await pool.query('SELECT * FROM passport WHERE id_passport = $1', [id]);
        return result.rows[0];
    }

    static async getPassportByPlayerId(playerId) {
        const result = await pool.query(
            `SELECT ps.id_passport,
                  ps.country,
                  ps.code_iso
             FROM passport ps
             JOIN player_passport pp
               ON ps.id_passport = pp.passport_id
            WHERE pp.player_id = $1
         ORDER BY ps.country;`,
            [playerId]
        );
        return result.rows;
    }

    // ------------------ RESEARCH -----------------

    static async researchPassportByCountry(country) {
        const result = await pool.query('SELECT * FROM passport WHERE country LIKE $1', [`%${country}%`]);
        return result.rows;
    }

    // ------------------ UPDATE -----------------

    static async updatePassportsByPlayerId(playerId, passportIds) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `DELETE FROM player_passport
               WHERE player_id = $1;`,
                [playerId]
            );

            if (passportIds.length > 0) {
                // valider l'existence
                const { rows: valid } = await client.query(
                    `SELECT id_passport
                 FROM passport
                WHERE id_passport = ANY($1);`,
                    [passportIds]
                );
                const validIds = new Set(valid.map(r => r.id_passport));
                const invalid = passportIds.filter(id => !validIds.has(id));
                if (invalid.length) {
                    throw new Error(`Invalid passport ID(s): ${invalid.join(', ')}`);
                }

                const placeholders = passportIds
                    .map((_, i) => `($1, $${i + 2})`)
                    .join(',');
                await client.query(
                    `INSERT INTO player_passport(player_id, passport_id)
               VALUES ${placeholders};`,
                    [playerId, ...passportIds]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

}

module.exports = PassportModel;