import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import StatCard from '../components/StatCard';
import {
  Code2,
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
  FileEdit,
  Clock,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../services/studentService';

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const loadData = async () => {
    try {
      const res = await getDashboardOverview();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const profile = dashboardData?.profile;
  const stats = dashboardData?.stats || {
    totalSkills: profile?.skills?.length || 0,
    projectsJoined: 0,
    profileCompletion: profile?.completionPercentage || 25,
    accountStatus: 'Active Student',
  };
  const activities = dashboardData?.activities || [];

  const completionPercentage = profile?.completionPercentage || 25;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="dashboard-main">
        {/* Topnav */}
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-text-group">
              <span className="welcome-dept-tag">
                {user?.department || 'Engineering Student'} &bull; {user?.year || 'First Year'}
              </span>
              <h2>Hello, {user?.name || 'Student'}!</h2>
              <p>
                Keep building your skills, collaborating with peers, and exploring academic innovation.
              </p>
            </div>
            <div className="welcome-actions">
              <Link to="/profile" className="btn-gold">
                View My Profile <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="completion-banner-card">
            <div className="completion-info">
              <div className="completion-header">
                <span className="completion-title">Collegiate Profile Completion</span>
                <span className="completion-percent">{completionPercentage}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="completion-tips">
                {completionPercentage < 100
                  ? 'Add your technical skills, bio, and portfolio links to reach 100% completion!'
                  : 'Great job! Your student profile is 100% complete and ready for collaboration.'}
              </p>
            </div>
            <Link to="/profile" className="btn-outline-gold">
              Complete Profile
            </Link>
          </div>

          {/* Statistics Cards Grid */}
          <div className="dashboard-stats-grid">
            <StatCard
              icon={Code2}
              title="Technical Skills Listed"
              value={stats.totalSkills}
              subtitle="Verified competencies"
              badgeText="Active"
              badgeColor="gold"
            />
            <StatCard
              icon={FolderGit2}
              title="Projects Joined"
              value={stats.projectsJoined}
              subtitle="Collegiate teams"
              badgeText="Phase 1"
              badgeColor="navy"
            />
            <StatCard
              icon={CheckCircle2}
              title="Profile Completion"
              value={`${stats.profileCompletion}%`}
              subtitle="Calculated dynamically"
              badgeText="Dynamic"
              badgeColor="gold"
            />
            <StatCard
              icon={ShieldCheck}
              title="Account Status"
              value={stats.accountStatus}
              subtitle="Institutional Member"
              badgeText="Verified"
              badgeColor="gold"
            />
          </div>

          {/* Two-Column Layout */}
          <div className="dashboard-grid-two">
            {/* Left Column: Student Information Details */}
            <div className="dash-panel">
              <div className="dash-panel-title">
                <span>Student Academic Portfolio</span>
                <Link to="/profile" className="btn-outline-gold" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                  <FileEdit size={14} /> Edit
                </Link>
              </div>

              <div className="info-details-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">College Email</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{user?.department}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Year of Study</span>
                  <span className="info-value">{user?.year}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Institution</span>
                  <span className="info-value">{profile?.collegeName || 'Engineering Campus'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{profile?.location || 'Campus / Hostel'}</span>
                </div>
              </div>

              {/* About Me */}
              <div className="info-about-section">
                <span className="info-label">About Me</span>
                <p style={{ marginTop: '6px', color: '#172638', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {profile?.aboutMe || 'No introductory statement added yet. Click Edit to add your bio!'}
                </p>
              </div>

              {/* Skills Tags */}
              <div className="info-about-section">
                <span className="info-label">Technical Skills</span>
                <div className="skills-tags-cluster">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((s) => (
                      <span key={s._id || s.name} className="skill-tag-pill">
                        <Code2 size={13} color="#B99545" /> {s.name || s}
                      </span>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.88rem', color: '#9CA3AF' }}>
                      No skills added yet.{' '}
                      <Link to="/profile" style={{ color: '#B99545', fontWeight: 600 }}>
                        Add your first skill
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Academic Interests */}
              <div className="info-about-section">
                <span className="info-label">Academic Interests</span>
                <div className="skills-tags-cluster">
                  {profile?.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest, idx) => (
                      <span key={idx} className="badge badge-gold" style={{ textTransform: 'none', padding: '6px 12px' }}>
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.88rem', color: '#9CA3AF' }}>
                      No interests specified yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="info-about-section">
                <span className="info-label">Portfolio & Social Links</span>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {profile?.socialLinks?.github ? (
                    <a
                      href={profile.socialLinks.github.startsWith('http') ? profile.socialLinks.github : `https://${profile.socialLinks.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline-gold"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={13} /> GitHub Profile
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>GitHub: Not added</span>
                  )}

                  {profile?.socialLinks?.linkedin ? (
                    <a
                      href={profile.socialLinks.linkedin.startsWith('http') ? profile.socialLinks.linkedin : `https://${profile.socialLinks.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline-gold"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={13} /> LinkedIn
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>LinkedIn: Not added</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions & Recent Activity */}
            <div>
              {/* Quick Actions Panel */}
              <div className="dash-panel">
                <h3 className="dash-panel-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                  <Link to="/profile" className="action-card-btn">
                    <div className="action-btn-left">
                      <FileEdit size={18} color="#B99545" />
                      <span>Update Profile Details</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/profile" className="action-card-btn">
                    <div className="action-btn-left">
                      <User size={18} color="#B99545" />
                      <span>View Full Profile</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/profile" className="action-card-btn">
                    <div className="action-btn-left">
                      <PlusCircle size={18} color="#B99545" />
                      <span>Add Technical Skills</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="dash-panel">
                <h3 className="dash-panel-title">
                  <span>Recent Activity</span>
                  <Clock size={16} color="#B99545" />
                </h3>

                {activities && activities.length > 0 ? (
                  <div className="activity-feed-list">
                    {activities.map((act) => (
                      <div key={act._id} className="activity-item">
                        <div className="activity-bullet" />
                        <div className="activity-content">
                          <p className="activity-title">{act.title}</p>
                          <p className="activity-desc">{act.description}</p>
                          <span className="activity-time">
                            {new Date(act.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9CA3AF' }}>
                    <Sparkles size={32} color="#B99545" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
                    <p style={{ fontWeight: 600, color: '#172638' }}>No recent activity</p>
                    <p style={{ fontSize: '0.85rem' }}>
                      Updates to your profile and skills will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
