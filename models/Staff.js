const db = require('../config/db');
const bcrypt = require('bcryptjs');
const QueryBuilder = require('./QueryBuilder');

class Staff {
  static findOne(query = {}) {
    const promise = (async () => {
      if (!query.email) return null;

      const { rows } = await db.query('SELECT * FROM staffs WHERE email = $1', [query.email.toLowerCase()]);
      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        department: row.department,
        designation: row.designation,
        createdAt: row.created_at,
        matchPassword: async function (enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.password);
        }
      };
    })();

    return new QueryBuilder(promise);
  }

  static findById(id) {
    const promise = (async () => {
      if (!id) return null;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) return null;

      const { rows } = await db.query('SELECT * FROM staffs WHERE id = $1', [parsedId]);
      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        department: row.department,
        designation: row.designation,
        createdAt: row.created_at,
        matchPassword: async function (enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.password);
        }
      };
    })();

    return new QueryBuilder(promise);
  }

  static find(queryObj = {}) {
    const promise = (async () => {
      const { rows } = await db.query('SELECT * FROM staffs');
      return rows.map(row => ({
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        department: row.department,
        designation: row.designation,
        createdAt: row.created_at
      }));
    })();

    return new QueryBuilder(promise);
  }

  static async create({ name, email, password, department, designation }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const queryText = `
      INSERT INTO staffs (name, email, password, department, designation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [name, email.toLowerCase(), hashedPassword, department, designation];

    const { rows } = await db.query(queryText, params);
    const row = rows[0];
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      department: row.department,
      designation: row.designation,
      createdAt: row.created_at
    };
  }
}

module.exports = Staff;
