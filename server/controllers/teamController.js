const mongoose = require('mongoose');
const { isConnected } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const StudentProfile = require('../models/StudentProfile');
const { readDb, writeDb, generateId } = require('../config/localDb');

const uid = (req) => String(req.user._id || req.user.id);
const now = () => new Date().toISOString();

const loadUserView = async (id) => {
  const sId = String(id || '');
  if (!sId) return null;
  if (isConnected()) {
    let u = null;
    try {
      if (mongoose.Types.ObjectId.isValid(sId)) {
        u = await User.findById(sId);
      }
    } catch {}
    if (!u) {
      try {
        u = await User.findOne({ $or: [{ _id: sId }, { email: sId.toLowerCase() }] });
      } catch {}
    }
    if (!u) {
      const db = readDb();
      const lu = (db.users || []).find((x) => String(x._id) === sId || String(x.email).toLowerCase() === sId.toLowerCase());
      if (lu) {
        const lp = (db.studentprofiles || []).find((x) => String(x.user) === String(lu._id));
        return {
          _id: String(lu._id),
          name: lu.name,
          email: lu.email,
          department: lu.department,
          year: lu.year,
          avatar: lp?.avatar || '/avatars/professional-neutral.svg',
          skills: lp?.skills || [],
          aboutMe: lp?.aboutMe || '',
        };
      }
      return { _id: sId, name: 'Student' };
    }
    const profile = await StudentProfile.findOne({ user: u._id }).populate('skills', 'name').lean();
    const skills = (profile?.skills || []).map((s) => (typeof s === 'string' ? s : s?.name || s));
    return {
      _id: String(u._id),
      name: u.name,
      email: u.email,
      department: u.department,
      year: u.year,
      avatar: profile?.avatar || '/avatars/professional-neutral.svg',
      skills,
      aboutMe: profile?.aboutMe || '',
    };
  } else {
    const db = readDb();
    const u = (db.users || []).find((x) => String(x._id) === sId);
    const p = (db.studentprofiles || []).find((x) => String(x.user) === sId);
    const skills = (p?.skills || []).map((skill) => {
      if (typeof skill !== 'string') return skill.name || skill;
      return (db.skills || []).find((item) => String(item._id) === String(skill) || String(item.name).toLowerCase() === String(skill).toLowerCase())?.name || skill;
    });
    return u
      ? { _id: String(u._id), name: u.name, email: u.email, department: u.department, year: u.year, avatar: p?.avatar || '/avatars/professional-neutral.svg', skills, aboutMe: p?.aboutMe || '' }
      : { _id: sId, name: 'Student' };
  }
};

const loadProject = async (id) => {
  const sId = String(id || '');
  if (!sId) return null;
  if (isConnected()) {
    let p = null;
    try {
      if (mongoose.Types.ObjectId.isValid(sId)) {
        p = await Project.findById(sId).lean();
      }
    } catch {}
    if (!p) {
      try {
        p = await Project.findOne({ _id: sId }).lean();
      } catch {}
    }
    if (!p) {
      const db = readDb();
      p = (db.projects || []).find((x) => String(x._id) === sId);
      return p ? { ...p, _id: String(p._id), owner: String(p.owner) } : null;
    }
    return { ...p, _id: String(p._id), owner: String(p.owner) };
  } else {
    const db = readDb();
    const p = (db.projects || []).find((x) => String(x._id) === sId);
    return p ? { ...p, _id: String(p._id), owner: String(p.owner) } : null;
  }
};

const getProjectMembers = async (projectId) => {
  const pId = String(projectId);
  if (isConnected()) {
    const query = {
      $or: [
        { project: pId },
        ...(mongoose.Types.ObjectId.isValid(pId) ? [{ project: new mongoose.Types.ObjectId(pId) }] : [])
      ]
    };
    const members = await mongoose.connection.db.collection('projectmembers').find(query).toArray();
    return members.map((m) => ({ ...m, _id: String(m._id), project: String(m.project), student: String(m.student) }));
  } else {
    const db = readDb();
    return (db.projectmembers || []).filter((m) => String(m.project) === pId).map((m) => ({ ...m, _id: String(m._id), project: String(m.project), student: String(m.student) }));
  }
};

const canAccess = async (project, userId) => {
  if (String(project.owner) === String(userId)) return true;
  const members = await getProjectMembers(project._id);
  return members.some((m) => String(m.student) === String(userId));
};

