const db = require('../config/db');
const QueryBuilder = require('./QueryBuilder');

class Payment {
  static async create(data) {
    const queryText = `
      INSERT INTO payments (student_id, amount, currency, description, stripe_session_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.studentId,
      data.amount,
      data.currency || 'usd',
      data.description,
      data.stripeSessionId,
      data.status || 'pending'
    ];

    const { rows } = await db.query(queryText, params);
    const row = rows[0];
    return {
      _id: row.id,
      id: row.id,
      studentId: row.student_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      description: row.description,
      stripeSessionId: row.stripe_session_id,
      status: row.status,
      createdAt: row.created_at
    };
  }

  static findOne(query = {}) {
    const promise = (async () => {
      if (!query.stripeSessionId) return null;

      const queryText = `
        SELECT p.*,
               s.name as student_name, s.email as student_email, s.roll_number as student_roll_number
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.id
        WHERE p.stripe_session_id = $1
      `;
      const { rows } = await db.query(queryText, [query.stripeSessionId]);
      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        studentId: row.student_name ? {
          _id: row.student_id,
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          rollNumber: row.student_roll_number
        } : row.student_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        description: row.description,
        stripeSessionId: row.stripe_session_id,
        status: row.status,
        createdAt: row.created_at,
        save: async function() {
          await db.query(
            'UPDATE payments SET status = $1 WHERE id = $2',
            [this.status, this.id]
          );
        }
      };
    })();

    return new QueryBuilder(promise);
  }

  static find(filter = {}) {
    const promise = (async () => {
      let queryText = 'SELECT * FROM payments';
      const params = [];
      const conditions = [];

      if (filter.studentId) {
        params.push(filter.studentId);
        conditions.push(`student_id = $${params.length}`);
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      queryText += ' ORDER BY created_at DESC';

      const { rows } = await db.query(queryText, params);
      return rows.map(row => ({
        _id: row.id,
        id: row.id,
        studentId: row.student_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        description: row.description,
        stripeSessionId: row.stripe_session_id,
        status: row.status,
        createdAt: row.created_at
      }));
    })();

    return new QueryBuilder(promise);
  }
}

module.exports = Payment;
