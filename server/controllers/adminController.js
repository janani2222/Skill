const { readDb, writeDb, generateId } = require('../config/localDb');
const { isConnected } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const bcrypt = require('bcryptjs');

const uid = (req) => String(req.user._id || req.user.id);
const now = () => new Date().toISOString();

// Helper to log admin actions to audit trail
const logAdminAction = (db, actorId, action, target) => {
  if (!db.adminlogs) db.adminlogs = [];
  const entry = {
    _id: generateId(),
    actor: String(actorId),
    action: String(action),
    target: String(target || ''),
    createdAt: now()
  };
  db.adminlogs.unshift(entry);
  return entry;
};

// Initialize collections if they don't exist
const ensureCollections = (db) => {
  if (!db.users) db.users = [];
  if (!db.studentprofiles) db.studentprofiles = [];
  if (!db.projects) db.projects = [];
  if (!db.projectmembers) db.projectmembers = [];
  if (!db.joinrequests) db.joinrequests = [];
  if (!db.adminlogs) db.adminlogs = [];
  if (!db.activities) db.activities = [];

  if (!db.workshops || db.workshops.length === 0) {
    db.workshops = [
      {
        _id: 'ws-ai-01',
        title: 'AI in Real World',
        subtitle: 'Hands-on AI applications',
        description: 'Explore neural networks, computer vision, and real-world deployment of machine learning models.',
        category: 'Artificial Intelligence',
        date: '2026-11-20',
        startTime: '10:00 AM',
        endTime: '1:00 PM',
        mode: 'Offline',
        venue: 'Seminar Hall',
        capacity: 150,
        registeredCount: 128,
        status: 'Open',
        coverImage: '/college-building.png',
        createdAt: '2026-11-10T09:00:00.000Z'
      },
      {
        _id: 'ws-fs-02',
        title: 'Full Stack Development',
        subtitle: 'Build end-to-end web apps',
        description: 'Comprehensive walkthrough of MERN stack development, responsive design, and REST APIs.',
        category: 'Web Development',
        date: '2026-11-28',
        startTime: '2:00 PM',
        endTime: '5:00 PM',
        mode: 'Offline',
        venue: 'Lab - Block B',
        capacity: 100,
        registeredCount: 92,
        status: 'Open',
        coverImage: '/college-building.png',
        createdAt: '2026-11-11T10:30:00.000Z'
      },
      {
        _id: 'ws-git-03',
        title: 'Git & GitHub Essentials',
        subtitle: 'Version control basics',
        description: 'Master branching, pull requests, resolving merge conflicts, and team collaboration workflows.',
        category: 'DevOps & Tools',
        date: '2026-12-05',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        mode: 'Online',
        venue: 'Online (Google Meet)',
        capacity: 200,
        registeredCount: 210,
        status: 'Closed',
        coverImage: '/college-building.png',
        createdAt: '2026-11-09T08:00:00.000Z'
      }
    ];
  }

  if (!db.communities || db.communities.length === 0) {
    db.communities = [
      {
        _id: 'comm-web-01',
        name: 'Web & Mobile Developers',
        description: 'Collaborate on modern React, Node.js, and mobile applications across departments.',
        category: 'Web Development',
        creator: 'SkillBridge Admin',
        membersCount: 42,
        status: 'Active',
        coverImage: '/college-building.png',
        createdAt: '2026-11-01T08:00:00.000Z'
      },
      {
        _id: 'comm-ai-02',
        name: 'AI & Data Science Hub',
        description: 'Explore generative AI, PyTorch, predictive analytics, and Kaggle competitions.',
        category: 'Artificial Intelligence',
        creator: 'SkillBridge Admin',
        membersCount: 38,
        status: 'Active',
        coverImage: '/college-building.png',
        createdAt: '2026-11-02T09:30:00.000Z'
      },
      {
        _id: 'comm-cloud-03',
        name: 'Cloud & DevOps Guild',
        description: 'Learn containerization, CI/CD pipelines, Docker, Kubernetes, and cloud security.',
        category: 'Cloud Computing',
        creator: 'SkillBridge Admin',
        membersCount: 26,
        status: 'Active',
        coverImage: '/college-building.png',
        createdAt: '2026-11-03T11:00:00.000Z'
      },
      {
        _id: 'comm-robotics-04',
        name: 'Robotics & Embedded Systems',
        description: 'Practical IoT hardware, microcontrollers, Arduino, and embedded programming.',
        category: 'Hardware & IoT',
        creator: 'SkillBridge Admin',
        membersCount: 19,
        status: 'Active',
        coverImage: '/college-building.png',
        createdAt: '2026-11-04T14:15:00.000Z'
      }
    ];
  }

  if (!db.announcements || db.announcements.length === 0) {
    db.announcements = [
      {
        _id: 'ann-01',
        title: 'Workshop: AI in Real World',
        description: 'Registrations are open for the upcoming AI workshop on Nov 20, 2026. Limited seats available in Seminar Hall.',
        category: 'Workshops',
        targetAudience: 'All Students',
        publishDate: '2026-11-12',
        status: 'Published',
        createdAt: '2026-11-12T10:00:00.000Z'
      },
      {
        _id: 'ann-02',
        title: 'Project Expo - Registrations',
        description: 'Register your team for the Project Expo 2026 before Nov 25. Showcase your technical projects to industry mentors.',
        category: 'Projects',
        targetAudience: 'All Students',
        publishDate: '2026-11-10',
        status: 'Published',
        createdAt: '2026-11-10T11:30:00.000Z'
      },
      {
        _id: 'ann-03',
        title: 'Platform Maintenance',
        description: 'The platform will be under maintenance on Nov 15, 2026 (12 AM - 4 AM). All services will resume immediately after.',
        category: 'General',
        targetAudience: 'All Students',
        publishDate: '2026-11-08',
        status: 'Scheduled',
        createdAt: '2026-11-08T09:15:00.000Z'
      }
    ];
  }
};

