import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, MessageSquare, TrendingUp, Award, LogOut, Plus, Save, X } from 'lucide-react';

const PerformanceReviewSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [goals, setGoals] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '', kpi: '', target: '' });
  const [newFeedback, setNewFeedback] = useState({ employeeId: '', rating: 5, comments: '' });
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showNewFeedbackForm, setShowNewFeedbackForm] = useState(false);

  // Initialize demo data
  useEffect(() => {
    const demoEmployees = [
      { id: 1, name: 'Alice Johnson', role: 'employee', department: 'Engineering', manager: 'Bob Smith', email: 'alice@company.com', hireDate: '2021-03-10' },
      { id: 2, name: 'Bob Smith', role: 'manager', department: 'Engineering', manager: 'Carol White', email: 'bob@company.com', hireDate: '2020-06-01' },
      { id: 3, name: 'Carol White', role: 'admin', department: 'Leadership', manager: null, email: 'carol@company.com', hireDate: '2020-01-15' },
      { id: 4, name: 'David Lee', role: 'employee', department: 'Engineering', manager: 'Bob Smith', email: 'david@company.com', hireDate: '2021-09-20' },
      { id: 5, name: 'Emma Wilson', role: 'employee', department: 'Engineering', manager: 'Bob Smith', email: 'emma@company.com', hireDate: '2022-01-15' },
    ];

    const demoGoals = [
      { id: 1, employeeId: 1, title: 'Complete API Migration', description: 'Migrate legacy APIs to REST', kpi: 'APIs Migrated', target: 10, current: 7, status: 'in-progress', targetDate: '2026-03-31', priority: 'high', startDate: '2026-01-01' },
      { id: 2, employeeId: 1, title: 'Improve Code Coverage', description: 'Increase unit test coverage', kpi: 'Coverage %', target: 85, current: 72, status: 'in-progress', targetDate: '2026-04-15', priority: 'medium', startDate: '2026-01-01' },
      { id: 3, employeeId: 4, title: 'Deploy Microservices', description: 'Launch 3 new microservices', kpi: 'Services Deployed', target: 3, current: 3, status: 'completed', targetDate: '2026-02-28', priority: 'high', startDate: '2026-01-01' },
      { id: 4, employeeId: 4, title: 'Database Optimization', description: 'Optimize query performance', kpi: 'Query Time (ms)', target: 50, current: 38, status: 'in-progress', targetDate: '2026-03-15', priority: 'high', startDate: '2026-01-10' },
      { id: 5, employeeId: 5, title: 'Security Audit', description: 'Complete security vulnerability scan', kpi: 'Issues Fixed', target: 20, current: 12, status: 'in-progress', targetDate: '2026-03-20', priority: 'high', startDate: '2026-01-05' },
    ];

    const demoFeedback = [
      { id: 1, employeeId: 1, managerId: 2, rating: 4, comments: 'Excellent progress on API migration. Great technical skills and problem-solving ability.', date: '2026-01-15', type: 'quarterly' },
      { id: 2, employeeId: 4, managerId: 2, rating: 5, comments: 'Outstanding work on microservices deployment. Exceeded expectations and showed great initiative.', date: '2026-01-18', type: 'quarterly' },
      { id: 3, employeeId: 1, managerId: 2, rating: 4, comments: 'Strong team player. Consistently delivers quality work on time.', date: '2026-01-20', type: 'general' },
      { id: 4, employeeId: 5, managerId: 2, rating: 3, comments: 'Good progress on security audit. Needs to improve communication with stakeholders.', date: '2026-01-22', type: 'general' },
      { id: 5, employeeId: 4, managerId: 2, rating: 5, comments: 'Exceptional database optimization work. Reduced query times significantly.', date: '2026-01-25', type: 'project' },
    ];

    setEmployees(demoEmployees);
    setGoals(demoGoals);
    setFeedback(demoFeedback);
  }, []);

  const calculatePerformanceScore = (employeeId) => {
    const employeeGoals = goals.filter(g => g.employeeId === employeeId);
    const employeeFeedback = feedback.filter(f => f.employeeId === employeeId);

    if (employeeGoals.length === 0) return 0;

    const goalScore = employeeGoals.reduce((acc, goal) => {
      const completion = (goal.current / goal.target) * 100;
      return acc + Math.min(completion, 100);
    }, 0) / employeeGoals.length;

    const feedbackScore = employeeFeedback.length > 0
      ? (employeeFeedback.reduce((acc, f) => acc + f.rating, 0) / employeeFeedback.length) * 20
      : 0;

    return Math.round((goalScore * 0.6 + feedbackScore * 0.4));
  };

  const getPromotionRecommendation = (score) => {
    if (score >= 90) return 'Highly Recommended';
    if (score >= 75) return 'Recommended';
    if (score >= 60) return 'Consider';
    return 'Not Ready';
  };

  const handleLogin = (role) => {
    const user = employees.find(e => e.role === role);
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.kpi || !newGoal.target) {
      alert('Please fill in all required fields');
      return;
    }
    
    const goal = {
      id: goals.length + 1,
      employeeId: currentUser.id,
      title: newGoal.title,
      description: newGoal.description,
      kpi: newGoal.kpi,
      target: parseInt(newGoal.target),
      current: 0,
      status: 'in-progress',
      targetDate: newGoal.targetDate,
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0]
    };
    
    setGoals([...goals, goal]);
    setNewGoal({ title: '', description: '', targetDate: '', kpi: '', target: '' });
    setShowNewGoalForm(false);
    alert('Goal created successfully!');
  };

  const handleUpdateGoalProgress = (goalId, newValue) => {
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const current = parseInt(newValue);
        return {
          ...g,
          current,
          status: current >= g.target ? 'completed' : 'in-progress'
        };
      }
      return g;
    }));
  };

  const handleAddFeedback = () => {
    if (!newFeedback.employeeId || !newFeedback.comments) {
      alert('Please select an employee and add comments');
      return;
    }
    
    const feedbackItem = {
      id: feedback.length + 1,
      employeeId: parseInt(newFeedback.employeeId),
      managerId: currentUser.id,
      rating: parseInt(newFeedback.rating),
      comments: newFeedback.comments,
      date: new Date().toISOString().split('T')[0],
      type: 'general'
    };
    
    setFeedback([...feedback, feedbackItem]);
    setNewFeedback({ employeeId: '', rating: 5, comments: '' });
    setShowNewFeedbackForm(false);
    alert('Feedback submitted successfully!');
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(goals.filter(g => g.id !== goalId));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Award className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Performance Review System</h1>
            <p className="text-gray-600 mt-2">Select your role to continue</p>
          </div>
          
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-blue-800">
              <p>• <strong>Employee:</strong> Alice Johnson</p>
              <p>• <strong>Manager:</strong> Bob Smith</p>
              <p>• <strong>Admin:</strong> Carol White</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleLogin('employee')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Login as Employee
            </button>
            <button
              onClick={() => handleLogin('manager')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Login as Manager
            </button>
            <button
              onClick={() => handleLogin('admin')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userGoals = currentUser.role === 'employee' 
    ? goals.filter(g => g.employeeId === currentUser.id)
    : goals;

  const userFeedback = currentUser.role === 'employee'
    ? feedback.filter(f => f.employeeId === currentUser.id)
    : feedback;

  const myScore = calculatePerformanceScore(currentUser.id);

  // Analytics data
  const teamPerformance = employees
    .filter(e => e.role === 'employee')
    .map(emp => ({
      name: emp.name.split(' ')[0],
      score: calculatePerformanceScore(emp.id),
      goals: goals.filter(g => g.employeeId === emp.id).length,
      completed: goals.filter(g => g.employeeId === emp.id && g.status === 'completed').length
    }));

  const goalStatusData = [
    { name: 'Completed', value: goals.filter(g => g.status === 'completed').length },
    { name: 'In Progress', value: goals.filter(g => g.status === 'in-progress').length }
  ];

  const priorityData = [
    { name: 'High', value: goals.filter(g => g.priority === 'high').length },
    { name: 'Medium', value: goals.filter(g => g.priority === 'medium').length },
    { name: 'Low', value: goals.filter(g => g.priority === 'low').length }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Performance Review System</h1>
                <p className="text-sm text-gray-600">{currentUser.name} - {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                activeTab === 'goals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                activeTab === 'feedback' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
            {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                  activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Performance Score</p>
                    <p className="text-4xl font-bold mt-2">{myScore}%</p>
                    <p className="text-indigo-100 text-xs mt-1">Based on goals & feedback</p>
                  </div>
                  <Award className="w-12 h-12 text-indigo-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Goals</p>
                    <p className="text-4xl font-bold mt-2">{userGoals.filter(g => g.status === 'in-progress').length}</p>
                    <p className="text-blue-100 text-xs mt-1">Completed: {userGoals.filter(g => g.status === 'completed').length}</p>
                  </div>
                  <Target className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Promotion Status</p>
                    <p className="text-2xl font-bold mt-2">{getPromotionRecommendation(myScore)}</p>
                    <p className="text-green-100 text-xs mt-1">Keep up the great work!</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-200" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Feedback</h2>
              {userFeedback.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No feedback yet</p>
              ) : (
                <div className="space-y-4">
                  {userFeedback.slice(-3).reverse().map(f => {
                    const manager = employees.find(e => e.id === f.managerId);
                    return (
                      <div key={f.id} className="border-l-4 border-indigo-600 bg-indigo-50 pl-4 py-3 rounded-r">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{manager?.name}</span>
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < f.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                            ))}
                            <span className="font-bold text-gray-700">{f.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{f.comments}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-gray-500 text-xs">{f.date}</p>
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{f.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            {currentUser.role === 'employee' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Add New Goal</h2>
                  <button
                    onClick={() => setShowNewGoalForm(!showNewGoalForm)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    {showNewGoalForm ? (
                      <><X className="w-4 h-4" /> <span>Cancel</span></>
                    ) : (
                      <><Plus className="w-4 h-4" /> <span>Add Goal</span></>
                    )}
                  </button>
                </div>
                
                {showNewGoalForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input
                      type="text"
                      placeholder="Goal Title *"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="KPI Name *"
                      value={newGoal.kpi}
                      onChange={(e) => setNewGoal({...newGoal, kpi: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Target Value *"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-2 md:col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddGoal}
                      className="md:col-span-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>Create Goal</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {currentUser.role === 'employee' ? 'My Goals' : 'All Goals'}
              </h2>
              <div className="space-y-4">
                {userGoals.map(goal => {
                  const employee = employees.find(e => e.id === goal.employeeId);
                  const progress = (goal.current / goal.target) * 100;
                  const priorityColors = {
                    high: 'bg-red-100 text-red-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    low: 'bg-green-100 text-green-800'
                  };
                  
                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">{goal.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[goal.priority]}`}>
                              {goal.priority}
                            </span>
                          </div>
                          {currentUser.role !== 'employee' && (
                            <p className="text-sm text-gray-600 mb-1">👤 {employee?.name} • {employee?.department}</p>
                          )}
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            goal.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {goal.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                          </span>
                          {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete goal"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-700 font-medium">{goal.kpi}</span>
                          <span className="font-semibold text-indigo-600">{goal.current} / {goal.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        {currentUser.role === 'employee' && goal.status !== 'completed' && (
                          <div className="mt-3 flex items-center space-x-3">
                            <input
                              type="number"
                              value={goal.current}
                              onChange={(e) => handleUpdateGoalProgress(goal.id, e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1 w-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              max={goal.target}
                            />
                            <span className="text-sm text-gray-600">Update progress</span>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>📅 Started: {goal.startDate}</span>
                          <span>🎯 Target: {goal.targetDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Provide Feedback</h2>
                  <button
                    onClick={() => setShowNewFeedbackForm(!showNewFeedbackForm)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    {showNewFeedbackForm ? (
                      <><X className="w-4 h-4" /> <span>Cancel</span></>
                    ) : (
                      <><Plus className="w-4 h-4" /> <span>Add Feedback</span></>
                    )}
                  </button>
                </div>
                
                {showNewFeedbackForm && (
                  <div className="space-y-4 mt-4">
                    <select
                      value={newFeedback.employeeId}
                      onChange={(e) => setNewFeedback({...newFeedback, employeeId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Employee</option>
                      {employees.filter(e => e.role === 'employee').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                      ))}
                    </select>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating: {newFeedback.rating}/5
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setNewFeedback({...newFeedback, rating: star})}
                            className={`text-3xl ${star <= newFeedback.rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <textarea
                      placeholder="Feedback comments..."
                      value={newFeedback.comments}
                      onChange={(e) => setNewFeedback({...newFeedback, comments: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    
                    <button
                      onClick={handleAddFeedback}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Feedback History</h2>
              <div className="space-y-4">
                {userFeedback.map(f => {
                  const employee = employees.find(e => e.id === f.employeeId);
                  const manager = employees.find(e => e.id === f.managerId);
                  
                  return (
                    <div key={f.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {currentUser.role !== 'employee' && (
                            <p className="font-semibold text-gray-800">👤 {employee?.name}</p>
                          )}
                          <p className="text-sm text-gray-600">From: {manager?.name}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < f.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                          <span className="font-bold text-lg text-gray-700">{f.rating}/5</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{f.comments}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>📅 {f.date}</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{f.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (currentUser.role === 'manager' || currentUser.role === 'admin') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{employees.filter(e => e.role === 'employee').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Goals</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{goals.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Avg Performance</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {Math.round(teamPerformance.reduce((acc, emp) => acc + emp.score, 0) / teamPerformance.length)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Team Performance Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#4f46e5" name="Performance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Goal Status Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={goalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value}) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {goalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Employee Performance Report</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Goals</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Promotion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.filter(e => e.role === 'employee').map(emp => {
                      const score = calculatePerformanceScore(emp.id);
                      const empGoals = goals.filter(g => g.employeeId === emp.id);
                      const completed = empGoals.filter(g => g.status === 'completed').length;
                      
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{emp.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-semibold ${score >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{completed}/{empGoals.length}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              score >= 90 ? 'bg-green-100 text-green-800' :
                              score >= 75 ? 'bg-blue-100 text-blue-800' :
                              score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getPromotionRecommendation(score)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceReviewSystem;