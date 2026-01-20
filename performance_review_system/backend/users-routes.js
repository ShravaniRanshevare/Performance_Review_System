// routes/users.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users (managers/admins only)
router.get('/', authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { role, department, is_active } = req.query;
    
    let queryText = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department, 
             u.hire_date, u.is_active, u.created_at,
             m.first_name || ' ' || m.last_name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Managers can only see their direct reports
    if (req.user.role === 'manager') {
      queryText += ` AND (u.manager_id = $${++paramCount} OR u.id = $${++paramCount})`;
      params.push(req.user.id, req.user.id);
    }

    if (role) {
      queryText += ` AND u.role = $${++paramCount}`;
      params.push(role);
    }

    if (department) {
      queryText += ` AND u.department = $${++paramCount}`;
      params.push(department);
    }

    if (is_active !== undefined) {
      queryText += ` AND u.is_active = $${++paramCount}`;
      params.push(is_active === 'true');
    }

    queryText += ' ORDER BY u.last_name, u.first_name';

    const result = await query(queryText, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department,
              u.hire_date, u.is_active, u.created_at,
              m.id as manager_id, m.first_name || ' ' || m.last_name as manager_name
       FROM users u
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check access permissions
    if (req.user.role === 'employee' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'manager' && user.manager_id !== req.user.id && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ user: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/:id - Update user (admins only, or self for limited fields)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, department, manager_id, role, is_active } = req.body;

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    // Users can update their own basic info
    if (req.user.id === id) {
      if (first_name !== undefined) {
        updates.push(`first_name = $${++paramCount}`);
        params.push(first_name);
      }
      if (last_name !== undefined) {
        updates.push(`last_name = $${++paramCount}`);
        params.push(last_name);
      }
    }

    // Admins can update everything
    if (req.user.role === 'admin') {
      if (first_name !== undefined) {
        updates.push(`first_name = $${++paramCount}`);
        params.push(first_name);
      }
      if (last_name !== undefined) {
        updates.push(`last_name = $${++paramCount}`);
        params.push(last_name);
      }
      if (department !== undefined) {
        updates.push(`department = $${++paramCount}`);
        params.push(department);
      }
      if (manager_id !== undefined) {
        updates.push(`manager_id = $${++paramCount}`);
        params.push(manager_id);
      }
      if (role !== undefined) {
        updates.push(`role = $${++paramCount}`);
        params.push(role);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${++paramCount}`);
        params.push(is_active);
      }
    } else if (req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${++paramCount}
       RETURNING id, email, first_name, last_name, role, department, is_active`,
      params
    );

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Deactivate user (admins only)
router.delete('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, email',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deactivated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// GET /api/users/:id/direct-reports - Get user's direct reports
router.get('/:id/direct-reports', authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Managers can only see their own reports
    if (req.user.role === 'manager' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, role, department, hire_date, is_active
       FROM users
       WHERE manager_id = $1
       ORDER BY last_name, first_name`,
      [id]
    );

    res.json({ direct_reports: result.rows });
  } catch (error) {
    console.error('Get direct reports error:', error);
    res.status(500).json({ error: 'Failed to fetch direct reports' });
  }
});

// GET /api/users/:id/performance-summary - Get user's performance summary
router.get('/:id/performance-summary', async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (req.user.role === 'employee' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.department,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'in-progress' THEN g.id END) as in_progress_goals,
        COUNT(DISTINCT f.id) as total_feedback,
        AVG(f.rating)::numeric(3,2) as average_rating,
        COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0)::numeric(5,2) as goal_completion_score,
        (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
         COALESCE(AVG(f.rating) * 20, 0) * 0.4)::numeric(5,2) as overall_score
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      WHERE u.id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.department`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ performance_summary: result.rows[0] });
  } catch (error) {
    console.error('Get performance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

module.exports = router;