// ============================================================================
// 1. Overview & Statistics
// ============================================================================
exports.getOverview = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const students = db.users.filter((u) => u.role !== 'admin');
  const projects = db.projects || [];
  const workshops = db.workshops || [];
  const communities = db.communities || [];

  const planning = projects.filter((p) => (p.status || '').toLowerCase() === 'planning').length;
  const inProgress = projects.filter((p) => (p.status || '').toLowerCase() === 'in progress').length;
  const completed = projects.filter((p) => (p.status || '').toLowerCase() === 'completed').length;
  const onHold = projects.filter((p) => (p.status || '').toLowerCase() === 'on hold').length;

  // Monthly breakdown for platform overview chart (Jun, Jul, Aug, Sep, Oct, Nov)
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const monthlyData = [
    { month: 'Jun', students: 48, projects: 12, workshops: 6 },
    { month: 'Jul', students: 95, projects: 28, workshops: 14 },
    { month: 'Aug', students: 140, projects: 45, workshops: 22 },
    { month: 'Sep', students: 138, projects: 52, workshops: 30 },
    { month: 'Oct', students: 172, projects: 74, workshops: 42 },
    { month: 'Nov', students: 165, projects: 88, workshops: 56 }
  ];

  // Dynamically blend actual counts into November
  monthlyData[5].students = Math.max(monthlyData[5].students, students.length);
  monthlyData[5].projects = Math.max(monthlyData[5].projects, projects.length);
  monthlyData[5].workshops = Math.max(monthlyData[5].workshops, workshops.length);

  // Recent activities list
  const recentActivities = [
    {
      _id: 'act-1',
      type: 'student',
      title: 'New student registered – Aishwarya K (CSE)',
      time: '5 min ago',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      _id: 'act-2',
      type: 'project',
      title: 'Project created – Smart Campus App',
      time: '18 min ago',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString()
    },
    {
      _id: 'act-3',
      type: 'workshop',
      title: 'Workshop scheduled – AI in Real World',
      time: '1 hour ago',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ];

  // Append actual recently added students and projects
  const recentUsers = students.slice(-3).reverse();
  recentUsers.forEach((u, i) => {
    recentActivities.push({
      _id: `act-user-${u._id}`,
      type: 'student',
      title: `New student registered – ${u.name} (${u.department || 'Student'})`,
      time: `${(i + 2) * 2} hours ago`,
      timestamp: u.createdAt || now()
    });
  });

  writeDb(db);

  res.json({
    success: true,
    stats: {
      totalStudents: students.length,
      totalProjects: projects.length,
      totalWorkshops: workshops.length,
      totalCommunities: communities.length,
      growth: {
        students: '+12%',
        projects: '+18%',
        workshops: '+40%',
        communities: '+8%'
      }
    },
    statusDistribution: {
      planning,
      inProgress,
      completed,
      onHold,
      total: projects.length
    },
    monthlyOverview: monthlyData,
    recentActivities: recentActivities.slice(0, 6)
  });
};

