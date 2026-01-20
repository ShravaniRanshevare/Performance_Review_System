// routes/goals.js
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, authorizeRoles, canAccessEmployee } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/goals - Get goals (filtered by role)
router.get('/', async (req, res) => {
  try {
    const { status, employee_id } = req.query;
    
    let queryText = `
      SELECT g.*, 
             u.first_name || ' ' || u.last_name as employee_name,
             u.department
      FROM goals g
      JOIN users u ON g.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === 'employee') {
      queryText += ` AND g.employee_id = $${++paramCount}`;
      params.push(req.user.id);
    } else if (req.user.role === 'manager') {
      queryText += ` AND (g.employee_id = $${++paramCount} OR u.manager_id = $${++paramCount})`;
      params.push(req.user.id, req.user.id);
    }

    // Additional filters
    if (employee_id) {
      queryText += ` AND g.employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (status) {
      queryText += ` AND g.status = $${++paramCount}`;
      params.push(status);
    }

    queryText += ' ORDER BY g.target_date ASC, g.created_at DESC';

    const result = await query(queryText, params);
    res.json({ goals: result.rows });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GET /api/goals/:id - Get single goal
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, 
              u.first_name || ' ' || u.last_name as employee_name,
              u.department,
              c.first_name || ' ' || c.last_name as created_by_name
       FROM goals g
       JOIN users u ON g.employee_id = u.id
       LEFT JOIN users c ON g.created_by = c.id
       WHERE g.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = result.rows[0];

    // Check access permissions
    if (req.user.role === 'employee' && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ goal: goal });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// POST /api/goals - Create new goal
router.post('/', async (req, res) => {
  try {
    const {
      employee_id,
      title,
      description,
      kpi_name,
      target_value,
      unit,
      priority,
      start_date,
      target_date
    } = req.body;

    // Validation
    if (!title || !kpi_name || !target_value || !start_date || !target_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine employee_id based on role
    let finalEmployeeId = employee_id;
    if (req.user.role === 'employee') {
      finalEmployeeId = req.user.id; // Employees can only create goals for themselves
    } else if (!employee_id) {
      return res.status(400).json({ error: 'employee_id required for managers/admins' });
    }

    // Check if employee exists and user has permission
    if (req.user.role === 'manager' && finalEmployeeId !== req.user.id) {
      const empCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
        [finalEmployeeId, req.user.id]
      );
      if (empCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Cannot create goals for this employee' });
      }
    }

    const result = await query(
      `INSERT INTO goals (
        employee_id, title, description, kpi_name, target_value, 
        current_value, unit, priority, start_date, target_date, created_by
      )
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        finalEmployeeId,
        title,
        description || null,
        kpi_name,
        target_value,
        unit || null,
        priority || 'medium',
        start_date,
        target_date,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PATCH /api/goals/:id - Update goal
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      kpi_name,
      target_value,
      current_value,
      unit,
      status,
      priority,
      target_date
    } = req.body;

    // Check if goal exists and get current data
    const goalCheck = await query('SELECT * FROM goals WHERE id = $1', [id]);
    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const currentGoal = goalCheck.rows[0];

    // Check permissions
    if (req.user.role === 'employee' && currentGoal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (title !== undefined) {
      updates.push(`title = $${++paramCount}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      params.push(description);
    }
    if (kpi_name !== undefined) {
      updates.push(`kpi_name = $${++paramCount}`);
      params.push(kpi_name);
    }
    if (target_value !== undefined) {
      updates.push(`target_value = $${++paramCount}`);
      params.push(target_value);
    }
    if (current_value !== undefined) {
      updates.push(`current_value = $${++paramCount}`);
      params.push(current_value);
      
      // Track progress history
      if (current_value !== currentGoal.current_value) {
        await query(
          `INSERT INTO goal_progress_history (goal_id, previous_value, new_value, updated_by)
           VALUES ($1, $2, $3, $4)`,
          [id, currentGoal.current_value, current_value, req.user.id]
        );
      }

      // Auto-update status if target reached
      if (parseFloat(current_value) >= parseFloat(currentGoal.target_value)) {
        updates.push(`status = 'completed'`);
        updates.push(`completed_date = CURRENT_DATE`);
      }
    }
    if (unit !== undefined) {
      updates.push(`unit = $${++paramCount}`);
      params.push(unit);
    }
    if (status !== undefined) {
      updates.push(`status = $${++paramCount}`);
      params.push(status);
      if (status === 'completed') {
        updates.push(`completed_date = CURRENT_DATE`);
      }
    }
    if (priority !== undefined) {
      updates.push(`priority = $${++paramCount}`);
      params.push(priority);
    }
    if (target_date !== undefined) {
      updates.push(`target_date = $${++paramCount}`);
      params.push(target_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      params
    );

    res.json({
      message: 'Goal updated successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM goals WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// GET /api/goals/:id/progress-history - Get goal progress history
router.get('/:id/progress-history', async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, u.first_name || ' ' || u.last_name as updated_by_name
       FROM goal_progress_history h
       LEFT JOIN users u ON h.updated_by = u.id
       WHERE h.goal_id = $1
       ORDER BY h.created_at DESC`,
      [req.params.id]
    );

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get progress history error:', error);
    res.status(500).json({ error: 'Failed to fetch progress history' });
  }
});

module.exports = router;