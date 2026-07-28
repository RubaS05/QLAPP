const db = require('../config/db');
const bcrypt = require('bcryptjs');
const QueryBuilder = require('./QueryBuilder');

class Student {
  static findOne(query = {}) {
    const promise = (async () => {
      let queryText = '';
      let params = [];

      if (query.email) {
        queryText = 'SELECT * FROM students WHERE email = $1';
        params = [query.email.toLowerCase()];
      } else if (query.rollNumber) {
        queryText = 'SELECT * FROM students WHERE roll_number = $1';
        params = [query.rollNumber];
      } else {
        return null;
      }

      const { rows } = await db.query(queryText, params);
      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        rollNumber: row.roll_number,
        department: row.department,
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

      const { rows } = await db.query('SELECT * FROM students WHERE id = $1', [parsedId]);
      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        rollNumber: row.roll_number,
        department: row.department,
        createdAt: row.created_at,
        matchPassword: async function (enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.password);
        }
      };
    })();

    return new QueryBuilder(promise);
  }

  static async create({ name, email, password, rollNumber, department }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const queryText = `
      INSERT INTO students (name, email, password, roll_number, department)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [name, email.toLowerCase(), hashedPassword, rollNumber, department];

    const { rows } = await db.query(queryText, params);
    const row = rows[0];
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      rollNumber: row.roll_number,
      department: row.department,
      createdAt: row.created_at
    };
  }
}

module.exports = Student;
