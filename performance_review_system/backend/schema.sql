-- Database Schema for Performance Review System
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
    department VARCHAR(100),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    kpi_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT NOT NULL,
    feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'quarterly', 'annual', 'project')),
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- KPIs Table (for tracking different types of KPIs)
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Reviews Table
CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    overall_score DECIMAL(5, 2),
    goal_completion_score DECIMAL(5, 2),
    feedback_score DECIMAL(5, 2),
    promotion_recommendation VARCHAR(50) CHECK (promotion_recommendation IN ('highly-recommended', 'recommended', 'consider', 'not-ready')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goal Progress History (for tracking changes over time)
CREATE TABLE goal_progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    previous_value DECIMAL(10, 2),
    new_value DECIMAL(10, 2) NOT NULL,
    updated_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_department ON users(department);

CREATE INDEX idx_goals_employee ON goals(employee_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date);

CREATE INDEX idx_feedback_employee ON feedback(employee_id);
CREATE INDEX idx_feedback_manager ON feedback(manager_id);
CREATE INDEX idx_feedback_created ON feedback(created_at);

CREATE INDEX idx_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_reviews_period ON performance_reviews(review_period_start, review_period_end);

CREATE INDEX idx_progress_goal ON goal_progress_history(goal_id);
CREATE INDEX idx_progress_created ON goal_progress_history(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data
INSERT INTO users (email, password_hash, first_name, last_name, role, department, hire_date) VALUES
('admin@company.com', '$2b$10$hash1', 'Carol', 'White', 'admin', 'Leadership', '2020-01-15'),
('manager@company.com', '$2b$10$hash2', 'Bob', 'Smith', 'manager', 'Engineering', '2020-06-01'),
('employee1@company.com', '$2b$10$hash3', 'Alice', 'Johnson', 'employee', 'Engineering', '2021-03-10'),
('employee2@company.com', '$2b$10$hash4', 'David', 'Lee', 'employee', 'Engineering', '2021-09-20');

-- Update manager relationships
UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'admin@company.com') 
WHERE email = 'manager@company.com';

UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'manager@company.com') 
WHERE email IN ('employee1@company.com', 'employee2@company.com');

-- Sample KPIs
INSERT INTO kpis (name, description, unit, category) VALUES
('Code Coverage', 'Percentage of code covered by tests', '%', 'Quality'),
('API Response Time', 'Average API response time', 'ms', 'Performance'),
('Bug Resolution Rate', 'Percentage of bugs resolved', '%', 'Quality'),
('Feature Completion', 'Number of features completed', 'count', 'Delivery'),
('Customer Satisfaction', 'Customer satisfaction score', 'score', 'Impact');