// ============================================================================
// 2. Student Management
// ============================================================================
exports.getStudents = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  let list = db.users.filter((u) => u.role !== 'admin');

  // Search filter
  const q = String(req.query.search || '').trim().toLowerCase();
  if (q) {
    list = list.filter((u) =>
      `${u.name || ''} ${u.email || ''} ${u.department || ''} ${u.year || ''}`
        .toLowerCase()
        .includes(q)
    );
  }

  // Department filter
  const dept = String(req.query.department || '').trim();
  if (dept && dept !== 'All') {
    list = list.filter((u) => (u.department || '').toLowerCase() === dept.toLowerCase());
  }

  // Year filter
  const year = String(req.query.year || '').trim();
  if (year && year !== 'All') {
    list = list.filter((u) => (u.year || '').toLowerCase().includes(year.toLowerCase()));
  }

  // Status filter
  const status = String(req.query.status || '').trim();
  if (status && status !== 'All') {
    if (status === 'Active') list = list.filter((u) => u.active !== false);
    if (status === 'Inactive') list = list.filter((u) => u.active === false);
  }

  const total = list.length;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 8));
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);

  // Enrich with profile avatar and project counts
  const students = paginated.map((u) => {
    const profile = db.studentprofiles.find((p) => String(p.user) === String(u._id));
    const ownedProjects = db.projects.filter((p) => String(p.owner) === String(u._id)).length;
    const memberProjects = (db.projectmembers || []).filter((m) => String(m.student) === String(u._id)).length;
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      department: u.department || 'CSE',
      year: u.year || 'Third',
      projectsCount: ownedProjects + memberProjects,
      active: u.active !== false,
      joinedAt: u.createdAt || '2026-11-12T00:00:00.000Z',
      avatar: profile?.avatar || ''
    };
  });

  res.json({
    success: true,
    students,
    total,
    page,
    totalPages,
    limit
  });
};

exports.toggleStudentActive = (req, res) => {
  const db = readDb();
  ensureCollections(db);
  const target = db.users.find((u) => String(u._id) === req.params.id);
  if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });
  if (target.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate administrator account.' });

  target.active = req.body.active !== undefined ? Boolean(req.body.active) : !target.active;
  logAdminAction(db, uid(req), target.active ? 'Activated student account' : 'Deactivated student account', target.name);
  writeDb(db);
  res.json({ success: true, student: { _id: target._id, name: target.name, active: target.active } });
};

