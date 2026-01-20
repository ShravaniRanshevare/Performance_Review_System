// routes/analytics.js
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require manager or admin role
router.use(authenticateToken);
router.use(authorizeRoles('manager', 'admin'));

// GET /api/analytics/performance-scores - Get performance scores for all employees
router.get('/performance-scores', async (req, res) => {
  try {
    const { department } = req.query;
    
    let whereClause = "WHERE u.role = 'employee'";
    const params = [];
    let paramCount = 0;

    if (department) {
      whereClause += ` AND u.department = $${++paramCount}`;
      params.push(department);
    }

    // If manager, only show their direct reports
    if (req.user.role === 'manager') {
      whereClause += ` AND u.manager_id = $${++paramCount}`;
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.department,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0)::numeric(5,2) as goal_completion_score,
        COALESCE(AVG(f.rating) * 20, 0)::numeric(5,2) as feedback_score,
        (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
         COALESCE(AVG(f.rating) * 20, 0) * 0.4)::numeric(5,2) as overall_score
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.department
      ORDER BY overall_score DESC`,
      params
    );

    res.json({ performance_scores: result.rows });
  } catch (error) {
    console.error('Get performance scores error:', error);
    res.status(500).json({ error: 'Failed to fetch performance scores' });
  }
});

// GET /api/analytics/team-overview - Get team overview statistics
router.get('/team-overview', async (req, res) => {
  try {
    let managerFilter = '';
    const params = [];
    
    if (req.user.role === 'manager') {
      managerFilter = 'AND u.manager_id = $1';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        COUNT(DISTINCT u.id) as total_employees,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'in-progress' THEN g.id END) as in_progress_goals,
        COUNT(DISTINCT f.id) as total_feedback,
        AVG(f.rating)::numeric(3,2) as average_rating,
        COUNT(DISTINCT CASE WHEN g.target_date < CURRENT_DATE AND g.status != 'completed' THEN g.id END) as overdue_goals
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      WHERE u.role = 'employee' ${managerFilter}`,
      params
    );

    res.json({ overview: result.rows[0] });
  } catch (error) {
    console.error('Get team overview error:', error);
    res.status(500).json({ error: 'Failed to fetch team overview' });
  }
});

// GET /api/analytics/department-performance - Get performance by department
router.get('/department-performance', authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        u.department,
        COUNT(DISTINCT u.id) as employee_count,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        (COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END)::float / 
         NULLIF(COUNT(DISTINCT g.id), 0) * 100)::numeric(5,2) as completion_rate,
        AVG(f.rating)::numeric(3,2) as average_rating
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      WHERE u.role = 'employee' AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY completion_rate DESC`
    );

    res.json({ departments: result.rows });
  } catch (error) {
    console.error('Get department performance error:', error);
    res.status(500).json({ error: 'Failed to fetch department performance' });
  }
});

// GET /api/analytics/goal-trends - Get goal completion trends over time
router.get('/goal-trends', async (req, res) => {
  try {
    const { period = '6m' } = req.query; // 1m, 3m, 6m, 1y
    
    let dateFilter;
    switch(period) {
      case '1m': dateFilter = "INTERVAL '1 month'"; break;
      case '3m': dateFilter = "INTERVAL '3 months'"; break;
      case '6m': dateFilter = "INTERVAL '6 months'"; break;
      case '1y': dateFilter = "INTERVAL '1 year'"; break;
      default: dateFilter = "INTERVAL '6 months'";
    }

    let managerFilter = '';
    const params = [];
    
    if (req.user.role === 'manager') {
      managerFilter = 'AND u.manager_id = $1';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        DATE_TRUNC('month', g.created_at) as month,
        COUNT(g.id) as goals_created,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as goals_completed
      FROM goals g
      JOIN users u ON g.employee_id = u.id
      WHERE g.created_at >= CURRENT_DATE - ${dateFilter} ${managerFilter}
      GROUP BY DATE_TRUNC('month', g.created_at)
      ORDER BY month ASC`,
      params
    );

    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Get goal trends error:', error);
    res.status(500).json({ error: 'Failed to fetch goal trends' });
  }
});

// GET /api/analytics/top-performers - Get top performing employees
router.get('/top-performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    let managerFilter = '';
    const params = [limit];
    
    if (req.user.role === 'manager') {
      managerFilter = 'AND u.manager_id = $2';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.department,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        (COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END)::float / 
         NULLIF(COUNT(DISTINCT g.id), 0) * 100)::numeric(5,2) as completion_rate,
        AVG(f.rating)::numeric(3,2) as average_rating,
        (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
         COALESCE(AVG(f.rating) * 20, 0) * 0.4)::numeric(5,2) as performance_score
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      WHERE u.role = 'employee' ${managerFilter}
      GROUP BY u.id, u.first_name, u.last_name, u.department
      HAVING COUNT(DISTINCT g.id) > 0
      ORDER BY performance_score DESC
      LIMIT $1`,
      params
    );

    res.json({ top_performers: result.rows });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// GET /api/analytics/promotion-recommendations - Get promotion recommendations
router.get('/promotion-recommendations', async (req, res) => {
  try {
    let managerFilter = '';
    const params = [];
    
    if (req.user.role === 'manager') {
      managerFilter = 'AND u.manager_id = $1';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.department,
        u.hire_date,
        (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
         COALESCE(AVG(f.rating) * 20, 0) * 0.4)::numeric(5,2) as performance_score,
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
        AVG(f.rating)::numeric(3,2) as average_rating,
        CASE 
          WHEN (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
                COALESCE(AVG(f.rating) * 20, 0) * 0.4) >= 90 THEN 'highly-recommended'
          WHEN (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
                COALESCE(AVG(f.rating) * 20, 0) * 0.4) >= 75 THEN 'recommended'
          WHEN (COALESCE(AVG(CASE WHEN g.status = 'completed' THEN 100 ELSE (g.current_value / NULLIF(g.target_value, 0) * 100) END), 0) * 0.6 + 
                COALESCE(AVG(f.rating) * 20, 0) * 0.4) >= 60 THEN 'consider'
          ELSE 'not-ready'
        END as recommendation
      FROM users u
      LEFT JOIN goals g ON u.id = g.employee_id
      LEFT JOIN feedback f ON u.id = f.employee_id
      WHERE u.role = 'employee' ${managerFilter}
      GROUP BY u.id, u.first_name, u.last_name, u.department, u.hire_date
      HAVING COUNT(DISTINCT g.id) > 0
      ORDER BY performance_score DESC`,
      params
    );

    res.json({ recommendations: result.rows });
  } catch (error) {
    console.error('Get promotion recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion recommendations' });
  }
});

// GET /api/analytics/feedback-distribution - Get feedback rating distribution
router.get('/feedback-distribution', async (req, res) => {
  try {
    let managerFilter = '';
    const params = [];
    
    if (req.user.role === 'manager') {
      managerFilter = 'AND u.manager_id = $1';
      params.push(req.user.id);
    }

    const result = await query(
      `SELECT 
        f.rating,
        COUNT(*) as count
      FROM feedback f
      JOIN users u ON f.employee_id = u.id
      WHERE 1=1 ${managerFilter}
      GROUP BY f.rating
      ORDER BY f.rating DESC`,
      params
    );

    res.json({ distribution: result.rows });
  } catch (error) {
    console.error('Get feedback distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback distribution' });
  }
});

module.exports = router;