const notify = async (recipient, sender, project, message, type = 'project') => {
  const item = {
    _id: generateId(),
    recipient: String(recipient),
    sender: String(sender),
    project: String(project?._id || project || ''),
    message,
    type,
    isRead: false,
    createdAt: now(),
  };
  if (isConnected()) {
    try {
      await mongoose.connection.db.collection('notifications').insertOne(item);
    } catch (e) {
      console.warn('Failed to insert notification in Mongo:', e.message);
    }
  }
  const db = readDb();
  db.notifications = db.notifications || [];
  db.notifications.push(item);
  writeDb(db);
  return item;
};

const notifyTeamInvite = async (recipient, sender, project, invitation, message) => {
  const item = {
    _id: generateId(),
    recipient: String(recipient),
    sender: String(sender),
    project: String(project._id),
    invitationId: String(invitation._id),
    message,
    type: 'team_invitation',
    isRead: false,
    createdAt: now(),
  };
  if (isConnected()) {
    const notifications = mongoose.connection.db.collection('notifications');
    const existing = await notifications.findOne({
      recipient: item.recipient,
      type: item.type,
      invitationId: item.invitationId,
    });
    if (!existing) await notifications.insertOne(item);
  }
  const db = readDb();
  db.notifications = db.notifications || [];
  if (!db.notifications.some((notification) => String(notification.invitationId || '') === item.invitationId)) {
    db.notifications.push(item);
  }
  writeDb(db);
  return item;
};