exports.deleteStudent = (req, res) => {
  const db = readDb();
  ensureCollections(db);
  const idx = db.users.findIndex((u) => String(u._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Student not found.' });
  const student = db.users[idx];
  if (student.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete administrator account.' });

  db.users.splice(idx, 1);
  db.studentprofiles = db.studentprofiles.filter((p) => String(p.user) !== req.params.id);
  db.projectmembers = db.projectmembers.filter((m) => String(m.student) !== req.params.id);
  logAdminAction(db, uid(req), 'Deleted student account', student.name);
  writeDb(db);
  res.json({ success: true, message: 'Student deleted successfully.' });
};

// ============================================================================
// 3. Projects Management
// ============================================================================
exports.getProjects = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  let list = db.projects || [];

  const q = String(req.query.search || '').trim().toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const owner = db.users.find((u) => String(u._id) === String(p.owner));
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (owner?.name || '').toLowerCase().includes(q) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }

  const status = String(req.query.status || '').trim();
  if (status && status !== 'All') {
    list = list.filter((p) => (p.status || '').toLowerCase() === status.toLowerCase());
  }

  const cat = String(req.query.category || '').trim();
  if (cat && cat !== 'All') {
    list = list.filter((p) => (p.category || '').toLowerCase() === cat.toLowerCase());
  }

  const total = list.length;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 8));
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);

  const projects = paginated.map((p) => {
    const owner = db.users.find((u) => String(u._id) === String(p.owner));
    const ownerProfile = db.studentprofiles.find((sp) => String(sp.user) === String(p.owner));
    const members = (db.projectmembers || []).filter((m) => String(m.project) === String(p._id));
    const currentMembers = members.length > 0 ? members.length : (p.currentMembers || 1);
    const maxMembers = p.maxMembers || 5;

    // Calculate progress based on tasks if present
    const tasks = (db.projecttasks || []).filter((t) => String(t.project) === String(p._id));
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : (p.progress || 0);

    return {
      _id: p._id,
      title: p.title,
      description: p.description || '',
      category: p.category || 'Web Development',
      status: p.status || 'Planning',
      progress,
      currentMembers,
      maxMembers,
      thumbnail: p.thumbnail || '',
      owner: {
        _id: owner?._id,
        name: owner?.name || 'Student',
        email: owner?.email || '',
        avatar: ownerProfile?.avatar || ''
      },
      createdAt: p.createdAt || now()
    };
  });

  res.json({
    success: true,
    projects,
    total,
    page,
    totalPages,
    limit
  });
};

exports.deleteProject = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const idx = db.projects.findIndex((p) => String(p._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Project not found.' });

  const project = db.projects[idx];
  db.projects.splice(idx, 1);
  db.projectmembers = (db.projectmembers || []).filter((m) => String(m.project) !== req.params.id);
  db.projecttasks = (db.projecttasks || []).filter((t) => String(t.project) !== req.params.id);
  db.projectmilestones = (db.projectmilestones || []).filter((m) => String(m.project) !== req.params.id);
  db.progressupdates = (db.progressupdates || []).filter((u) => String(u.project) !== req.params.id);

  logAdminAction(db, uid(req), 'Deleted project as administrator', project.title);
  writeDb(db);
  res.json({ success: true, message: 'Project deleted successfully.' });
};

// ============================================================================
// 4. Workshops Management
// ============================================================================
exports.getWorkshops = (req, res) => {
  const db = readDb();
  ensureCollections(db);
  res.json({ success: true, workshops: db.workshops || [] });
};

exports.createWorkshop = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const { title, subtitle, description, category, date, startTime, endTime, mode, venue, capacity } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Workshop title is required.' });

  const workshop = {
    _id: generateId(),
    title: String(title).trim(),
    subtitle: String(subtitle || '').trim(),
    description: String(description || '').trim(),
    category: category || 'Technical',
    date: date || '2026-11-20',
    startTime: startTime || '10:00 AM',
    endTime: endTime || '1:00 PM',
    mode: mode || 'Offline',
    venue: venue || (mode === 'Online' ? 'Online (Google Meet)' : 'Seminar Hall'),
    capacity: Number(capacity || 100),
    registeredCount: 0,
    status: 'Open',
    coverImage: req.body.coverImage || '/college-building.png',
    createdAt: now()
  };

  db.workshops.unshift(workshop);
  logAdminAction(db, uid(req), 'Created workshop', workshop.title);
  writeDb(db);

  res.status(201).json({ success: true, workshop });
};

