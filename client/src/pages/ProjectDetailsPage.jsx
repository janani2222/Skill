import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  UserCheck,
  User,
  Github,
  ExternalLink,
  Link2,
  FolderGit2,
  FileText,
  Paperclip,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Upload,
  MessageCircle,
  X,
  Laptop
} from 'lucide-react';
import SkillBridgeNavbar from '../components/SkillBridgeNavbar';
import {
  getProject,
  getTeamDashboard,
  uploadProjectMedia,
  deleteProjectMedia,
  createJoinRequest,
  updateJoinRequest,
  getProjectAccess,
  createTeamTask,
  updateTeamTask,
  createTeamMilestone,
  addTeamMember,
  removeTeamMember
} from '../services/phase2Service';
import { useAuth } from '../context/AuthContext';
import '../styles/my-projects-redesign.css';

// Helper to format month and year, e.g. "Aug 2026 – Nov 2026"
const formatTimeline = (startDate, completionDate) => {
  if (!startDate && !completionDate) return 'Aug 2026 – Nov 2026';
  const formatMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  const start = formatMY(startDate);
  const end = formatMY(completionDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  return end || 'Flexible';
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'team' | 'resources' | 'workspace'
  const [notice, setNotice] = useState({ text: '', type: '' });

  // File upload state
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Request to join modal
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Add task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    assignee: ''
  });

  const showNotification = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 5000);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [projRes, teamRes, accessRes] = await Promise.all([
        getProject(id).catch(() => ({ project: null })),
        getTeamDashboard(id).catch(() => null),
        getProjectAccess(id).catch(() => null)
      ]);
      if (accessRes) {
        setRequestSubmitted(accessRes.requestStatus?.toLowerCase() === 'pending' || accessRes.status === 'pending');
      }
      if (projRes?.project) {
        setProject(projRes.project);
      }
      if (teamRes) {
        setTeamData(teamRes);
        if (!projRes?.project && teamRes.project) {
          setProject(teamRes.project);
        }
      }
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  if (loading) {
    return (
      <div className="projects-shell">
        <SkillBridgeNavbar />
        <main className="project-details-page">
          <div className="my-projects-empty">
            <p>Loading project details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="projects-shell">
        <SkillBridgeNavbar />
        <main className="project-details-page">
          <Link to="/projects" className="project-details-back">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <div className="my-projects-empty">
            <FolderGit2 size={44} style={{ color: '#C99A32', marginBottom: '12px' }} />
            <h3>Project Not Found</h3>
            <p>The requested project could not be found or you may not have permission to view it.</p>
            <Link to="/projects" className="btn-create-project">
              Back to My Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const userId = String(user?._id || user?.id || '');
  const ownerId = String(project.owner?._id || project.owner || '');
  const isOwner = userId === ownerId;

  // Check if current user is an accepted member
  const membersList = teamData?.members || project.members || [];
  const isMember = membersList.some(
    (m) => String(m.student?._id || m.student || m.user?._id || m.user) === userId
  );

  const canManage = isOwner || isMember;

  // Resolve hero framed cover image
  const heroCover =
    project.thumbnail ||
    (project.title?.toLowerCase().includes('job')
      ? '/projects/job-portal-hero.jpg'
      : project.title?.toLowerCase().includes('shop')
      ? '/projects/online-shopping.jpg'
      : project.title?.toLowerCase().includes('travel')
      ? '/projects/travel-agency.jpg'
      : '/projects/job-portal.jpg');

  // Status dot class
  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '-');
    if (s === 'completed') return 'completed';
    if (s === 'in-progress') return 'in-progress';
    if (s === 'planning') return 'planning';
    return 'on-hold';
  };

  const statusClass = getStatusClass(project.status);

  // File upload handler
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!mediaFile) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', mediaFile);
      await uploadProjectMedia(id, fd);
      showNotification('Project resource uploaded successfully.');
      setMediaFile(null);
      await loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to upload resource', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete resource file
  const handleDeleteFile = async (mediaId) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await deleteProjectMedia(id, mediaId);
      showNotification('Resource deleted.');
      await loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to delete file', 'error');
    }
  };

  // Submit join request
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);
    try {
      await createJoinRequest(id, { message: requestMessage });
      setRequestSubmitted(true);
      setIsRequestOpen(false);
      setRequestMessage('');
      showNotification('Join request sent to project owner.');
      await loadAll();
    } catch (err) {
      if (err.response?.status === 409 && /pending request/i.test(err.response?.data?.message || '')) {
        setRequestSubmitted(true);
        setIsRequestOpen(false);
        showNotification('Your request is already pending.');
        await loadAll();
      } else {
        showNotification(err.response?.data?.message || err.message || 'Failed to send request', 'error');
      }
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Toggle task complete / status
  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await updateTeamTask(task._id, { status: nextStatus });
      await loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update task', 'error');
    }
  };

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTeamTask(id, taskForm);
      showNotification('Task added to workspace.');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', deadline: '', assignee: '' });
      await loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to create task', 'error');
    }
  };

  const tasksList = teamData?.tasks || [];
  const milestonesList = teamData?.milestones || [];
  const mediaList = project.media || [];
  const currentMembersCount = teamData?.stats?.memberCount || membersList.length || 1;
  const maxMembersCount = project.maxMembers || 5;

  // Resolve technologies badges
  const techBadges = Array.isArray(project.technologies) && project.technologies.length > 0
    ? project.technologies
    : ['MERN Stack', 'Full Stack'];

  // Owner details
  const ownerName = project.owner?.name || 'Janani';
  const ownerYear = project.owner?.year || project.ownerProfile?.year || 'Third Year';
  const ownerAvatar = project.owner?.avatar || project.ownerProfile?.avatar || '/college-building.png';

  return (
    <div className="projects-shell">
      {/* 1. SkillBridge Top Navigation Bar */}
      <SkillBridgeNavbar />

      <main className="project-details-page">
        {/* Notice alert */}
        {notice.text && (
          <div className={`project-alert-banner ${notice.type === 'error' ? 'error' : 'success'}`}>
            <span>{notice.text}</span>
            <button
              onClick={() => setNotice({ text: '', type: '' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 2. Back to Projects Link */}
        <Link to="/projects" className="project-details-back">
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        {/* 3. Project Hero Banner (Follows reference image layout) */}
        <section className="project-details-hero">
          <div className="project-hero-waves">
            <svg viewBox="0 0 400 165" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', opacity: 0.35 }}>
              <path d="M50 165 C 150 100, 250 150, 400 30" stroke="#C99A32" strokeWidth="2.5" fill="none" />
              <path d="M120 165 C 220 90, 300 120, 400 70" stroke="#E5BB63" strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          <div className="project-hero-inner">
            {/* Left Framed Cover Image with Gold Border */}
            <div className="project-hero-frame">
              <img
                src={heroCover}
                alt={project.title}
                onError={(e) => {
                  e.currentTarget.src = '/projects/job-portal.jpg';
                }}
              />
            </div>

            {/* Middle / Right Project Collaboration Information */}
            <div className="project-hero-info">
              <span className="project-hero-eyebrow">PROJECT COLLABORATION</span>
              <h1 className="project-hero-title">{project.title}</h1>
              <p className="project-hero-desc">{project.description}</p>

              {/* Technologies Badges */}
              <div className="project-hero-badges">
                {techBadges.map((tech, idx) => (
                  <span className="hero-pill-badge" key={idx}>
                    {tech}
                  </span>
                ))}
              </div>

              {/* Meta Row (Members, Status, Action Button) */}
              <div className="project-hero-meta-row">
                <span className="hero-meta-item">
                  <Users size={16} /> {currentMembersCount} / {maxMembersCount} Members
                </span>

                <span className="hero-meta-status">
                  <span className={`project-status-dot ${statusClass}`} />
                  {project.status || 'Completed'}
                </span>

                {canManage ? (
                  <Link to={`/projects/${id}/team`} className="btn-hero-manage-team">
                    Manage Team
                  </Link>
                ) : requestSubmitted ? (
                  <span className="hero-pill-badge" style={{ background: '#C99A32', color: '#FFFFFF' }}>
                    Request Pending
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-hero-manage-team"
                    onClick={() => setIsRequestOpen(true)}
                  >
                    Request to Join
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Horizontal Navigation Tabs */}
        <div className="project-tabs-bar">
          <button
            type="button"
            className={`project-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FileText size={16} /> Overview
          </button>
          <button
            type="button"
            className={`project-tab-button ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={16} /> Team
          </button>
          <button
            type="button"
            className={`project-tab-button ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <Paperclip size={16} /> Resources
          </button>
          <button
            type="button"
            className={`project-tab-button ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <Laptop size={16} /> Workspace
          </button>
        </div>

        {/* 5. TAB 1: OVERVIEW (Exact Two-Column Layout from Screenshot) */}
        {activeTab === 'overview' && (
          <div className="project-overview-layout">
            {/* Left Column: Project Overview Card */}
            <div className="project-detail-card">
              <div className="detail-card-header">
                <FolderGit2 size={19} className="detail-card-header-icon" />
                <h3 className="detail-card-title">Project Overview</h3>
              </div>

              <p className="project-overview-description">
                {project.description ||
                  'A full-stack job portal built with modern technologies to help students find internships and jobs.'}
              </p>

              {/* 2x2 Info Grid */}
              <div className="project-metrics-grid">
                {/* 1. Category */}
                <div className="metric-item">
                  <div className="metric-icon-wrap">
                    <Layers size={18} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-label">CATEGORY</span>
                    <span className="metric-value">{project.category || 'Web Development'}</span>
                  </div>
                </div>

                {/* 2. Status */}
                <div className="metric-item">
                  <div className="metric-icon-wrap">
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-label">STATUS</span>
                    <span className="metric-value">
                      <span className={`project-status-dot ${statusClass}`} />
                      {project.status || 'Completed'}
                    </span>
                  </div>
                </div>

                {/* 3. My Role */}
                <div className="metric-item">
                  <div className="metric-icon-wrap">
                    <UserCheck size={18} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-label">MY ROLE</span>
                    <span className="metric-value">{project.role || 'Developer'}</span>
                  </div>
                </div>

                {/* 4. Timeline */}
                <div className="metric-item">
                  <div className="metric-icon-wrap">
                    <Clock size={18} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-label">TIMELINE</span>
                    <span className="metric-value">
                      {formatTimeline(project.startDate, project.completionDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Project Links & Project Owner */}
            <div>
              {/* Card 1: Project Links */}
              <div className="project-detail-card">
                <div className="detail-card-header">
                  <Link2 size={19} className="detail-card-header-icon" />
                  <h3 className="detail-card-title">Project Links</h3>
                </div>

                <div className="project-links-wrap">
                  {/* GitHub Repo */}
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="project-link-pill"
                    >
                      <Github size={15} /> GitHub Repository
                    </a>
                  ) : (
                    <span className="project-link-pill disabled">
                      <Github size={15} /> GitHub Repository
                    </span>
                  )}

                  {/* Live Demo */}
                  {project.liveDemoUrl ? (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="project-link-pill"
                    >
                      <ExternalLink size={15} /> Live Demo <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="project-link-pill disabled">
                      <ExternalLink size={15} /> Live Demo
                    </span>
                  )}

                  {/* Placeholder Pill from Reference */}
                  <span className="project-link-pill disabled">
                    <Link2 size={14} /> Not added yet
                  </span>
                </div>
              </div>

              {/* Card 2: Project Owner */}
              <div className="project-detail-card">
                <div className="detail-card-header">
                  <User size={19} className="detail-card-header-icon" />
                  <h3 className="detail-card-title">Project Owner</h3>
                </div>

                <div className="project-owner-row">
                  <div className="project-owner-info">
                    <div className="project-owner-avatar">
                      <img
                        src={ownerAvatar}
                        alt={ownerName}
                        onError={(e) => {
                          e.currentTarget.src = '/college-building.png';
                        }}
                      />
                    </div>
                    <div className="project-owner-meta">
                      <h4>{ownerName}</h4>
                      <span>{ownerYear}</span>
                    </div>
                  </div>

                  <Link
                    to={isOwner ? '/profile' : `/students/${project.owner?._id || project.owner}`}
                    className="btn-view-profile"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB 2: TEAM */}
        {activeTab === 'team' && (
          <div className="project-detail-card">
            <div className="detail-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={19} className="detail-card-header-icon" />
                <h3 className="detail-card-title">Team Roster ({currentMembersCount} / {maxMembersCount})</h3>
              </div>
              {canManage && (
                <Link to={`/projects/${id}/team`} className="btn-hero-manage-team">
                  Manage Team Dashboard
                </Link>
              )}
            </div>

            <div className="project-team-roster">
              {/* Owner Item */}
              <div className="team-roster-member">
                <div className="member-left-info">
                  <div className="member-avatar">
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      onError={(e) => {
                        e.currentTarget.src = '/college-building.png';
                      }}
                    />
                  </div>
                  <div className="member-text">
                    <h5>{ownerName}</h5>
                    <span>Project Lead · {ownerYear}</span>
                  </div>
                </div>
                <span className="member-role-badge owner">Owner</span>
              </div>

              {/* Members */}
              {membersList.map((m, idx) => {
                const sName = m.student?.name || m.user?.name || `Team Member ${idx + 1}`;
                const sAvatar = m.student?.avatar || m.user?.avatar || '/college-building.png';
                const sRole = m.role || 'Developer';
                return (
                  <div className="team-roster-member" key={m._id || idx}>
                    <div className="member-left-info">
                      <div className="member-avatar">
                        <img
                          src={sAvatar}
                          alt={sName}
                          onError={(e) => {
                            e.currentTarget.src = '/college-building.png';
                          }}
                        />
                      </div>
                      <div className="member-text">
                        <h5>{sName}</h5>
                        <span>{sRole}</span>
                      </div>
                    </div>
                    <span className="member-role-badge">{sRole}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. TAB 3: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="project-detail-card">
            <div className="detail-card-header">
              <Paperclip size={19} className="detail-card-header-icon" />
              <h3 className="detail-card-title">Project Resources & Files</h3>
            </div>

            {/* Upload File Form (for team members / owner) */}
            {canManage && (
              <form onSubmit={handleUploadFile} style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.zip"
                  onChange={(e) => setMediaFile(e.target.files?.[0])}
                  className="project-form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={uploading || !mediaFile}
                  className="btn-create-project"
                  style={{ flexShrink: 0 }}
                >
                  <Upload size={15} /> {uploading ? 'Uploading...' : 'Share File'}
                </button>
              </form>
            )}

            {/* Media list */}
            {mediaList.length === 0 ? (
              <p style={{ color: '#53677F', fontSize: '13.5px' }}>
                No resources or documents shared for this project yet.
              </p>
            ) : (
              <div className="resources-files-list">
                {mediaList.map((m) => (
                  <div className="resource-file-item" key={m._id}>
                    <div className="resource-file-info">
                      <FileText size={20} className="resource-file-icon" />
                      <div>
                        <a
                          href={m.filePath}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="resource-file-name"
                        >
                          {m.fileName || 'Resource File'}
                        </a>
                        <span className="resource-file-date">
                          Uploaded {new Date(m.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a
                        href={m.filePath}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="btn-view-profile"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      >
                        Download
                      </a>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(m._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#B42318',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. TAB 4: WORKSPACE */}
        {activeTab === 'workspace' && (
          <div>
            <div className="project-detail-card">
              <div className="workspace-tasks-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={19} className="detail-card-header-icon" />
                  <h3 className="detail-card-title">Team Tasks</h3>
                </div>
                {canManage && (
                  <button
                    type="button"
                    className="btn-create-project"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>

              {tasksList.length === 0 ? (
                <p style={{ color: '#53677F', fontSize: '13.5px' }}>
                  No tasks added to this workspace yet.
                </p>
              ) : (
                tasksList.map((task) => {
                  const isDone = task.status === 'Completed';
                  return (
                    <div className="workspace-task-card" key={task._id}>
                      <div className="task-info-left">
                        <button
                          type="button"
                          className="task-check-btn"
                          onClick={() => handleToggleTask(task)}
                        >
                          {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div>
                          <div className={`task-title ${isDone ? 'completed' : ''}`}>
                            {task.title}
                          </div>
                          <div className="task-meta">
                            <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                            <span>Priority: {task.priority || 'Medium'}</span>
                            {task.deadline && <span>Deadline: {task.deadline}</span>}
                          </div>
                        </div>
                      </div>

                      <span
                        className="member-role-badge"
                        style={{
                          background: isDone ? '#E8F5E9' : '#FEF3C7',
                          color: isDone ? '#1B5E20' : '#92400E'
                        }}
                      >
                        {task.status || 'Not Started'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Group Chat Banner */}
            <div className="workspace-chat-card">
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#FFFFFF' }}>
                  Project Team Group Chat
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  Discuss project progress, collaborate in real-time, and share instant feedback.
                </p>
              </div>
              <Link to={`/messages?project=${id}`} className="workspace-chat-btn">
                <MessageCircle size={16} /> Open Group Chat
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Request to Join Modal */}
      {isRequestOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsRequestOpen(false)}>
          <div className="project-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="project-modal-header">
              <h2 className="project-modal-title">Request to Join Project</h2>
              <button
                type="button"
                className="project-modal-close"
                onClick={() => setIsRequestOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleJoinSubmit}>
              <div className="project-modal-body">
                <p style={{ fontSize: '13.5px', color: '#53677F', marginTop: 0 }}>
                  Introduce yourself to the project lead and explain how your skills can contribute to{' '}
                  <strong>{project.title}</strong>.
                </p>
                <div className="project-form-group full-width">
                  <label className="project-form-label">Message to Project Owner *</label>
                  <textarea
                    rows={4}
                    className="project-form-textarea"
                    required
                    placeholder="Hi! I am interested in joining as a developer..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="project-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsRequestOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={requestSubmitting}>
                  {requestSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsTaskModalOpen(false)}>
          <div className="project-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="project-modal-header">
              <h2 className="project-modal-title">Add Workspace Task</h2>
              <button
                type="button"
                className="project-modal-close"
                onClick={() => setIsTaskModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="project-modal-body">
                <div className="project-form-grid">
                  <div className="project-form-group full-width">
                    <label className="project-form-label">Task Title *</label>
                    <input
                      type="text"
                      className="project-form-input"
                      required
                      placeholder="e.g. Design responsive landing page"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                  </div>
                  <div className="project-form-group full-width">
                    <label className="project-form-label">Description</label>
                    <textarea
                      rows={2}
                      className="project-form-textarea"
                      placeholder="Task requirements and deliverables..."
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </div>
                  <div className="project-form-group">
                    <label className="project-form-label">Priority</label>
                    <select
                      className="project-form-select"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className="project-form-group">
                    <label className="project-form-label">Deadline</label>
                    <input
                      type="date"
                      className="project-form-input"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="project-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
