// middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data
    const result = await query(
      'SELECT id, email, first_name, last_name, role, department, manager_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Check if user can access employee data
const canAccessEmployee = async (req, res, next) => {
  const targetEmployeeId = req.params.employeeId || req.body.employee_id;
  
  if (!targetEmployeeId) {
    return res.status(400).json({ error: 'Employee ID required' });
  }

  // Admin can access all
  if (req.user.role === 'admin') {
    return next();
  }

  // Users can access their own data
  if (req.user.id === targetEmployeeId) {
    return next();
  }

  // Managers can access their direct reports
  if (req.user.role === 'manager') {
    try {
      const result = await query(
        'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
        [targetEmployeeId, req.user.id]
      );
      
      if (result.rows.length > 0) {
        return next();
      }
    } catch (error) {
      console.error('Access check error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  }

  return res.status(403).json({ error: 'Access denied to this employee data' });
};

module.exports = {
  generateToken,
  authenticateToken,
  authorizeRoles,
  canAccessEmployee
};