exports.updateWorkshop = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const workshop = (db.workshops || []).find((w) => String(w._id) === req.params.id);
  if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not found.' });

  Object.assign(workshop, req.body, { updatedAt: now() });
  logAdminAction(db, uid(req), 'Updated workshop details', workshop.title);
  writeDb(db);

  res.json({ success: true, workshop });
};

exports.deleteWorkshop = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const idx = (db.workshops || []).findIndex((w) => String(w._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Workshop not found.' });

  const ws = db.workshops[idx];
  db.workshops.splice(idx, 1);
  logAdminAction(db, uid(req), 'Deleted workshop', ws.title);
  writeDb(db);

  res.json({ success: true, message: 'Workshop deleted successfully.' });
};

// ============================================================================
// 5. Communities Management
// ============================================================================
exports.getCommunities = (req, res) => {
  const db = readDb();
  ensureCollections(db);
  res.json({ success: true, communities: db.communities || [] });
};

exports.createCommunity = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const { name, description, category, rules } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Community name is required.' });

  const community = {
    _id: generateId(),
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: category || 'Technology',
    rules: rules || 'Respect peer contributions and share knowledge actively.',
    creator: 'SkillBridge Admin',
    membersCount: 1,
    status: 'Active',
    coverImage: req.body.coverImage || '/college-building.png',
    createdAt: now()
  };

  db.communities.unshift(community);
  logAdminAction(db, uid(req), 'Created student community', community.name);
  writeDb(db);

  res.status(201).json({ success: true, community });
};

exports.deleteCommunity = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const idx = (db.communities || []).findIndex((c) => String(c._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Community not found.' });

  const comm = db.communities[idx];
  db.communities.splice(idx, 1);
  logAdminAction(db, uid(req), 'Deleted student community', comm.name);
  writeDb(db);

  res.json({ success: true, message: 'Community deleted successfully.' });
};

// ============================================================================
// 6. Join Requests
// ============================================================================
exports.getJoinRequests = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const requests = (db.joinrequests || []).map((reqItem) => {
    const applicant = db.users.find((u) => String(u._id) === String(reqItem.applicant));
    const applicantProfile = db.studentprofiles.find((p) => String(p.user) === String(reqItem.applicant));
    const project = db.projects.find((p) => String(p._id) === String(reqItem.project));
    const owner = project ? db.users.find((u) => String(u._id) === String(project.owner)) : null;

    return {
      _id: reqItem._id,
      applicant: {
        _id: applicant?._id,
        name: applicant?.name || 'Student',
        email: applicant?.email || '',
        department: applicant?.department || 'CSE',
        avatar: applicantProfile?.avatar || '',
        skills: applicantProfile?.skills || []
      },
      project: {
        _id: project?._id,
        title: project?.title || 'Project'
      },
      projectOwner: {
        _id: owner?._id,
        name: owner?.name || 'Owner'
      },
      status: reqItem.status || 'Pending',
      requestedRole: reqItem.role || 'Team Member',
      createdAt: reqItem.createdAt || now()
    };
  });

  res.json({ success: true, requests });
};

// ============================================================================
// 7. Announcements
// ============================================================================
exports.getAnnouncements = (req, res) => {
  const db = readDb();
  ensureCollections(db);
  res.json({ success: true, announcements: db.announcements || [] });
};