// ============================================================================
// Team Dashboard Data
// ============================================================================
exports.team = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (!(await canAccess(project, uid(req)))) return res.status(403).json({ success: false, message: 'Only accepted project members can access this team.' });

    const owner = await loadUserView(project.owner);
    const rawMembers = await getProjectMembers(project._id);
    const memberStudents = await Promise.all(
      rawMembers.map(async (m) => ({
        ...m,
        student: await loadUserView(m.student),
        isOwner: false,
      }))
    );
    const members = [
      { _id: `owner-${project.owner}`, student: owner, role: project.role || 'Project Owner', isOwner: true, joinedAt: project.createdAt },
      ...memberStudents.filter((m) => m.student),
    ];

    const pId = String(project._id);
    const pFilter = {
      $or: [
        { project: pId },
        ...(mongoose.Types.ObjectId.isValid(pId) ? [{ project: new mongoose.Types.ObjectId(pId) }] : [])
      ]
    };

    let pendingRequests = [];
    let pendingInvitations = [];
    let tasks = [];
    let milestones = [];
    let updates = [];

    if (isConnected()) {
      const [rawReqs, rawInvitations, rawTasks, rawMs, rawUps] = await Promise.all([
        mongoose.connection.db.collection('joinrequests').find({ ...pFilter, status: 'Pending' }).toArray(),
        mongoose.connection.db.collection('teaminvitations').find({ ...pFilter, status: 'Pending' }).toArray(),
        mongoose.connection.db.collection('projecttasks').find(pFilter).toArray(),
        mongoose.connection.db.collection('projectmilestones').find(pFilter).toArray(),
        mongoose.connection.db.collection('progressupdates').find(pFilter).sort({ createdAt: -1 }).toArray()
      ]);

      pendingRequests = (await Promise.all(
        rawReqs.map(async (r) => ({
          ...r,
          _id: String(r._id),
          applicant: await loadUserView(r.applicant),
        }))
      )).filter((r) => r.applicant);

      pendingInvitations = (await Promise.all(
        rawInvitations.map(async (invitation) => ({
          ...invitation,
          _id: String(invitation._id),
          invitee: await loadUserView(invitation.invitee),
        }))
      )).filter((invitation) => invitation.invitee);

      tasks = await Promise.all(
        rawTasks.map(async (t) => ({
          ...t,
          _id: String(t._id),
          assignee: await loadUserView(t.assignee),
        }))
      );

      milestones = rawMs.map((m) => ({ ...m, _id: String(m._id) }));

      updates = (await Promise.all(
        rawUps.map(async (u) => ({
          ...u,
          _id: String(u._id),
          author: await loadUserView(u.author),
        }))
      )).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const db = readDb();
      pendingRequests = (db.joinrequests || [])
        .filter((r) => String(r.project) === pId && r.status === 'Pending')
        .map((r) => ({ ...r, applicant: (db.users || []).find((u) => String(u._id) === String(r.applicant)) }))
        .filter((r) => r.applicant);
      pendingInvitations = (db.teaminvitations || [])
        .filter((invitation) => String(invitation.project) === pId && invitation.status === 'Pending')
        .map((invitation) => ({ ...invitation, invitee: (db.users || []).find((u) => String(u._id) === String(invitation.invitee)) }))
        .filter((invitation) => invitation.invitee);
      tasks = (db.projecttasks || []).filter((t) => String(t.project) === pId).map((t) => ({ ...t, assignee: (db.users || []).find((u) => String(u._id) === String(t.assignee)) }));
      milestones = (db.projectmilestones || []).filter((m) => String(m.project) === pId);
      updates = (db.progressupdates || [])
        .filter((u) => String(u.project) === pId)
        .map((u) => ({ ...u, author: (db.users || []).find((u) => String(u._id) === String(u.author)) }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const capacity = { current: members.length, maximum: Number(project.maxMembers || 5), full: members.length >= Number(project.maxMembers || 5) };
    res.json({ success: true, project: { ...project, owner }, members, pendingRequests, pendingInvitations, capacity, tasks, milestones, updates });
  } catch (err) {
    console.error('Error in team dashboard:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Tasks
// ============================================================================
exports.createTask = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || !(await canAccess(project, uid(req)))) return res.status(403).json({ success: false, message: 'Project team access required.' });
    if (String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can assign tasks.' });

    const title = String(req.body.title || '').trim();
    if (!title || title.length > 160) return res.status(400).json({ success: false, message: 'Task title is required (maximum 160 characters).' });

    const assignee = String(req.body.assignee || uid(req));
    const members = await getProjectMembers(project._id);
    if (!members.some((m) => String(m.student) === assignee) && String(project.owner) !== assignee) {
      return res.status(400).json({ success: false, message: 'Assign tasks to a project member.' });
    }

    const task = {
      _id: generateId(),
      project: String(project._id),
      title,
      description: String(req.body.description || '').trim().slice(0, 2000),
      assignee,
      createdBy: uid(req),
      startDate: req.body.startDate || '',
      deadline: req.body.deadline || '',
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(req.body.priority) ? req.body.priority : 'Medium',
      status: 'Not Started',
      attachments: [],
      createdAt: now(),
      updatedAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('projecttasks').insertOne({ ...task });
    }
    const db = readDb();
    db.projecttasks = db.projecttasks || [];
    db.projecttasks.push(task);
    writeDb(db);

    const assigner = await loadUserView(uid(req));
    if (assignee !== uid(req)) {
      await notify(assignee, uid(req), project, `${assigner?.name || 'Project owner'} assigned you: ${title}`, 'task_assigned');
    }

    res.status(201).json({ success: true, task: { ...task, assignee: await loadUserView(assignee) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const tId = String(req.params.taskId);
    let task = null;
    if (isConnected()) {
      task = await mongoose.connection.db.collection('projecttasks').findOne({
        $or: [
          { _id: tId },
          ...(mongoose.Types.ObjectId.isValid(tId) ? [{ _id: new mongoose.Types.ObjectId(tId) }] : [])
        ]
      });
    }
    if (!task) {
      const db = readDb();
      task = (db.projecttasks || []).find((t) => String(t._id) === tId);
    }
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await loadProject(task.project);
    if (!project || !(await canAccess(project, uid(req)))) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (req.body.status && !['Not Started', 'In Progress', 'Under Review', 'Completed'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status.' });
    }
    if (String(project.owner) !== uid(req) && String(task.assignee) !== uid(req)) {
      return res.status(403).json({ success: false, message: 'Only the owner or assignee can update this task.' });
    }

    const previousStatus = task.status;
    if (req.body.status) task.status = req.body.status;
    task.updatedAt = now();

    if (isConnected()) {
      await mongoose.connection.db.collection('projecttasks').updateOne(
        { _id: task._id },
        { $set: { status: task.status, updatedAt: task.updatedAt } }
      );
    }
    const db = readDb();
    const lTask = (db.projecttasks || []).find((t) => String(t._id) === String(task._id));
    if (lTask) {
      lTask.status = task.status;
      lTask.updatedAt = task.updatedAt;
      writeDb(db);
    }

    if (String(task.assignee) === uid(req) && req.body.status && previousStatus !== task.status) {
      const updater = await loadUserView(uid(req));
      await notify(project.owner, uid(req), project, `${updater?.name} changed “${task.title}” to ${task.status}.`, task.status === 'Completed' ? 'task_completed' : 'task_status');
    }

    res.json({
      success: true,
      task: {
        ...task,
        _id: String(task._id),
        assignee: await loadUserView(task.assignee),
        assignedBy: await loadUserView(task.createdBy),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.myTasks = async (req, res) => {
  try {
    const me = uid(req);
    let rawTasks = [];
    if (isConnected()) {
      const meFilter = [
        { assignee: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ assignee: new mongoose.Types.ObjectId(me) }] : [])
      ];
      rawTasks = await mongoose.connection.db.collection('projecttasks').find({ $or: meFilter }).toArray();
    } else {
      const db = readDb();
      rawTasks = (db.projecttasks || []).filter((t) => String(t.assignee) === me);
    }

    const tasks = (
      await Promise.all(
        rawTasks.map(async (t) => {
          const project = await loadProject(t.project);
          if (!project || !(await canAccess(project, me))) return null;
          return {
            ...t,
            _id: String(t._id),
            project: { _id: String(project._id), title: project.title, owner: await loadUserView(project.owner) },
            assignee: await loadUserView(t.assignee),
            assignedBy: await loadUserView(t.createdBy),
          };
        })
      )
    )
      .filter(Boolean)
      .sort((a, b) => new Date(a.deadline || a.createdAt) - new Date(b.deadline || b.createdAt));

    res.json({ success: true, tasks });
  } catch (err) {
    console.error('Error in myTasks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadTaskAttachment = async (req, res) => {
  try {
    const tId = String(req.params.taskId);
    let task = null;
    if (isConnected()) {
      task = await mongoose.connection.db.collection('projecttasks').findOne({
        $or: [
          { _id: tId },
          ...(mongoose.Types.ObjectId.isValid(tId) ? [{ _id: new mongoose.Types.ObjectId(tId) }] : [])
        ]
      });
    }
    if (!task) {
      const db = readDb();
      task = (db.projecttasks || []).find((t) => String(t._id) === tId);
    }
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await loadProject(task.project);
    if (!project || !(await canAccess(project, uid(req))) || (String(task.assignee) !== uid(req) && String(project.owner) !== uid(req))) {
      return res.status(403).json({ success: false, message: 'Only the assigned student or project owner can attach task files.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose an allowed task file.' });

    const attachment = {
      _id: generateId(),
      filePath: `/uploads/tasks/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedBy: uid(req),
      uploadedAt: now(),
    };

    task.attachments = task.attachments || [];
    task.attachments.push(attachment);
    task.updatedAt = now();

    if (isConnected()) {
      await mongoose.connection.db.collection('projecttasks').updateOne(
        { _id: task._id },
        { $set: { attachments: task.attachments, updatedAt: task.updatedAt } }
      );
    }
    const db = readDb();
    const lTask = (db.projecttasks || []).find((t) => String(t._id) === String(task._id));
    if (lTask) {
      lTask.attachments = task.attachments;
      lTask.updatedAt = task.updatedAt;
      writeDb(db);
    }

    if (String(uid(req)) !== String(project.owner)) {
      const uploader = await loadUserView(uid(req));
      await notify(project.owner, uid(req), project, `${uploader?.name} uploaded a file for “${task.title}”.`, 'task_file');
    }

    res.status(201).json({ success: true, attachment: { ...attachment, uploader: await loadUserView(uid(req)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Milestones
// ============================================================================
exports.createMilestone = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || !(await canAccess(project, uid(req)))) return res.status(403).json({ success: false, message: 'Project team access required.' });
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ success: false, message: 'Milestone title is required.' });

    const milestone = {
      _id: generateId(),
      project: String(project._id),
      title: title.slice(0, 160),
      dueDate: req.body.dueDate || '',
      completed: false,
      createdBy: uid(req),
      createdAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('projectmilestones').insertOne({ ...milestone });
    }
    const db = readDb();
    db.projectmilestones = db.projectmilestones || [];
    db.projectmilestones.push(milestone);
    writeDb(db);

    res.status(201).json({ success: true, milestone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const mId = String(req.params.milestoneId);
    let m = null;
    if (isConnected()) {
      m = await mongoose.connection.db.collection('projectmilestones').findOne({
        $or: [
          { _id: mId },
          ...(mongoose.Types.ObjectId.isValid(mId) ? [{ _id: new mongoose.Types.ObjectId(mId) }] : [])
        ]
      });
    }
    if (!m) {
      const db = readDb();
      m = (db.projectmilestones || []).find((x) => String(x._id) === mId);
    }
    if (!m) return res.status(404).json({ success: false, message: 'Milestone not found.' });

    const project = await loadProject(m.project);
    if (!project || !(await canAccess(project, uid(req)))) return res.status(404).json({ success: false, message: 'Milestone not found.' });

    m.completed = Boolean(req.body.completed);
    m.completedAt = m.completed ? now() : null;

    if (isConnected()) {
      await mongoose.connection.db.collection('projectmilestones').updateOne(
        { _id: m._id },
        { $set: { completed: m.completed, completedAt: m.completedAt } }
      );
    }
    const db = readDb();
    const lm = (db.projectmilestones || []).find((x) => String(x._id) === String(m._id));
    if (lm) {
      lm.completed = m.completed;
      lm.completedAt = m.completedAt;
      writeDb(db);
    }

    if (m.completed) {
      const members = await getProjectMembers(project._id);
      for (const member of members) {
        await notify(member.student, uid(req), project, `Milestone completed: ${m.title}`, 'milestone');
      }
    }

    res.json({ success: true, milestone: { ...m, _id: String(m._id) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Progress Updates
// ============================================================================
exports.createUpdate = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || !(await canAccess(project, uid(req)))) return res.status(403).json({ success: false, message: 'Project team access required.' });
    const message = String(req.body.message || '').trim();
    if (!message || message.length > 2000) return res.status(400).json({ success: false, message: 'Update is required (maximum 2000 characters).' });
    if (req.body.progress !== undefined && (String(project.owner) !== uid(req) || !Number.isFinite(Number(req.body.progress)) || Number(req.body.progress) < 0 || Number(req.body.progress) > 100)) {
      return res.status(403).json({ success: false, message: 'Only the project owner can set progress from 0 to 100.' });
    }

    const update = { _id: generateId(), project: String(project._id), author: uid(req), message, createdAt: now() };

    if (isConnected()) {
      await mongoose.connection.db.collection('progressupdates').insertOne({ ...update });
      if (req.body.progress !== undefined) {
        project.progress = Number(req.body.progress);
        await Project.updateOne({ _id: project._id }, { $set: { progress: project.progress } });
      }
    }
    const db = readDb();
    db.progressupdates = db.progressupdates || [];
    db.progressupdates.push(update);
    if (req.body.progress !== undefined) {
      const lp = (db.projects || []).find((p) => String(p._id) === String(project._id));
      if (lp) lp.progress = Number(req.body.progress);
    }
    writeDb(db);

    const authorUser = await loadUserView(uid(req));
    const members = await getProjectMembers(project._id);
    for (const m of members) {
      if (String(m.student) !== uid(req)) {
        await notify(m.student, uid(req), project, `${authorUser?.name} posted a project update`, 'progress');
      }
    }

    res.status(201).json({ success: true, update: { ...update, author: authorUser }, progress: project.progress || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Project Status
// ============================================================================
exports.updateStatus = async (req, res) => {
  const valid = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid project status.' });

  try {
    const project = await loadProject(req.params.id);
    if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can change status.' });

    if (project.status !== req.body.status) {
      project.status = req.body.status;
      project.updatedAt = now();

      if (isConnected()) {
        await Project.updateOne({ _id: project._id }, { $set: { status: project.status, updatedAt: project.updatedAt } });
      }
      const db = readDb();
      const lp = (db.projects || []).find((p) => String(p._id) === String(project._id));
      if (lp) {
        lp.status = project.status;
        lp.updatedAt = project.updatedAt;
        writeDb(db);
      }

      const members = await getProjectMembers(project._id);
      for (const m of members) {
        await notify(m.student, uid(req), project, `Project status changed to ${project.status}`, 'status');
      }
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Member Management
// ============================================================================
exports.removeMember = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can remove a member.' });
    if (String(req.params.studentId) === String(project.owner)) return res.status(400).json({ success: false, message: 'The project owner cannot be removed.' });

    const pId = String(project._id);
    const sId = String(req.params.studentId);

    if (isConnected()) {
      await mongoose.connection.db.collection('projectmembers').deleteOne({
        $or: [{ project: pId, student: sId }]
      });
      await mongoose.connection.db.collection('chatrooms').updateMany(
        { project: pId },
        { $pull: { members: sId } }
      );
    }
    const db = readDb();
    const index = (db.projectmembers || []).findIndex((m) => String(m.project) === pId && String(m.student) === sId);
    if (index >= 0) db.projectmembers.splice(index, 1);
    (db.chatrooms || []).filter((r) => String(r.project) === pId).forEach((r) => {
      r.members = (r.members || []).filter((m) => String(m) !== sId);
    });

    await notify(sId, uid(req), project, `Your membership in ${project.title} was removed by the project owner.`, 'membership_removed');

    const remaining = await getProjectMembers(project._id);
    project.currentMembers = remaining.length + 1;

    if (isConnected()) {
      await Project.updateOne({ _id: project._id }, { $set: { currentMembers: project.currentMembers } });
    }
    const lp = (db.projects || []).find((p) => String(p._id) === pId);
    if (lp) lp.currentMembers = project.currentMembers;
    writeDb(db);

    res.json({ success: true, currentMembers: project.currentMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can update member roles.' });
    if (String(req.params.studentId) === String(project.owner)) return res.status(400).json({ success: false, message: 'The project owner role cannot be changed.' });

    const role = String(req.body.role || '').trim();
    if (!role || role.length > 80) return res.status(400).json({ success: false, message: 'A valid project role is required.' });

    const pId = String(project._id);
    const sId = String(req.params.studentId);

    let member = null;
    if (isConnected()) {
      member = await mongoose.connection.db.collection('projectmembers').findOne({ project: pId, student: sId });
      if (member) {
        member.role = role;
        member.updatedAt = now();
        await mongoose.connection.db.collection('projectmembers').updateOne(
          { _id: member._id },
          { $set: { role, updatedAt: member.updatedAt } }
        );
      }
    }
    const db = readDb();
    const lm = (db.projectmembers || []).find((item) => String(item.project) === pId && String(item.student) === sId);
    if (lm) {
      lm.role = role;
      lm.updatedAt = now();
      writeDb(db);
      if (!member) member = lm;
    }

    if (!member) return res.status(404).json({ success: false, message: 'Active team membership not found.' });

    res.json({ success: true, member: { ...member, _id: String(member._id) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can invite team members.' });

    const studentId = String(req.body.studentId || req.body.student || '').trim();
    let student = null;
    if (isConnected()) {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await User.findById(studentId).select('name role').lean();
      }
    } else {
      student = (readDb().users || []).find((user) => String(user._id) === studentId && user.role !== 'admin');
    }
    if (!student || student.role === 'admin') return res.status(404).json({ success: false, message: 'Registered student not found.' });
    if (String(project.owner) === studentId) return res.status(400).json({ success: false, message: 'The project owner is already on the team.' });

    const members = await getProjectMembers(project._id);
    if (members.some((m) => String(m.student) === studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already a team member.' });
    }

    const currentMembersCount = members.length + 1;
    const max = Number(project.maxMembers || 5);
    let existingInvitation = null;
    let pendingInvitations = [];
    if (isConnected()) {
      const invitations = mongoose.connection.db.collection('teaminvitations');
      existingInvitation = await invitations.findOne({ project: String(project._id), invitee: studentId, status: 'Pending' });
      pendingInvitations = await invitations.find({ project: String(project._id), status: 'Pending' }).toArray();
    } else {
      const db = readDb();
      existingInvitation = (db.teaminvitations || []).find((invitation) => String(invitation.project) === String(project._id) && String(invitation.invitee) === studentId && invitation.status === 'Pending');
      pendingInvitations = (db.teaminvitations || []).filter((invitation) => String(invitation.project) === String(project._id) && invitation.status === 'Pending');
    }
    if (existingInvitation) {
      const inviter = await loadUserView(uid(req));
      await notifyTeamInvite(studentId, uid(req), project, existingInvitation, `${inviter?.name || 'The project owner'} invited you to join ${project.title} as ${existingInvitation.role}.`);
      return res.status(409).json({ success: false, message: 'An invitation is already pending for this student.' });
    }
    if (currentMembersCount + pendingInvitations.length >= max) return res.status(400).json({ success: false, message: 'The team has no remaining capacity for another invitation.' });

    const role = String(req.body.role || 'Full Stack Developer').trim();
    if (!role || role.length > 100) return res.status(400).json({ success: false, message: 'Enter a valid team role.' });
    const invitation = {
      _id: generateId(),
      project: String(project._id),
      inviter: uid(req),
      invitee: studentId,
      role,
      status: 'Pending',
      createdAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('teaminvitations').insertOne({ ...invitation });
    }
    const db = readDb();
    db.teaminvitations = db.teaminvitations || [];
    db.teaminvitations.push(invitation);
    writeDb(db);

    const inviter = await loadUserView(uid(req));
    await notifyTeamInvite(studentId, uid(req), project, invitation, `${inviter?.name || 'The project owner'} invited you to join ${project.title} as ${role}.`);

    res.status(201).json({ success: true, invitation: { ...invitation, invitee: await loadUserView(studentId) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const inviteeId = uid(req);
    const invitationId = String(req.params.invitationId);
    let invitation = null;
    if (isConnected()) {
      invitation = await mongoose.connection.db.collection('teaminvitations').findOne({ _id: invitationId });
    }
    if (!invitation) {
      invitation = (readDb().teaminvitations || []).find((item) => String(item._id) === invitationId);
    }
    if (!invitation) return res.status(404).json({ success: false, message: 'Team invitation not found.' });
    if (String(invitation.invitee) !== inviteeId) return res.status(403).json({ success: false, message: 'You cannot respond to another student’s invitation.' });
    if (invitation.status !== 'Pending') return res.status(409).json({ success: false, message: 'This invitation has already been answered.' });

    const status = req.body.status;
    if (!['Accepted', 'Rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Choose Accept or Reject.' });
    const project = await loadProject(invitation.project);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    let members = await getProjectMembers(project._id);
    if (status === 'Accepted') {
      if (members.some((member) => String(member.student) === inviteeId)) return res.status(409).json({ success: false, message: 'You are already a member of this project.' });
      const currentMembersCount = members.length + 1;
      if (currentMembersCount >= Number(project.maxMembers || 5)) return res.status(400).json({ success: false, message: 'This team is full.' });
    }

    if (isConnected()) {
      const update = await mongoose.connection.db.collection('teaminvitations').updateOne(
        { _id: invitation._id, invitee: inviteeId, status: 'Pending' },
        { $set: { status, respondedAt: now() } }
      );
      if (!update.modifiedCount) return res.status(409).json({ success: false, message: 'This invitation has already been answered.' });
    }

    invitation.status = status;
    invitation.respondedAt = now();
    const db = readDb();
    const localInvitation = (db.teaminvitations || []).find((item) => String(item._id) === invitationId);
    if (localInvitation) {
      localInvitation.status = status;
      localInvitation.respondedAt = invitation.respondedAt;
    }

    if (status === 'Accepted') {
      const newMember = {
        _id: generateId(),
        project: String(project._id),
        student: inviteeId,
        role: invitation.role,
        joinedAt: now(),
      };
      if (isConnected()) {
        await mongoose.connection.db.collection('projectmembers').insertOne({ ...newMember });
        await mongoose.connection.db.collection('chatrooms').updateMany(
          { project: String(project._id) },
          { $addToSet: { members: inviteeId } }
        );
      }
      db.projectmembers = db.projectmembers || [];
      if (!db.projectmembers.some((member) => String(member.project) === String(project._id) && String(member.student) === inviteeId)) {
        db.projectmembers.push(newMember);
      }
      (db.chatrooms || []).filter((room) => String(room.project) === String(project._id)).forEach((room) => {
        room.members = room.members || [];
        if (!room.members.some((member) => String(member) === inviteeId)) room.members.push(inviteeId);
      });
      const currentMembers = members.length + 2;
      if (isConnected()) await Project.updateOne({ _id: project._id }, { $set: { currentMembers } });
      const localProject = (db.projects || []).find((item) => String(item._id) === String(project._id));
      if (localProject) localProject.currentMembers = currentMembers;
    }
    writeDb(db);

    const invitee = await loadUserView(inviteeId);
    await notify(
      project.owner,
      inviteeId,
      project,
      `${invitee?.name || 'A student'} ${status === 'Accepted' ? 'accepted' : 'declined'} your team invitation.`,
      status === 'Accepted' ? 'invitation_accepted' : 'invitation_rejected'
    );

    if (isConnected()) {
      await mongoose.connection.db.collection('notifications').updateMany(
        { recipient: inviteeId, invitationId },
        { $set: { isRead: true } }
      );
    }
    const updatedDb = readDb();
    updatedDb.notifications = updatedDb.notifications || [];
    updatedDb.notifications.filter((item) => String(item.recipient) === inviteeId && String(item.invitationId || '') === invitationId)
      .forEach((item) => { item.isRead = true; });
    writeDb(updatedDb);
    res.json({ success: true, invitation: { ...invitation, project: String(project._id) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// Admin Endpoints
// ============================================================================
exports.adminOverview = async (req, res) => {
  if (isConnected()) {
    const [students, projects, requests] = await Promise.all([
      User.countDocuments(),
      Project.find().select('status'),
      mongoose.connection.db.collection('joinrequests').countDocuments(),
    ]);
    return res.json({
      success: true,
      stats: {
        students,
        users: students,
        projects: projects.length,
        completed: projects.filter((p) => p.status === 'Completed').length,
        ongoing: projects.filter((p) => p.status === 'In Progress').length,
        requests,
      },
    });
  }
  const db = readDb();
  const ps = db.projects || [];
  res.json({
    success: true,
    stats: {
      students: (db.users || []).length,
      users: (db.users || []).length,
      projects: ps.length,
      completed: ps.filter((p) => p.status === 'Completed').length,
      ongoing: ps.filter((p) => p.status === 'In Progress').length,
      requests: (db.joinrequests || []).length,
    },
  });
};

exports.adminStudents = async (req, res) => {
  if (isConnected()) {
    const q = String(req.query.search || '').trim();
    const users = await User.find(
      q ? { $or: [{ name: new RegExp(q, 'i') }, { department: new RegExp(q, 'i') }, { year: new RegExp(q, 'i') }] } : {}
    )
      .select('-password')
      .sort({ createdAt: -1 });
    return res.json({ success: true, students: users });
  }
  const db = readDb();
  const q = String(req.query.search || '').toLowerCase();
  res.json({
    success: true,
    students: (db.users || [])
      .filter((u) => !q || `${u.name} ${u.department} ${u.year}`.toLowerCase().includes(q))
      .map(({ password, ...u }) => ({ ...u, active: u.active !== false })),
  });
};

exports.adminProjects = async (req, res) => {
  if (isConnected()) return res.json({ success: true, projects: await Project.find().populate('owner', 'name email').sort({ createdAt: -1 }) });
  const db = readDb();
  res.json({
    success: true,
    projects: (db.projects || []).map((p) => ({ ...p, owner: (db.users || []).find((u) => String(u._id) === String(p.owner)) })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
};

exports.adminToggleStudent = async (req, res) => {
  if (String(req.params.id) === uid(req)) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  let target;
  if (isConnected()) {
    target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });
    target.active = req.body.active === true;
    await target.save();
  } else {
    const db = readDb();
    target = (db.users || []).find((u) => String(u._id) === req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });
    target.active = req.body.active === true;
    db.adminlogs = db.adminlogs || [];
    db.adminlogs.push({ _id: generateId(), actor: uid(req), action: `${target.active ? 'activated' : 'deactivated'} student`, target: target._id, createdAt: now() });
    writeDb(db);
  }
  res.json({ success: true, student: { _id: target._id, name: target.name, active: target.active } });
};

exports.adminDeleteStudent = async (req, res) => {
  if (isConnected()) {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });
    await User.deleteOne({ _id: target._id });
    return res.json({ success: true });
  }
  const db = readDb();
  const index = (db.users || []).findIndex((u) => String(u._id) === req.params.id);
  if (index < 0) return res.status(404).json({ success: false, message: 'Student not found.' });
  db.adminlogs = db.adminlogs || [];
  db.adminlogs.push({ _id: generateId(), actor: uid(req), action: 'removed student', target: req.params.id, createdAt: now() });
  db.users.splice(index, 1);
  db.studentprofiles = (db.studentprofiles || []).filter((p) => String(p.user) !== req.params.id);
  writeDb(db);
  res.json({ success: true });
};

exports.adminDeleteProject = async (req, res) => {
  if (isConnected()) {
    const result = await Project.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true });
  }
  const db = readDb();
  const idx = (db.projects || []).findIndex((p) => String(p._id) === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Project not found.' });
  db.adminlogs = db.adminlogs || [];
  db.adminlogs.push({ _id: generateId(), actor: uid(req), action: 'removed project', target: req.params.id, createdAt: now() });
  db.projects.splice(idx, 1);
  db.projectmembers = (db.projectmembers || []).filter((m) => String(m.project) !== req.params.id);
  db.projecttasks = (db.projecttasks || []).filter((t) => String(t.project) !== req.params.id);
  db.projectmilestones = (db.projectmilestones || []).filter((m) => String(m.project) !== req.params.id);
  db.progressupdates = (db.progressupdates || []).filter((u) => String(u.project) !== req.params.id);
  writeDb(db);
  res.json({ success: true });
};
