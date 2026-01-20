# Performance Review System - Backend API Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd performance-review-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb performance_review

# Run database schema
psql -U postgres -d performance_review -f database/schema.sql

# Start development server
npm run dev
```

## 📁 Project Structure

```
performance-review-api/
├── server.js                 # Main application entry
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── goals.js             # Goal management routes
│   ├── feedback.js          # Feedback routes
│   └── analytics.js         # Analytics routes
├── database/
│   └── schema.sql           # Database schema
├── package.json
└── .env
```

## 🔐 Authentication

All API routes (except `/api/auth/login` and `/api/auth/register`) require JWT authentication.

### Headers
```
Authorization: Bearer <jwt_token>
```

### User Roles
- **employee**: Can view/manage own data
- **manager**: Can view/manage direct reports + all employee features
- **admin**: Full access to all data and features

## 📚 API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "employee",
  "department": "Engineering",
  "manager_id": "uuid" // optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee",
    "department": "Engineering"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token"
}
```

#### GET /api/auth/me
Get current user info (requires auth).

#### POST /api/auth/change-password
Change user password (requires auth).

---

### Users

#### GET /api/users
Get all users (managers/admins only).

**Query Parameters:**
- `role`: Filter by role
- `department`: Filter by department
- `is_active`: Filter by active status

#### GET /api/users/:id
Get single user by ID.

#### PATCH /api/users/:id
Update user information.

#### DELETE /api/users/:id
Deactivate user (admins only).

#### GET /api/users/:id/direct-reports
Get user's direct reports.

#### GET /api/users/:id/performance-summary
Get user's performance summary.

**Response:**
```json
{
  "performance_summary": {
    "id": "uuid",
    "name": "John Doe",
    "department": "Engineering",
    "total_goals": 5,
    "completed_goals": 3,
    "in_progress_goals": 2,
    "total_feedback": 4,
    "average_rating": 4.25,
    "goal_completion_score": 72.50,
    "overall_score": 78.00
  }
}
```

---

### Goals

#### GET /api/goals
Get goals (filtered by role).

**Query Parameters:**
- `status`: Filter by status (in-progress, completed, cancelled)
- `employee_id`: Filter by employee

#### GET /api/goals/:id
Get single goal.

#### POST /api/goals
Create new goal.

**Request Body:**
```json
{
  "employee_id": "uuid", // optional for employees
  "title": "Complete API Migration",
  "description": "Migrate all legacy APIs to REST",
  "kpi_name": "APIs Migrated",
  "target_value": 10,
  "unit": "count",
  "priority": "high",
  "start_date": "2026-01-01",
  "target_date": "2026-03-31"
}
```

#### PATCH /api/goals/:id
Update goal.

**Request Body:**
```json
{
  "current_value": 7,
  "status": "in-progress"
}
```

#### DELETE /api/goals/:id
Delete goal (managers/admins only).

#### GET /api/goals/:id/progress-history
Get goal progress history.

---

### Feedback

#### GET /api/feedback
Get feedback (filtered by role).

**Query Parameters:**
- `employee_id`: Filter by employee
- `feedback_type`: Filter by type

#### GET /api/feedback/:id
Get single feedback.

#### POST /api/feedback
Create feedback (managers/admins only).

**Request Body:**
```json
{
  "employee_id": "uuid",
  "rating": 4,
  "comments": "Excellent work on the project",
  "feedback_type": "quarterly",
  "is_private": false
}
```

#### PATCH /api/feedback/:id
Update feedback (only by creator).

#### DELETE /api/feedback/:id
Delete feedback.

#### GET /api/feedback/employee/:employeeId/summary
Get feedback summary for employee.

---

### Analytics

All analytics endpoints require manager or admin role.

#### GET /api/analytics/performance-scores
Get performance scores for all employees.

**Query Parameters:**
- `department`: Filter by department

**Response:**
```json
{
  "performance_scores": [
    {
      "id": "uuid",
      "name": "John Doe",
      "department": "Engineering",
      "total_goals": 5,
      "completed_goals": 3,
      "goal_completion_score": 72.50,
      "feedback_score": 85.00,
      "overall_score": 77.00
    }
  ]
}
```

#### GET /api/analytics/team-overview
Get team overview statistics.

#### GET /api/analytics/department-performance
Get performance by department (admins only).

#### GET /api/analytics/goal-trends
Get goal completion trends over time.

**Query Parameters:**
- `period`: 1m, 3m, 6m, 1y (default: 6m)

#### GET /api/analytics/top-performers
Get top performing employees.

**Query Parameters:**
- `limit`: Number of results (default: 10)

#### GET /api/analytics/promotion-recommendations
Get promotion recommendations.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "name": "John Doe",
      "department": "Engineering",
      "hire_date": "2021-03-10",
      "performance_score": 87.50,
      "total_goals": 5,
      "completed_goals": 4,
      "average_rating": 4.50,
      "recommendation": "recommended"
    }
  ]
}
```

Recommendation levels:
- `highly-recommended`: Score >= 90%
- `recommended`: Score >= 75%
- `consider`: Score >= 60%
- `not-ready`: Score < 60%

#### GET /api/analytics/feedback-distribution
Get feedback rating distribution.

---

## 🗄️ Database Schema

### Tables

**users**
- Authentication and user profile data
- Hierarchical structure with manager relationships

**goals**
- Employee goals with KPI tracking
- Progress tracking and status management

**feedback**
- Manager feedback with ratings
- Support for different feedback types

**kpis**
- Predefined KPI templates
- Standardized metrics

**performance_reviews**
- Formal review records
- Aggregated scores and recommendations

**goal_progress_history**
- Historical tracking of goal updates
- Audit trail for progress changes

### Indexes
Optimized indexes on:
- User lookups (email, role, manager)
- Goal queries (employee, status, dates)
- Feedback queries (employee, manager, dates)
- Review periods

### Triggers
Auto-update `updated_at` timestamps on all tables.

---

## 🔒 Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access Control**: Granular permissions
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS Protection**: Configurable origins
6. **Helmet.js**: Security headers
7. **Input Validation**: Request validation
8. **Rate Limiting**: (Recommended to add)

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 📊 Performance Scoring Algorithm

```
Overall Score = (Goal Completion Score × 0.6) + (Feedback Score × 0.4)

Goal Completion Score = Average of all goal completion percentages
Feedback Score = Average rating × 20 (converts 1-5 scale to percentage)
```

---

## 🚀 Deployment Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable SSL/TLS for database connection
- [ ] Set up production database with backups
- [ ] Configure environment variables
- [ ] Add rate limiting middleware
- [ ] Set up logging (Winston/Morgan)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (PM2, DataDog, etc.)
- [ ] Implement database migrations
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 📝 API Rate Limits (Recommended)

```javascript
// Add to server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🐛 Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## 📞 Support

For issues or questions, please contact the development team or open an issue in the repository.