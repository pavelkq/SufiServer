const db = require('../config/dbAuth');

class Group {
  static async getAllGroups() {
    const result = await db.query('SELECT id, name FROM groups ORDER BY name');
    return result.rows;
  }

  static async getGroupById(id) {
    const result = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createGroup(name, description) {
    const result = await db.query(
      'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async updateGroup(id, name, description) {
    const result = await db.query(
      'UPDATE groups SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async deleteGroup(id) {
    await db.query('DELETE FROM groups WHERE id = $1', [id]);
  }
}

module.exports = Group;
