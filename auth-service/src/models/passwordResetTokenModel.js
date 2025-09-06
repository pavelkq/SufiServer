const pool = require('../db');

async function createResetToken(userId, token, expiresAt) {
    await pool.query(
        `INSERT INTO password_reset_tokens(user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expiresAt]
    );
}

async function findValidToken(token) {
    const res = await pool.query(
        `SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
        [token]
    );
    return res.rows[0];
}

async function markTokenUsed(token) {
    await pool.query(
        `UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
        [token]
    );
}

module.exports = {
    createResetToken,
    findValidToken,
    markTokenUsed,
};
