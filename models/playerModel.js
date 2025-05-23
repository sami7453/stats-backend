const pool = require('../db/pools');

class PlayerModel {

  // ----------------- READ -----------------

  static async getAllPlayers() {
    const { rows } = await pool.query(`
    SELECT
      p.id_player,
      p.gender,
      p.last_name,
      p.first_name,
      p.birth_date,
      p.height_cm,
      p.weight_kg,
      p.position,
      p.youtube_url,
      p.photo_url,
      -- agrégation JSON des passeports
      COALESCE(
        json_agg(
          json_build_object(
            'id_passport', ps.id_passport,
            'country',     ps.country,
            'code_iso',    ps.code_iso
          )
        ) FILTER (WHERE ps.id_passport IS NOT NULL),
        '[]'
      ) AS passports
    FROM player p
    LEFT JOIN player_passport pp
      ON p.id_player = pp.player_id
    LEFT JOIN passport ps
      ON pp.passport_id = ps.id_passport
    GROUP BY p.id_player
    ORDER BY p.last_name, p.first_name;
  `);
    return rows;
  }


  static async getPlayerById(id) {
    const result = await pool.query('SELECT * FROM player WHERE id_player = $1', [id]);
    return result.rows[0];
  }

  // ----------------- CREATE -----------------

  static async createPlayer(player) {
    const {
      gender,
      last_name,
      first_name,
      birth_date,
      height_cm,
      weight_kg,
      position,
      photo_url,
      youtube_url,
      passportIds = []
    } = player;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertPlayerText = `
            INSERT INTO player
              (gender, last_name, first_name, birth_date,
               height_cm, weight_kg, position, photo_url, youtube_url)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING id_player, gender, last_name, first_name,
                      birth_date, height_cm, weight_kg,
                      position, photo_url, youtube_url
          `;
      const insertPlayerValues = [
        gender,
        last_name,
        first_name,
        birth_date,
        height_cm,
        weight_kg,
        position,
        photo_url,
        youtube_url
      ];
      const playerRes = await client.query(insertPlayerText, insertPlayerValues);
      const newPlayer = playerRes.rows[0];

      if (passportIds.length > 0) {
        const placeholders = passportIds
          .map((_, idx) => `($1, $${idx + 2})`)
          .join(', ');
        const assocText = `
              INSERT INTO player_passport (player_id, passport_id)
              VALUES ${placeholders}
            `;
        const assocValues = [newPlayer.id_player, ...passportIds];
        await client.query(assocText, assocValues);
      }

      await client.query('COMMIT');
      return newPlayer;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getTopPlayerByStat(statKey) {
    // liste blanche des champs autorisés
    const valid = [
      'player_load',
      'distance_covered_km',
      'possession_count',
      'sprints',
      'sprint_distance_m',
      'max_speed_kmh',
      'low_intensity_percent',
      'medium_intensity_percent',
      'high_intensity_percent',
      'passes',
      'shots',
      'avg_shot_speed_kmh',
      'max_shot_speed_kmh'
    ];
    if (!valid.includes(statKey)) {
      throw new Error('Invalid stat key');
    }
    const result = await pool.query(
      `SELECT
         p.id_player,
         p.first_name,
         p.last_name,
         ROUND(AVG(s.${statKey}), 1) AS average
       FROM player_stats s
       JOIN player p ON s.player_id = p.id_player
       GROUP BY p.id_player, p.first_name, p.last_name
       ORDER BY average DESC
       LIMIT 1`
    );
    return result.rows[0];
  }

  // ------------------ UPDATE -----------------

  // PUT /players/:id
  static async updatePlayerInfo(id, data) {
    const {
      gender,
      last_name,
      first_name,
      birth_date,
      height_cm,
      weight_kg,
      position,
      youtube_url = null, // Valeur par défaut explicite
      photo_url,          // Optionnel
      passportIds         // Optionnel
    } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Construction dynamique de la requête UPDATE
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Liste des champs à mettre à jour (sauf photo_url géré séparément)
      const fieldMappings = [
        { field: 'gender', value: gender },
        { field: 'last_name', value: last_name },
        { field: 'first_name', value: first_name },
        { field: 'birth_date', value: birth_date },
        { field: 'height_cm', value: height_cm },
        { field: 'weight_kg', value: weight_kg },
        { field: 'position', value: position },
        { field: 'youtube_url', value: youtube_url }
      ];

      fieldMappings.forEach(({ field, value }) => {
        if (value !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      // Ajout conditionnel de photo_url
      if (photo_url !== undefined) {
        updateFields.push(`photo_url = $${paramIndex}`);
        values.push(photo_url);
        paramIndex++;
      }

      // Exécution de la mise à jour
      if (updateFields.length > 0) {
        const updateText = `
                UPDATE player 
                SET ${updateFields.join(', ')} 
                WHERE id_player = $${paramIndex}
                RETURNING *`;

        const updateRes = await client.query(updateText, [...values, id]);
        if (updateRes.rowCount === 0) {
          throw new Error('Player not found');
        }
      }

      // 2. Gestion des passeports (si fournis)
      if (Array.isArray(passportIds)) {
        await client.query('BEGIN');

        // Suppression des anciennes associations
        await client.query(
          'DELETE FROM player_passport WHERE player_id = $1',
          [id]
        );

        // Création des nouvelles associations (si nécessaire)
        if (passportIds.length > 0) {
          const placeholders = passportIds
            .map((_, i) => `($1, $${i + 2})`)
            .join(', ');

          await client.query(
            `INSERT INTO player_passport (player_id, passport_id)
                     VALUES ${placeholders}`,
            [id, ...passportIds]
          );
        }
      }

      await client.query('COMMIT');

      // 3. Récupération du joueur mis à jour
      const { rows } = await client.query(
        'SELECT * FROM player WHERE id_player = $1',
        [id]
      );

      return rows[0];

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Update error:', err);
      throw err;
    } finally {
      client.release();
    }
  }


  // ------------------ DELETE -----------------

  static async deletePlayer(playerId) {
    const result = await pool.query(
      `DELETE FROM player
             WHERE id_player = $1
           RETURNING *;`,
      [playerId]
    );
    return result.rows[0];
  }

  // ------------------ RESEARCH -----------------

  static async researchPlayerByAge(age) {
    const query = `
    SELECT
      p.*,
      DATE_PART('year', AGE(p.birth_date)) AS calculated_age,
      COALESCE(
        json_agg(
          json_build_object(
            'id_passport', ps.id_passport,
            'country',     ps.country,
            'code_iso',    ps.code_iso
          )
        ) FILTER (WHERE ps.id_passport IS NOT NULL),
        '[]'
      ) AS passports
    FROM player p
    LEFT JOIN player_passport pp ON p.id_player = pp.player_id
    LEFT JOIN passport ps ON pp.passport_id = ps.id_passport
    WHERE p.birth_date BETWEEN 
      (CURRENT_DATE - $1 * INTERVAL '1 year' - INTERVAL '1 year' + INTERVAL '1 day')
      AND (CURRENT_DATE - $1 * INTERVAL '1 year')
    GROUP BY p.id_player
    ORDER BY p.last_name, p.first_name;
  `;
    const result = await pool.query(query, [age]);
    return result.rows;
  }

  static async researchPlayerByPosition(position) {
    const query = `
    SELECT
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id_passport', ps.id_passport,
            'country',     ps.country,
            'code_iso',    ps.code_iso
          )
        ) FILTER (WHERE ps.id_passport IS NOT NULL),
        '[]'
      ) AS passports
    FROM player p
    LEFT JOIN player_passport pp ON p.id_player = pp.player_id
    LEFT JOIN passport ps ON pp.passport_id = ps.id_passport
    WHERE p.position ILIKE '%' || $1 || '%'
    GROUP BY p.id_player
    ORDER BY p.last_name, p.first_name;
  `;
    const result = await pool.query(query, [position]);
    return result.rows;
  }

  // models/playerModel.js
  static async researchPlayerByPassport(country) {
    const result = await pool.query(`
    SELECT p.*,
           json_agg(
             json_build_object(
               'id_passport', ps.id_passport,
               'country',     ps.country,
               'code_iso',    ps.code_iso
             )
           ) AS passports
      FROM player p
      JOIN player_passport pp ON p.id_player = pp.player_id
      JOIN passport ps        ON pp.passport_id = ps.id_passport
     WHERE ps.country ILIKE '%' || $1 || '%'
     GROUP BY p.id_player
     ORDER BY p.last_name, p.first_name;
  `, [country]);
    return result.rows;
  }

}

module.exports = PlayerModel;








