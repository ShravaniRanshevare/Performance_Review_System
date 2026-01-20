# 🎯 Employee Performance Review System

A full-stack web application for managing employee performance reviews, goals, feedback, and analytics.

## 🌟 Features

- **Role-Based Access Control**: Employee, Manager, and Admin roles
- **Goal Tracking**: Set and monitor KPI-based goals
- **Feedback System**: Manager feedback with 1-5 ratings
- **Performance Scoring**: Automatic calculation based on goals (60%) and feedback (40%)
- **Analytics Dashboard**: Team performance metrics and insights
- **Promotion Recommendations**: Data-driven promotion suggestions

## 🛠️ Tech Stack

### Backend
- **Node.js** + Express.js
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** password hashing

### Frontend
- **React** with Hooks
- **Tailwind CSS** styling
- **Recharts** for data visualization
- **Lucide React** icons

## 🚀 Quick Start

### Try the Prototype

Open `prototype.html` in your browser to see a working demo with:
- Employee: `employee@company.com` / `employee123`
- Manager: `manager@company.com` / `manager123`
- Admin: `admin@company.com` / `admin123`

### Run Full Stack

#### Prerequisites
- Node.js 16+
- PostgreSQL 13+

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/performance-review-system.git
cd performance-review-system
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup Database**
```bash
createdb performance_review
psql -U postgres -d performance_review -f database/schema.sql
```

4. **Start Backend**
```bash
npm run dev
# Server runs on http://localhost:3000
```

5. **Setup Frontend** (if using React)
```bash
cd ../frontend
npm install
npm start
# App runs on http://localhost:5173
```

## 📊 Performance Scoring Algorithm
Overall Score = (Goal Completion × 60%) + (Feedback Rating × 40%)

**Promotion Recommendations:**
- 90%+ = Highly Recommended
- 75-89% = Recommended
- 60-74% = Consider
- <60% = Not Ready

## 📚 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

#### Goals
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal

#### Feedback
- `GET /api/feedback` - List feedback
- `POST /api/feedback` - Create feedback

#### Analytics
- `GET /api/analytics/performance-scores` - Team performance
- `GET /api/analytics/promotion-recommendations` - Promotion insights

## 🔒 Security Features

- ✅ JWT authentication
- ✅ bcrypt password hashing (10 rounds)
- ✅ Role-based authorization
- ✅ SQL injection prevention
- ✅ CORS protection
- ✅ Helmet.js security headers

## 📸 Screenshots

*Will add screenshots here after deployment*

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

[Shravani Ranshevare](https://github.com/ShravaniRanshevare?tab=repositories)

## 🙏 Acknowledgments

- Built as a demonstration of full-stack development skills
- Includes data analytics and visualization capabilities
- Production-ready architecture with security best practices
