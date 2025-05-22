const pool = require('../db/pools');

class StatsModel {

    // ----------------- READ -----------------

    static async getAllStats() {
        const result = await pool.query('SELECT * FROM player_stats');
        return result.rows;
    }

    static async getStatsById(id) {
        const result = await pool.query('SELECT * FROM player_stats WHERE id_stats = $1', [id]);
        return result.rows[0];
    }

    static async getAverageStatsByPlayerId(id) {
        const result = await pool.query(
            `
          SELECT
            ROUND(AVG(player_load), 1)                    AS avg_player_load,
            ROUND(AVG(distance_covered_km), 1)            AS avg_distance_covered_km,
            ROUND(AVG(possession_count), 1)               AS avg_possession_count,
            ROUND(AVG(sprints), 1)                        AS avg_sprints,
            ROUND(AVG(sprint_distance_m), 1)              AS avg_sprint_distance_m,
            ROUND(AVG(max_speed_kmh), 1)                  AS avg_max_speed_kmh,
            ROUND(AVG(low_intensity_percent), 1)          AS avg_low_intensity_percent,
            ROUND(AVG(medium_intensity_percent), 1)       AS avg_medium_intensity_percent,
            ROUND(AVG(high_intensity_percent), 1)         AS avg_high_intensity_percent,
            ROUND(AVG(passes), 1)                         AS avg_passes,
            ROUND(AVG(shots), 1)                          AS avg_shots,
            ROUND(AVG(avg_shot_speed_kmh), 1)             AS avg_avg_shot_speed_kmh,
            ROUND(AVG(max_shot_speed_kmh), 1)             AS avg_max_shot_speed_kmh
          FROM player_stats
          WHERE player_id = $1;
          `,
            [id]
        );
        return result.rows[0];
    }

    // ----------------- CREATE -----------------

    static async createStats(playerId, stats) {
        const {
            match_id,
            player_load,
            distance_covered_km,
            possession_count,
            sprints,
            sprint_distance_m,
            max_speed_kmh,
            low_intensity_percent,
            medium_intensity_percent,
            high_intensity_percent,
            passes,
            shots,
            avg_shot_speed_kmh,
            max_shot_speed_kmh
        } = stats;

        const result = await pool.query(
            `INSERT INTO player_stats (
             player_id, match_id, player_load, distance_covered_km,
             possession_count, sprints, sprint_distance_m, max_speed_kmh,
             low_intensity_percent, medium_intensity_percent,
             high_intensity_percent, passes, shots,
             avg_shot_speed_kmh, max_shot_speed_kmh
           )
           VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
           )
           RETURNING *;`,
            [
                playerId,
                match_id,
                player_load,
                distance_covered_km,
                possession_count,
                sprints,
                sprint_distance_m,
                max_speed_kmh,
                low_intensity_percent,
                medium_intensity_percent,
                high_intensity_percent,
                passes,
                shots,
                avg_shot_speed_kmh,
                max_shot_speed_kmh
            ]
        );
        return result.rows[0];
    }

    // ----------------- UPDATE -----------------

    static async updateStats(id, stats) {
        const {
            match_id,
            player_load,
            distance_covered_km,
            possession_count,
            sprints,
            sprint_distance_m,
            max_speed_kmh,
            low_intensity_percent,
            medium_intensity_percent,
            high_intensity_percent,
            passes,
            shots,
            avg_shot_speed_kmh,
            max_shot_speed_kmh
        } = stats;

        const result = await pool.query(
            `UPDATE player_stats
             SET match_id                 = $1,
                 player_load              = $2,
                 distance_covered_km      = $3,
                 possession_count         = $4,
                 sprints                  = $5,
                 sprint_distance_m        = $6,
                 max_speed_kmh            = $7,
                 low_intensity_percent    = $8,
                 medium_intensity_percent = $9,
                 high_intensity_percent   = $10,
                 passes                   = $11,
                 shots                    = $12,
                 avg_shot_speed_kmh       = $13,
                 max_shot_speed_kmh       = $14
           WHERE id_stats = $15
           RETURNING *;`,
            [
                match_id,
                player_load,
                distance_covered_km,
                possession_count,
                sprints,
                sprint_distance_m,
                max_speed_kmh,
                low_intensity_percent,
                medium_intensity_percent,
                high_intensity_percent,
                passes,
                shots,
                avg_shot_speed_kmh,
                max_shot_speed_kmh,
                id
            ]
        );
        return result.rows[0];
    }

    // ------------------ RESEARCH -----------------

    static async researchStatsByPlayerId(Id) {
        const result = await pool.query('SELECT * FROM player_stats WHERE player_id = $1', [Id]);
        return result.rows;
    }

}

module.exports = StatsModel;