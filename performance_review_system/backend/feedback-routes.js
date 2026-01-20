// routes/feedback.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/feedback - Get feedback
router.get('/', async (req, res) => {
  try {
    const { employee_id, feedback_type } = req.query;
    
    let queryText = `
      SELECT f.*,
             e.first_name || ' ' || e.last_name as employee_name,
             e.department as employee_department,
             m.first_name || ' ' || m.last_name as manager_name
      FROM feedback f
      JOIN users e ON f.employee_id = e.id
      JOIN users m ON f.manager_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === 'employee') {
      queryText += ` AND f.employee_id = $${++paramCount}`;
      params.push(req.user.id);
    } else if (req.user.role === 'manager') {
      queryText += ` AND (f.employee_id = $${++paramCount} OR f.manager_id = $${++paramCount} OR e.manager_id = $${++paramCount})`;
      params.push(req.user.id, req.user.id, req.user.id);
    }

    // Additional filters
    if (employee_id) {
      queryText += ` AND f.employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (feedback_type) {
      queryText += ` AND f.feedback_type = $${++paramCount}`;
      params.push(feedback_type);
    }

    queryText += ' ORDER BY f.created_at DESC';

    const result = await query(queryText, params);
    res.json({ feedback: result.rows });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/feedback/:id - Get single feedback
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT f.*,
              e.first_name || ' ' || e.last_name as employee_name,
              e.department as employee_department,
              m.first_name || ' ' || m.last_name as manager_name
       FROM feedback f
       JOIN users e ON f.employee_id = e.id
       JOIN users m ON f.manager_id = m.id
       WHERE f.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const feedback = result.rows[0];

    // Check access permissions
    if (req.user.role === 'employee' && feedback.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ feedback: feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// POST /api/feedback - Create feedback (managers/admins only)
router.post('/', authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { employee_id, rating, comments, feedback_type, is_private } = req.body;

    // Validation
    if (!employee_id || !rating || !comments) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if employee exists
    const empCheck = await query('SELECT id, manager_id FROM users WHERE id = $1', [employee_id]);
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Managers can only give feedback to their direct reports
    if (req.user.role === 'manager') {
      const employee = empCheck.rows[0];
      if (employee.manager_id !== req.user.id && employee.id !== req.user.id) {
        return res.status(403).json({ error: 'Can only provide feedback to direct reports' });
      }
    }

    const result = await query(
      `INSERT INTO feedback (employee_id, manager_id, rating, comments, feedback_type, is_private)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        employee_id,
        req.user.id,
        rating,
        comments,
        feedback_type || 'general',
        is_private || false
      ]
    );

    res.status(201).json({
      message: 'Feedback created successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// PATCH /api/feedback/:id - Update feedback (only by creator)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, feedback_type, is_private } = req.body;

    // Check if feedback exists and was created by current user
    const feedbackCheck = await query(
      'SELECT * FROM feedback WHERE id = $1 AND manager_id = $2',
      [id, req.user.id]
    );

    if (feedbackCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found or access denied' });
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updates.push(`rating = $${++paramCount}`);
      params.push(rating);
    }
    if (comments !== undefined) {
      updates.push(`comments = $${++paramCount}`);
      params.push(comments);
    }
    if (feedback_type !== undefined) {
      updates.push(`feedback_type = $${++paramCount}`);
      params.push(feedback_type);
    }
    if (is_private !== undefined) {
      updates.push(`is_private = $${++paramCount}`);
      params.push(is_private);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE feedback SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      params
    );

    res.json({
      message: 'Feedback updated successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// DELETE /api/feedback/:id - Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    // Only creator or admin can delete
    let deleteQuery;
    let params;

    if (req.user.role === 'admin') {
      deleteQuery = 'DELETE FROM feedback WHERE id = $1 RETURNING id';
      params = [req.params.id];
    } else {
      deleteQuery = 'DELETE FROM feedback WHERE id = $1 AND manager_id = $2 RETURNING id';
      params = [req.params.id, req.user.id];
    }

    const result = await query(deleteQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found or access denied' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// GET /api/feedback/employee/:employeeId/summary - Get feedback summary for employee
router.get('/employee/:employeeId/summary', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check access
    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_feedback,
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
        MIN(created_at) as first_feedback_date,
        MAX(created_at) as latest_feedback_date
       FROM feedback
       WHERE employee_id = $1`,
      [employeeId]
    );

    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Get feedback summary error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback summary' });
  }
});

module.exports = router;