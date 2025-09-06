const db = require('../config/dbAuth');

class Resource {
  static async getAllResources() {
    const result = await db.query('SELECT * FROM resources ORDER BY id');
    return result.rows;
  }

  static async getResourceById(id) {
    const result = await db.query('SELECT * FROM resources WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createResource(name, type, description) {
    const result = await db.query(
      'INSERT INTO resources (name, type, description) VALUES ($1, $2, $3) RETURNING *',
      [name, type, description]
    );
    return result.rows[0];
  }

  static async updateResource(id, name, type, description) {
    const result = await db.query(
      'UPDATE resources SET name = $1, type = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, type, description, id]
    );
    return result.rows[0];
  }

  static async deleteResource(id) {
    await db.query('DELETE FROM resources WHERE id = $1', [id]);
  }
}

module.exports = Resource;
