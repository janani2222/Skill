import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Flag,
  Laptop,
  Layers,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Square,
  CheckSquare,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  X
} from 'lucide-react';
import {
  addTeamMember,
  createProgressUpdate,
  createTeamMilestone,
  createTeamTask,
  discoverStudents,
  getTeamDashboard,
  removeTeamMember,
  updateJoinRequest,
  updateProject,
  updateProjectStatus,
  updateTeamMemberRole,
  updateTeamMilestone,
  updateTeamTask
} from '../services/phase2Service';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_ROLES = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Database Developer',
  'DevOps Engineer',
  'QA / Tester'
];

// Helper to format dates like "Nov 12, 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  let d;
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, day] = dateStr.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format date & time like "Nov 13, 2026, 10:51 AM"
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Capitalize helper
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function TeamDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile: viewerProfile } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ text: '', type: '' });

  // Modal states
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Active member menu (3-dot popup)
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);
  const menuRef = useRef(null);

  // Available students list for inviting
  const [allStudents, setAllStudents] = useState([]);

  // Form states
  const [editProjectForm, setEditProjectForm] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    completionDate: '',
    maxMembers: 5,
    status: 'Planning'
  });

  const [addMemberForm, setAddMemberForm] = useState({
    studentId: '',
    role: 'Full Stack Developer'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'Medium',
    deadline: ''
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    dueDate: ''
  });

  const [quickUpdate, setQuickUpdate] = useState('');

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuMemberId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load team data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getTeamDashboard(id);
      setData(res);
      if (res.project) {
        setEditProjectForm({
          title: res.project.title || '',
          description: res.project.description || '',
          category: res.project.category || 'Web Development',
          startDate: res.project.startDate || '',
          completionDate: res.project.completionDate || '',
          maxMembers: res.project.maxMembers || 5,
          status: res.project.status || 'Planning'
        });
      }
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load project team data.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Load student list for member invite
  useEffect(() => {
    discoverStudents()
      .then((res) => {
        const list = res.students || res.users || [];
        setAllStudents(list);
      })
      .catch(() => {});
  }, []);

  const showNotification = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => {
      setNotice({ text: '', type: '' });
    }, 4500);
  };

  if (loading && !data) {
    return (
      <div className="team-dashboard-shell">
        <header className="team-dashboard-navbar">
          <Link to="/" className="team-dashboard-logo">
            <span className="logo-skill">Skill</span>
            <span className="logo-bridge">Bridge</span>
          </Link>
        </header>
        <main className="team-dashboard-page" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <p style={{ color: '#53677F', fontSize: '15px' }}>Loading team workspace…</p>
        </main>
      </div>
    );
  }

  if (!data || !data.project) {
    return (
      <div className="team-dashboard-shell">
        <header className="team-dashboard-navbar">
          <Link to="/" className="team-dashboard-logo">
            <span className="logo-skill">Skill</span>
            <span className="logo-bridge">Bridge</span>
          </Link>
        </header>
        <main className="team-dashboard-page" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#10243E' }}>Project Not Found</h2>
          <p style={{ color: '#53677F', margin: '10px 0 20px' }}>{notice.text || 'Unable to load project information.'}</p>
          <Link to="/current-projects" className="team-dashboard-back">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </main>
      </div>
    );
  }

  const {
    project,
    members = [],
    pendingRequests = [],
    capacity = { current: members.length, maximum: project.maxMembers || 5, full: false },
    tasks = [],
    milestones = [],
    updates = []
  } = data;

  const currentUserId = String(user?._id || user?.id || '');
  const ownerId = String(project.owner?._id || project.owner || '');
  const isOwner = currentUserId === ownerId;

  // Completed tasks count and progress
  const completedTasks = tasks.filter((item) => item.status === 'Completed').length;
  const progressValue = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : Number(project.progress || 0);

  // Status update handler
  const handleStatusChange = async (newStatus) => {
    try {
      await updateProjectStatus(id, newStatus);
      showNotification(`Project status updated to ${newStatus}.`);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update status.', 'error');
    }
  };

  // Toggle task status
  const handleToggleTask = async (taskItem) => {
    const nextStatus = taskItem.status === 'Completed' ? 'Not Started' : 'Completed';
    try {
      await updateTeamTask(taskItem._id, { status: nextStatus });
      showNotification(`Task marked as ${nextStatus}.`);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update task.', 'error');
    }
  };

  // Change task status dropdown
  const handleTaskStatusDropdown = async (taskItem, newStatus) => {
    try {
      await updateTeamTask(taskItem._id, { status: newStatus });
      showNotification(`Task status set to ${newStatus}.`);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update task.', 'error');
    }
  };

  // Add new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await createTeamTask(id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assignee: taskForm.assignee || currentUserId,
        priority: taskForm.priority || 'Medium',
        deadline: taskForm.deadline || ''
      });
      showNotification('New task created successfully.');
      setIsAddTaskOpen(false);
      setTaskForm({ title: '', description: '', assignee: '', priority: 'Medium', deadline: '' });
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to create task.', 'error');
    }
  };

  // Add new milestone
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) return;
    try {
      await createTeamMilestone(id, {
        title: milestoneForm.title.trim(),
        dueDate: milestoneForm.dueDate || ''
      });
      showNotification('Milestone added successfully.');
      setIsAddMilestoneOpen(false);
      setMilestoneForm({ title: '', dueDate: '' });
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to add milestone.', 'error');
    }
  };

  // Toggle milestone completion
  const handleToggleMilestone = async (milestoneItem) => {
    try {
      await updateTeamMilestone(milestoneItem._id, { completed: !milestoneItem.completed });
      showNotification(
        milestoneItem.completed ? 'Milestone marked incomplete.' : 'Milestone marked completed!'
      );
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update milestone.', 'error');
    }
  };

  // Add team member directly
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberForm.studentId) return;
    try {
      await addTeamMember(id, {
        studentId: addMemberForm.studentId,
        role: addMemberForm.role
      });
      showNotification('Team member added successfully.');
      setIsInviteMemberOpen(false);
      setAddMemberForm({ studentId: '', role: 'Full Stack Developer' });
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to add team member.', 'error');
    }
  };

  // Remove team member
  const handleRemoveMember = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName || 'this student'} from the team?`)) {
      return;
    }
    try {
      await removeTeamMember(id, studentId);
      showNotification('Member removed from team.');
      setActiveMenuMemberId(null);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to remove member.', 'error');
    }
  };

  // Update member role
  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await updateTeamMemberRole(id, selectedMember.student._id, selectedMember.role);
      showNotification('Team member role updated.');
      setIsChangeRoleOpen(false);
      setSelectedMember(null);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update role.', 'error');
    }
  };

  // Edit project details
  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      await updateProject(id, editProjectForm);
      showNotification('Project details updated successfully.');
      setIsEditProjectOpen(false);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update project.', 'error');
    }
  };

  // Post quick progress update
  const handlePostQuickUpdate = async (e) => {
    e.preventDefault();
    if (!quickUpdate.trim()) return;
    try {
      await createProgressUpdate(id, { message: quickUpdate.trim() });
      showNotification('Progress update posted to timeline.');
      setQuickUpdate('');
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to post update.', 'error');
    }
  };

  // Accept or reject join request
  const handleRequestAction = async (requestId, newStatus) => {
    try {
      await updateJoinRequest(requestId, newStatus);
      showNotification(`Join request ${newStatus.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to process request.', 'error');
    }
  };

  // Filter out students who are already team members for the invite dropdown
  const memberStudentIds = new Set(members.map((m) => String(m.student?._id)));
  if (project.owner?._id) memberStudentIds.add(String(project.owner._id));
  const availableInvitees = allStudents.filter((s) => !memberStudentIds.has(String(s._id)));

  return (
    <div className="team-dashboard-shell">
      {/* 1. Top Navigation Bar */}
      <header className="team-dashboard-navbar">
        <Link to="/" className="team-dashboard-logo">
          <span className="logo-skill">Skill</span>
          <span className="logo-bridge">Bridge</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/discover">Explore</Link>
          <Link to="/workshops">Workshops</Link>
          <Link to="/communities">Communities</Link>
        </nav>

        <div className="team-dashboard-nav-actions">
          <Link to="/notifications" className="team-nav-bell" aria-label="Notifications">
            <Bell size={19} />
            <span className="team-nav-bell-dot" />
          </Link>
          <Link to="/profile" className="team-nav-profile-group">
            <div className="team-dashboard-nav-avatar">
              <img
                src={viewerProfile?.avatar || user?.avatar || '/college-building.png'}
                alt="Profile"
              />
            </div>
            <ChevronDown size={15} className="team-nav-chevron" />
          </Link>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="team-dashboard-page">
        {/* 2. Back to Projects Link */}
        <Link to="/current-projects" className="team-dashboard-back">
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        {/* Notice alert */}
        {notice.text && (
          <div className={`team-notice ${notice.type === 'error' ? 'error' : 'success'}`}>
            <span>{notice.text}</span>
            <button
              className="team-notice-close"
              onClick={() => setNotice({ text: '', type: '' })}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        {/* 3. Project Hero Banner */}
        <section className="team-dashboard-hero">
          {/* Elegant gold curved lines */}
          <svg className="team-hero-waves" viewBox="0 0 500 150" fill="none" preserveAspectRatio="none">
            <path
              d="M 0 150 C 140 150, 220 50, 500 10"
              stroke="#C99A32"
              strokeWidth="1.8"
              strokeOpacity="0.85"
            />
            <path
              d="M 50 150 C 180 145, 270 90, 500 55"
              stroke="#E5BB63"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
          </svg>

          <div className="team-dashboard-hero-content">
            <div className="team-hero-left">
              {/* Laptop project briefcase icon in gold */}
              <div className="team-dashboard-project-icon">
                <Laptop size={34} strokeWidth={1.8} />
              </div>

              <div className="team-dashboard-hero-copy">
                <span className="team-dashboard-eyebrow">PROJECT TEAM</span>
                <h1>{capitalize(project.title || 'Job Portal')}</h1>
                <p>{capitalize(project.description || 'Website for searching jobs')}</p>

                <div className="team-dashboard-meta">
                  <span>
                    <Users size={14} /> {capacity.current} / {capacity.maximum} Members
                  </span>
                  <span>
                    <CalendarDays size={14} />{' '}
                    {project.startDate && project.completionDate
                      ? `${formatDate(project.startDate)} - ${formatDate(project.completionDate)}`
                      : 'Nov 12, 2026 - Nov 30, 2026'}
                  </span>
                  <span className="team-dashboard-status">
                    <Layers size={13} /> {project.status || 'Planning'}
                  </span>
                </div>
              </div>
            </div>

            <div className="team-dashboard-hero-actions">
              {isOwner && (
                <button
                  className="team-dashboard-edit-button"
                  onClick={() => setIsEditProjectOpen(true)}
                >
                  <Pencil size={14} /> Edit Project
                </button>
              )}
              <button
                className="team-dashboard-invite-button"
                onClick={() => setIsInviteMemberOpen(true)}
              >
                <UserPlus size={15} /> Invite Member
              </button>
            </div>
          </div>
        </section>

        {/* 4. Five-Section Statistics Overview Card */}
        <section className="team-dashboard-statistics">
          {/* Section 1: Overall Progress */}
          <div className="team-stat-progress">
            <div
              className="team-progress-ring"
              style={{ '--progress': `${progressValue * 3.6}deg` }}
            >
              <span>{progressValue}%</span>
            </div>
            <div className="team-stat-progress-text">
              <strong>Overall Progress</strong>
              <small>{completedTasks} of {tasks.length} tasks completed</small>
              <div className="team-stat-bar">
                <span style={{ width: `${progressValue}%` }} />
              </div>
            </div>
          </div>

          {/* Section 2: Tasks */}
          <div className="team-stat-col">
            <div className="team-stat-header">
              <ClipboardCheck size={16} />
              <span>Tasks</span>
            </div>
            <div className="team-stat-number">{tasks.length}</div>
            <div className="team-stat-subtext">Total Tasks</div>
          </div>

          {/* Section 3: Milestones */}
          <div className="team-stat-col">
            <div className="team-stat-header">
              <Flag size={16} />
              <span>Milestones</span>
            </div>
            <div className="team-stat-number">{milestones.length}</div>
            <div className="team-stat-subtext">Total Milestones</div>
          </div>

          {/* Section 4: Members */}
          <div className="team-stat-col">
            <div className="team-stat-header">
              <UsersRound size={16} />
              <span>Members</span>
            </div>
            <div className="team-stat-number">
              {capacity.current} / {capacity.maximum}
            </div>
            <div className="team-stat-subtext">Team Members</div>
          </div>

          {/* Section 5: Project Status */}
          <div className="team-stat-col">
            <div className="team-stat-header">
              <Layers size={16} />
              <span>Project Status</span>
            </div>
            <div>
              <select
                className="team-stat-status-select"
                value={project.status || 'Planning'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={!isOwner}
                aria-label="Project Status"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </section>

        {/* 5. Two-Column Dashboard Grid */}
        <div className="team-dashboard-grid">
          {/* Column 1: Team Members & Tasks */}
          <div className="team-grid-column">
            {/* Left Card 1: Team Members */}
            <section className="team-section-card">
              <div className="team-card-header">
                <div className="team-card-header-left">
                  <UsersRound size={18} />
                  <h2>Team Members ({capacity.current} / {capacity.maximum})</h2>
                </div>
                {isOwner && (
                  <button
                    className="btn-card-add-member"
                    onClick={() => setIsInviteMemberOpen(true)}
                  >
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </div>

              <div className="team-members-list">
                {members.map((member) => {
                  const student = member.student || {};
                  const isThisOwner = member.isOwner;
                  const isMenuOpen = activeMenuMemberId === member._id;

                  return (
                    <div className="team-member-item" key={member._id}>
                      <div className="team-member-info">
                        <div className="team-member-avatar">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name || 'Member'} />
                          ) : (
                            (student.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="team-member-details">
                          <div className="team-member-name-row">
                            <Link
                              to={`/students/${student._id}`}
                              className="team-member-name"
                            >
                              {student.name || 'Student'}
                            </Link>
                            {isThisOwner && <span className="team-owner-badge">Owner</span>}
                          </div>
                          <div className="team-member-role">
                            {member.role || 'Full Stack Developer'}
                          </div>
                        </div>
                      </div>

                      <div className="team-member-actions" ref={isMenuOpen ? menuRef : null}>
                        {isThisOwner ? (
                          <a
                            href={`mailto:${student.email || 'student@skillbridge.edu'}`}
                            className="btn-member-action"
                            title="Send email"
                            aria-label={`Send email to ${student.name}`}
                          >
                            <Mail size={15} />
                          </a>
                        ) : (
                          <>
                            <button
                              className="btn-member-action"
                              onClick={() =>
                                setActiveMenuMemberId(isMenuOpen ? null : member._id)
                              }
                              title="Member Options"
                              aria-label={`Options for ${student.name}`}
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {isMenuOpen && (
                              <div className="team-member-menu">
                                <Link
                                  to={`/students/${student._id}`}
                                  className="team-member-menu-item"
                                >
                                  <ExternalLink size={13} /> View Profile
                                </Link>
                                {isOwner && (
                                  <>
                                    <button
                                      className="team-member-menu-item"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setIsChangeRoleOpen(true);
                                        setActiveMenuMemberId(null);
                                      }}
                                    >
                                      <Pencil size={13} /> Change Role
                                    </button>
                                    <button
                                      className="team-member-menu-item danger"
                                      onClick={() =>
                                        handleRemoveMember(student._id, student.name)
                                      }
                                    >
                                      <Trash2 size={13} /> Remove Member
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Left Card 2: My Tasks & Team Tasks */}
            <section className="team-section-card">
              <div className="team-card-header">
                <div className="team-card-header-left">
                  <ClipboardCheck size={18} />
                  <h2>My Tasks &amp; Team Tasks</h2>
                </div>
                <div className="team-card-header-right">
                  {completedTasks} / {tasks.length} complete
                </div>
              </div>

              <div className="team-tasks-list">
                {tasks.length > 0 ? (
                  tasks.map((taskItem) => {
                    const isCompleted = taskItem.status === 'Completed';
                    const assigneeName = taskItem.assignee?.name || 'Unassigned';

                    return (
                      <div className="team-task-item" key={taskItem._id}>
                        <div className="team-task-left">
                          <button
                            className={`team-task-checkbox ${isCompleted ? 'completed' : ''}`}
                            onClick={() => handleToggleTask(taskItem)}
                            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {isCompleted ? (
                              <CheckSquare size={18} />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>

                          <div className="team-task-details">
                            <h3 className={`team-task-title ${isCompleted ? 'completed' : ''}`}>
                              {capitalize(taskItem.title)}
                            </h3>
                            <div className="team-task-meta">
                              <span>
                                <UserRound size={12} /> Assigned to: {assigneeName}
                              </span>
                              <span>
                                <Flag size={12} /> Priority: {taskItem.priority || 'Medium'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="team-task-right">
                          <select
                            className="team-task-status-select"
                            value={taskItem.status || 'Not Started'}
                            onChange={(e) => handleTaskStatusDropdown(taskItem, e.target.value)}
                            aria-label={`Status for ${taskItem.title}`}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#53677F', fontSize: '13px', margin: '8px 0' }}>
                    No tasks added yet.
                  </p>
                )}

                {isOwner && (
                  <button
                    className="btn-add-task"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                    <Plus size={15} /> Add Task
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Column 2: Project Timeline & Milestones */}
          <div className="team-grid-column">
            {/* Right Card 1: Project Timeline */}
            <section className="team-section-card">
              <div className="team-card-header">
                <div className="team-card-header-left">
                  <Clock size={18} />
                  <h2>Project Timeline</h2>
                </div>
              </div>

              <div className="team-timeline-list">
                <div className="team-timeline-line" />

                {/* Event 1: Project created */}
                <div className="timeline-entry">
                  <div className="timeline-dot" />
                  <div className="timeline-entry-title">Project created</div>
                  <div className="timeline-entry-meta">
                    <span className="timeline-entry-date">
                      {formatDate(project.createdAt)} by {project.owner?.name || 'Owner'}
                    </span>
                  </div>
                </div>

                {/* Event 2: Team members joined */}
                {members
                  .filter((m) => !m.isOwner)
                  .map((m) => (
                    <div className="timeline-entry" key={m._id}>
                      <div className="timeline-dot" />
                      <div className="timeline-entry-title">
                        {m.student?.name || 'Student'} joined the team
                      </div>
                      <div className="timeline-entry-meta">
                        <span className="timeline-entry-date">
                          {formatDate(m.joinedAt || project.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Event 3+: Progress updates */}
                {updates.map((item) => (
                  <div className="timeline-entry" key={item._id}>
                    <div className="timeline-dot" />
                    <div className="timeline-entry-title">
                      {item.author?.name || 'Team member'} shared a progress update
                    </div>
                    {item.message && (
                      <div className="timeline-entry-desc">
                        {capitalize(item.message)}
                      </div>
                    )}
                    <div className="timeline-entry-meta">
                      <span className="timeline-entry-time">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick progress update input */}
              <form onSubmit={handlePostQuickUpdate} className="timeline-quick-post">
                <input
                  type="text"
                  placeholder="Share a quick progress update…"
                  value={quickUpdate}
                  onChange={(e) => setQuickUpdate(e.target.value)}
                />
                <button type="submit">Post Update</button>
              </form>
            </section>

            {/* Right Card 2: Milestones */}
            <section className="team-section-card">
              <div className="team-card-header">
                <div className="team-card-header-left">
                  <Flag size={18} />
                  <h2>Milestones</h2>
                </div>
                <div className="team-card-header-right">
                  {milestones.filter((m) => m.completed).length} / {milestones.length} complete
                </div>
              </div>

              {milestones.length === 0 ? (
                <div className="milestones-empty-state">
                  <div className="milestone-empty-icon">
                    <CalendarDays size={24} />
                  </div>
                  <p>No milestones added yet.</p>
                  {isOwner && (
                    <button
                      className="btn-add-milestone"
                      onClick={() => setIsAddMilestoneOpen(true)}
                    >
                      <Plus size={15} /> Add Milestone
                    </button>
                  )}
                </div>
              ) : (
                <div className="team-milestones-list">
                  {milestones.map((item) => (
                    <div className="team-milestone-item" key={item._id}>
                      <div className="team-milestone-left">
                        <button
                          className="team-milestone-toggle"
                          onClick={() => handleToggleMilestone(item)}
                          aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {item.completed ? (
                            <CheckCircle2 size={18} color="#C99A32" />
                          ) : (
                            <Circle size={18} color="#A39686" />
                          )}
                        </button>
                        <div>
                          <h3
                            className={`team-milestone-title ${item.completed ? 'completed' : ''}`}
                          >
                            {capitalize(item.title)}
                          </h3>
                          {item.dueDate && (
                            <div className="team-milestone-due">
                              Due: {formatDate(item.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isOwner && (
                    <button
                      className="btn-add-milestone"
                      onClick={() => setIsAddMilestoneOpen(true)}
                    >
                      <Plus size={15} /> Add Milestone
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ====================================================================
          MODALS
         ==================================================================== */}

      {/* 1. Edit Project Modal */}
      {isEditProjectOpen && (
        <div className="team-modal-backdrop" onClick={() => setIsEditProjectOpen(false)}>
          <div className="team-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Edit Project</h3>
              <button
                className="team-modal-close"
                onClick={() => setIsEditProjectOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditProject}>
              <div className="team-modal-body">
                <div className="team-form-group">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    required
                    value={editProjectForm.title}
                    onChange={(e) =>
                      setEditProjectForm({ ...editProjectForm, title: e.target.value })
                    }
                  />
                </div>
                <div className="team-form-group">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editProjectForm.description}
                    onChange={(e) =>
                      setEditProjectForm({ ...editProjectForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="team-form-row">
                  <div className="team-form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={editProjectForm.startDate}
                      onChange={(e) =>
                        setEditProjectForm({ ...editProjectForm, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="team-form-group">
                    <label>Completion Date</label>
                    <input
                      type="date"
                      value={editProjectForm.completionDate}
                      onChange={(e) =>
                        setEditProjectForm({
                          ...editProjectForm,
                          completionDate: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="team-form-row">
                  <div className="team-form-group">
                    <label>Maximum Team Members</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editProjectForm.maxMembers}
                      onChange={(e) =>
                        setEditProjectForm({
                          ...editProjectForm,
                          maxMembers: Number(e.target.value)
                        })
                      }
                    />
                  </div>
                  <div className="team-form-group">
                    <label>Status</label>
                    <select
                      value={editProjectForm.status}
                      onChange={(e) =>
                        setEditProjectForm({ ...editProjectForm, status: e.target.value })
                      }
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsEditProjectOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Invite / Add Member Modal */}
      {isInviteMemberOpen && (
        <div className="team-modal-backdrop" onClick={() => setIsInviteMemberOpen(false)}>
          <div className="team-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Invite / Add Team Member</h3>
              <button
                className="team-modal-close"
                onClick={() => setIsInviteMemberOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="team-modal-body">
                <div className="team-form-group">
                  <label>Select Student *</label>
                  <select
                    required
                    value={addMemberForm.studentId}
                    onChange={(e) =>
                      setAddMemberForm({ ...addMemberForm, studentId: e.target.value })
                    }
                  >
                    <option value="">-- Choose a student to add --</option>
                    {availableInvitees.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.department || 'Engineering'} · {s.year || 'Student'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="team-form-group">
                  <label>Assigned Role *</label>
                  <select
                    value={addMemberForm.role}
                    onChange={(e) =>
                      setAddMemberForm({ ...addMemberForm, role: e.target.value })
                    }
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pending Join Requests section */}
                {pendingRequests.length > 0 && (
                  <div className="pending-requests-section">
                    <h4>Pending Join Requests ({pendingRequests.length})</h4>
                    {pendingRequests.map((req) => (
                      <div className="pending-request-item" key={req._id}>
                        <div>
                          <strong>{req.applicant?.name}</strong>
                          <div style={{ fontSize: '11px', color: '#53677F' }}>
                            {req.applicant?.department} · {req.applicant?.year}
                          </div>
                        </div>
                        <div className="pending-request-actions">
                          <button
                            type="button"
                            className="btn-req-accept"
                            onClick={() => handleRequestAction(req._id, 'Accepted')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn-req-reject"
                            onClick={() => handleRequestAction(req._id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsInviteMemberOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Task Modal */}
      {isAddTaskOpen && (
        <div className="team-modal-backdrop" onClick={() => setIsAddTaskOpen(false)}>
          <div className="team-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Add New Task</h3>
              <button
                className="team-modal-close"
                onClick={() => setIsAddTaskOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="team-modal-body">
                <div className="team-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Create a feature called explore events"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>
                <div className="team-form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief details about this task…"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                </div>
                <div className="team-form-row">
                  <div className="team-form-group">
                    <label>Assign To</label>
                    <select
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                    >
                      <option value="">Assign to Me</option>
                      {members.map((m) => (
                        <option key={m.student?._id} value={m.student?._id}>
                          {m.student?.name} ({m.role || 'Member'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="team-form-group">
                    <label>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="team-form-group">
                  <label>Deadline Date</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddTaskOpen(false)}
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

      {/* 4. Add Milestone Modal */}
      {isAddMilestoneOpen && (
        <div className="team-modal-backdrop" onClick={() => setIsAddMilestoneOpen(false)}>
          <div className="team-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Add New Milestone</h3>
              <button
                className="team-modal-close"
                onClick={() => setIsAddMilestoneOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMilestone}>
              <div className="team-modal-body">
                <div className="team-form-group">
                  <label>Milestone Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete User Authentication Flow"
                    value={milestoneForm.title}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, title: e.target.value })
                    }
                  />
                </div>
                <div className="team-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddMilestoneOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Change Role Modal */}
      {isChangeRoleOpen && selectedMember && (
        <div className="team-modal-backdrop" onClick={() => setIsChangeRoleOpen(false)}>
          <div className="team-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Change Role for {selectedMember.student?.name}</h3>
              <button
                className="team-modal-close"
                onClick={() => setIsChangeRoleOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangeRole}>
              <div className="team-modal-body">
                <div className="team-form-group">
                  <label>New Role</label>
                  <select
                    value={selectedMember.role}
                    onChange={(e) =>
                      setSelectedMember({ ...selectedMember, role: e.target.value })
                    }
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsChangeRoleOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
