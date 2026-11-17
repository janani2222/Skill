import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  CalendarDays,
  UsersRound,
  Megaphone,
  UserCheck
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { PlatformOverviewChart, ProjectStatusDoughnutChart } from '../components/AdminCharts';
import { getAdminOverview } from '../services/adminService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Administrator access required.');
        setLoading(false);
      });
  }, []);

  const stats = data?.stats || {
    totalStudents: 1248,
    totalProjects: 312,
    totalWorkshops: 56,
    totalCommunities: 28
  };

  const statusDistribution = data?.statusDistribution || {
    planning: 78,
    inProgress: 132,
    completed: 86,
    onHold: 16,
    total: 312
  };

  const recentActivities = data?.recentActivities || [
    {
      _id: 'act-1',
      type: 'student',
      title: 'New student registered – Aishwarya K (CSE)',
      time: '5 min ago'
    },
    {
      _id: 'act-2',
      type: 'project',
      title: 'Project created – Smart Campus App',
      time: '18 min ago'
    },
    {
      _id: 'act-3',
      type: 'workshop',
      title: 'Workshop scheduled – AI in Real World',
      time: '1 hour ago'
    }
  ];

  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      pageSubtitle="Monitor platform activity, users, projects and events."
    >
      {error && <div className="admin-notice error">{error}</div>}

      {/* 1. Statistics Cards (Horizontal Row of 4) */}
      <div className="admin-stats-row">
        {/* Card 1 - Total Students */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap purple">
            <Users size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {stats.totalStudents.toLocaleString()}
            </div>
            <div className="admin-stat-label">Total Students</div>
          </div>
        </div>

        {/* Card 2 - Total Projects */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap blue">
            <FolderKanban size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {stats.totalProjects.toLocaleString()}
            </div>
            <div className="admin-stat-label">Total Projects</div>
          </div>
        </div>

        {/* Card 3 - Workshops */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap violet">
            <CalendarDays size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {stats.totalWorkshops.toLocaleString()}
            </div>
            <div className="admin-stat-label">Workshops</div>
          </div>
        </div>

        {/* Card 4 - Communities */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap gold">
            <UsersRound size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {stats.totalCommunities.toLocaleString()}
            </div>
            <div className="admin-stat-label">Communities</div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Platform Overview Chart & Project Status Distribution */}
      <div className="admin-charts-row">
        {/* Left: Platform Overview Line Chart */}
        <div className="admin-chart-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Platform Overview</h2>
          </div>
          <PlatformOverviewChart data={data?.monthlyOverview} />
        </div>

        {/* Right: Project Status Distribution Doughnut Chart */}
        <div className="admin-chart-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Project Status Distribution</h2>
          </div>
          <ProjectStatusDoughnutChart distribution={statusDistribution} />
        </div>
      </div>

      {/* 3. Bottom Row: Recent Activities (60%) & Quick Actions (40%) */}
      <div className="admin-bottom-row">
        {/* Left: Recent Activities */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Recent Activities</h2>
          </div>
          <div className="admin-activity-list">
            {recentActivities.map((act) => (
              <div className="admin-activity-item" key={act._id}>
                <div className="admin-activity-left">
                  <div className={`admin-activity-badge ${act.type || 'student'}`}>
                    {act.type === 'project' ? (
                      <FolderKanban size={15} />
                    ) : act.type === 'workshop' ? (
                      <CalendarDays size={15} />
                    ) : (
                      <Users size={15} />
                    )}
                  </div>
                  <span className="admin-activity-title">{act.title}</span>
                </div>
                <span className="admin-activity-time">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Quick Actions</h2>
          </div>
          <div className="admin-quick-actions-col">
            <button
              className="admin-quick-action-btn"
              onClick={() => navigate('/admin/workshops?new=1')}
            >
              <CalendarDays size={18} />
              <span>Create Workshop</span>
            </button>
            <button
              className="admin-quick-action-btn"
              onClick={() => navigate('/admin/announcements?new=1')}
            >
              <Megaphone size={18} />
              <span>Post Announcement</span>
            </button>
            <button
              className="admin-quick-action-btn"
              onClick={() => navigate('/admin/join-requests')}
            >
              <UserCheck size={18} />
              <span>View Join Requests</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