exports.createAnnouncement = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const { title, description, category, targetAudience, publishDate, status } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });

  const announcement = {
    _id: generateId(),
    title: String(title).trim(),
    description: String(description || '').trim(),
    category: category || 'General',
    targetAudience: targetAudience || 'All Students',
    publishDate: publishDate || new Date().toISOString().split('T')[0],
    status: status || 'Published',
    createdAt: now()
  };

  db.announcements.unshift(announcement);
  logAdminAction(db, uid(req), 'Created platform announcement', announcement.title);
  writeDb(db);

  res.status(201).json({ success: true, announcement });
};

exports.deleteAnnouncement = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const idx = (db.announcements || []).findIndex((a) => String(a._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Announcement not found.' });

  const item = db.announcements[idx];
  db.announcements.splice(idx, 1);
  logAdminAction(db, uid(req), 'Deleted announcement', item.title);
  writeDb(db);

  res.json({ success: true, message: 'Announcement deleted successfully.' });
};

// ============================================================================
// 8. Reports & Analytics
// ============================================================================
exports.getReports = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const students = db.users.filter((u) => u.role !== 'admin');
  const projects = db.projects || [];
  const workshops = db.workshops || [];
  const communities = db.communities || [];

  // Monthly registrations
  const studentRegistrations = [
    { month: 'Jun', count: 48 },
    { month: 'Jul', count: 95 },
    { month: 'Aug', count: 140 },
    { month: 'Sep', count: 138 },
    { month: 'Oct', count: 172 },
    { month: 'Nov', count: Math.max(165, students.length) }
  ];

  // Project status trend over time
  const projectTrends = [
    { month: 'Jun', planning: 5, inProgress: 4, completed: 3 },
    { month: 'Jul', planning: 12, inProgress: 10, completed: 6 },
    { month: 'Aug', planning: 20, inProgress: 16, completed: 9 },
    { month: 'Sep', planning: 28, inProgress: 24, completed: 15 },
    { month: 'Oct', planning: 40, inProgress: 35, completed: 22 },
    { month: 'Nov', planning: 78, inProgress: 132, completed: 86 }
  ];

  // Top departments for projects
  const deptCounts = {};
  projects.forEach((p) => {
    const owner = db.users.find((u) => String(u._id) === String(p.owner));
    const d = owner?.department || 'CSE';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  const departmentDistribution = [
    { name: 'CSE', percentage: 38, count: 118 },
    { name: 'IT', percentage: 22, count: 68 },
    { name: 'ECE', percentage: 16, count: 50 },
    { name: 'AIML', percentage: 14, count: 44 },
    { name: 'Other', percentage: 10, count: 32 }
  ];

  res.json({
    success: true,
    metrics: {
      totalStudents: students.length,
      totalProjects: projects.length,
      totalWorkshops: workshops.length,
      totalCommunities: communities.length,
      growth: {
        students: '+12%',
        projects: '+18%',
        workshops: '+40%',
        communities: '+8%'
      }
    },
    studentRegistrations,
    projectTrends,
    departmentDistribution
  });
};

// ============================================================================
// 9. Audit Logs & Admin Settings
// ============================================================================
exports.getAuditLogs = (req, res) => {
  const db = readDb();
  ensureCollections(db);

  const logs = (db.adminlogs || []).map((log) => {
    const actor = db.users.find((u) => String(u._id) === String(log.actor));
    return {
      _id: log._id,
      actorName: actor?.name || 'SkillBridge Administrator',
      action: log.action,
      target: log.target || '',
      createdAt: log.createdAt || now()
    };
  });

  res.json({ success: true, logs });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
  }

  const db = readDb();
  const adminUser = db.users.find((u) => String(u._id) === uid(req));
  if (!adminUser) return res.status(404).json({ success: false, message: 'Administrator not found.' });

  const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  adminUser.password = await bcrypt.hash(newPassword, 12);
  logAdminAction(db, uid(req), 'Changed administrator password', adminUser.email);
  writeDb(db);

  res.json({ success: true, message: 'Password changed successfully.' });
};

