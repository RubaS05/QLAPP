const db = require('../config/db');
const QueryBuilder = require('./QueryBuilder');

class LeaveRequest {
  static async create(data) {
    const queryText = `
      INSERT INTO leave_requests (
        student_id, staff_id, reason, from_date, to_date, status, response_message, attachment_path, attachment_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      data.studentId,
      data.staffId,
      data.reason,
      data.fromDate,
      data.toDate,
      data.status || 'Pending',
      data.responseMessage || '',
      data.attachmentPath || '',
      data.attachmentName || ''
    ];

    const { rows } = await db.query(queryText, params);
    const row = rows[0];

    return {
      _id: row.id,
      id: row.id,
      studentId: row.student_id,
      staffId: row.staff_id,
      reason: row.reason,
      fromDate: row.from_date,
      toDate: row.to_date,
      status: row.status,
      responseMessage: row.response_message,
      attachmentPath: row.attachment_path,
      attachmentName: row.attachment_name,
      appliedDate: row.applied_date
    };
  }

  static find(filter = {}) {
    const promise = (async () => {
      let queryText = `
        SELECT lr.*,
               s.name as student_name, s.email as student_email, s.roll_number as student_roll_number, s.department as student_department,
               st.name as staff_name, st.email as staff_email, st.department as staff_department, st.designation as staff_designation
        FROM leave_requests lr
        LEFT JOIN students s ON lr.student_id = s.id
        LEFT JOIN staffs st ON lr.staff_id = st.id
      `;
      const params = [];
      const conditions = [];

      if (filter.studentId) {
        params.push(filter.studentId);
        conditions.push(`lr.student_id = $${params.length}`);
      }

      if (filter.staffId) {
        params.push(filter.staffId);
        conditions.push(`lr.staff_id = $${params.length}`);
      }

      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$ne) {
          params.push(filter.status.$ne);
          conditions.push(`lr.status != $${params.length}`);
        } else {
          params.push(filter.status);
          conditions.push(`lr.status = $${params.length}`);
        }
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      // Default sort appliedDate: -1
      queryText += ' ORDER BY lr.applied_date DESC';

      const { rows } = await db.query(queryText, params);

      return rows.map(row => ({
        _id: row.id,
        id: row.id,
        reason: row.reason,
        fromDate: row.from_date,
        toDate: row.to_date,
        status: row.status,
        responseMessage: row.response_message,
        attachmentPath: row.attachment_path,
        attachmentName: row.attachment_name,
        appliedDate: row.applied_date,
        studentId: row.student_name ? {
          _id: row.student_id,
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          rollNumber: row.student_roll_number,
          department: row.student_department
        } : row.student_id,
        staffId: row.staff_name ? {
          _id: row.staff_id,
          id: row.staff_id,
          name: row.staff_name,
          email: row.staff_email,
          department: row.staff_department,
          designation: row.staff_designation
        } : row.staff_id
      }));
    })();

    return new QueryBuilder(promise);
  }

  static findById(id) {
    const promise = (async () => {
      if (!id) return null;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) return null;

      const queryText = `
        SELECT lr.*,
               s.name as student_name, s.email as student_email, s.roll_number as student_roll_number, s.department as student_department
        FROM leave_requests lr
        LEFT JOIN students s ON lr.student_id = s.id
        WHERE lr.id = $1
      `;
      const { rows } = await db.query(queryText, [parsedId]);
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
          rollNumber: row.student_roll_number,
          department: row.student_department
        } : row.student_id,
        staffId: row.staff_id,
        reason: row.reason,
        fromDate: row.from_date,
        toDate: row.to_date,
        status: row.status,
        responseMessage: row.response_message,
        attachmentPath: row.attachment_path,
        attachmentName: row.attachment_name,
        appliedDate: row.applied_date,
        save: async function() {
          await db.query(
            'UPDATE leave_requests SET status = $1, response_message = $2 WHERE id = $3',
            [this.status, this.responseMessage || '', this.id]
          );
        }
      };
    })();

    return new QueryBuilder(promise);
  }
}

module.exports = LeaveRequest;
