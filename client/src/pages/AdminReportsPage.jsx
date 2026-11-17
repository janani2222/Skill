import React, { useEffect, useState } from 'react';
import {
  Users,
  FolderKanban,
  CalendarDays,
  UsersRound,
  Download
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  StudentRegistrationsBarChart,
  TopDepartmentsDoughnutChart
} from '../components/AdminCharts';
import { getAdminReports } from '../services/adminService';

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [notice, setNotice] = useState({ text: '', type: '' });

  useEffect(() => {
    getAdminReports()
      .then(setReports)
      .catch((err) =>
        setNotice({
          text: err.response?.data?.message || err.message || 'Unable to load analytics.',
          type: 'error'
        })
      );
  }, []);

  const metrics = reports?.metrics || {
    totalStudents: 1248,
    totalProjects: 312,
    totalWorkshops: 56,
    totalCommunities: 28,
    growth: {
      students: '+12%',
      projects: '+18%',
      workshops: '+40%',
      communities: '+8%'
    }
  };

  const departmentDistribution = reports?.departmentDistribution || [
    { name: 'CSE', percentage: 38, color: '#3B82F6' },
    { name: 'IT', percentage: 22, color: '#D5A32D' },
    { name: 'ECE', percentage: 16, color: '#10B981' },
    { name: 'AIML', percentage: 14, color: '#8B5CF6' },
    { name: 'Other', percentage: 10, color: '#94A3B8' }
  ];

  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Growth\n' +
      `Total Students,${metrics.totalStudents},${metrics.growth.students}\n` +
      `Total Projects,${metrics.totalProjects},${metrics.growth.projects}\n` +
      `Workshops,${metrics.totalWorkshops},${metrics.growth.workshops}\n` +
      `Communities,${metrics.totalCommunities},${metrics.growth.communities}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skillbridge_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice({ text: 'Report exported successfully.', type: 'success' });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  return (
    <AdminLayout
      pageTitle="Reports & Analytics"
      pageSubtitle="Platform usage, participation and performance insights."
    >
      {notice.text && (
        <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>
          <span>{notice.text}</span>
          <button
            className="admin-notice-close"
            onClick={() => setNotice({ text: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Top Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn-admin-gold" onClick={handleExportReport}>
          <Download size={14} /> Export Report (CSV)
        </button>
      </div>

      {/* 1. Statistics Cards with Growth Percentage */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap purple">
            <Users size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {metrics.totalStudents.toLocaleString()}
            </div>
            <div className="admin-stat-growth">{metrics.growth.students}</div>
            <div className="admin-stat-label">Total Students</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap blue">
            <FolderKanban size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {metrics.totalProjects.toLocaleString()}
            </div>
            <div className="admin-stat-growth">{metrics.growth.projects}</div>
            <div className="admin-stat-label">Total Projects</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap violet">
            <CalendarDays size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {metrics.totalWorkshops.toLocaleString()}
            </div>
            <div className="admin-stat-growth">{metrics.growth.workshops}</div>
            <div className="admin-stat-label">Total Workshops</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap gold">
            <UsersRound size={22} />
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-number">
              {metrics.totalCommunities.toLocaleString()}
            </div>
            <div className="admin-stat-growth">{metrics.growth.communities}</div>
            <div className="admin-stat-label">Total Communities</div>
          </div>
        </div>
      </div>

      {/* 2. Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Chart 1: Student Registrations Bar Chart */}
        <div className="admin-chart-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Student Registrations</h2>
          </div>
          <StudentRegistrationsBarChart data={reports?.studentRegistrations} />
        </div>

        {/* Chart 2: Project Status Trend */}
        <div className="admin-chart-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Project Status Trend</h2>
          </div>
          {/* Multi-line Trend SVG */}
          <svg viewBox="0 0 340 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <line x1="30" y1="20" x2="320" y2="20" stroke="#EFE8DE" strokeDasharray="3,3" />
            <line x1="30" y1="60" x2="320" y2="60" stroke="#EFE8DE" strokeDasharray="3,3" />
            <line x1="30" y1="100" x2="320" y2="100" stroke="#EFE8DE" strokeDasharray="3,3" />
            <line x1="30" y1="140" x2="320" y2="140" stroke="#EFE8DE" />
            <text x="25" y="23" textAnchor="end" fill="#8C9BAE" fontSize="9">100</text>
            <text x="25" y="63" textAnchor="end" fill="#8C9BAE" fontSize="9">60</text>
            <text x="25" y="103" textAnchor="end" fill="#8C9BAE" fontSize="9">20</text>
            <text x="25" y="143" textAnchor="end" fill="#8C9BAE" fontSize="9">0</text>
            {/* Curves */}
            <path d="M 40 135 C 90 120, 160 90, 310 35" fill="none" stroke="#10B981" strokeWidth="2.5" />
            <path d="M 40 130 C 90 115, 170 70, 310 50" fill="none" stroke="#D5A32D" strokeWidth="2.5" />
            <path d="M 40 135 C 90 130, 180 110, 310 90" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
          </svg>
          <div className="chart-legend-row" style={{ fontSize: '10.5px', marginTop: '6px' }}>
            <span style={{ color: '#3B82F6' }}>● Planning</span>
            <span style={{ color: '#D5A32D' }}>● In Progress</span>
            <span style={{ color: '#10B981' }}>● Completed</span>
          </div>
        </div>

        {/* Chart 3: Top Departments (Projects) */}
        <div className="admin-chart-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Top Departments (Projects)</h2>
          </div>
          <TopDepartmentsDoughnutChart
            distribution={departmentDistribution}
            total={metrics.totalProjects}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

