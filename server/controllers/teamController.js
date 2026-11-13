const { isConnected } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const { readDb, writeDb, generateId } = require('../config/localDb');

const uid = (req) => String(req.user._id || req.user.id);
const now = () => new Date().toISOString();
const userView = (db, id) => {
  const u = db.users.find((x) => String(x._id) === String(id));
  const p = db.studentprofiles.find((x) => String(x.user) === String(id));
  return u ? { _id: u._id, name: u.name, department: u.department, year: u.year, avatar: p?.avatar || '/avatars/professional-neutral.svg' } : null;
};
const notify = (db, recipient, sender, project, message, type = 'project') => db.notifications.push({ _id: generateId(), recipient: String(recipient), sender: String(sender), project: String(project._id), message, type, isRead: false, createdAt: now() });
const loadProject = (db, id) => db.projects.find((p) => String(p._id) === String(id));
const membersOf = (db, project) => (db.projectmembers || []).filter((m) => String(m.project) === String(project._id));
const canAccess = (db, project, id) => String(project.owner) === String(id) || membersOf(db, project).some((m) => String(m.student) === String(id));

exports.team = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team dashboard currently requires local data mode.' });
  const db = readDb(); const project = loadProject(db, req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (!canAccess(db, project, uid(req))) return res.status(403).json({ success: false, message: 'Only accepted project members can access this team.' });
  const members = membersOf(db, project).map((m) => ({ ...m, student: userView(db, m.student) })).filter((m) => m.student);
  res.json({ success: true, project: { ...project, owner: userView(db, project.owner) }, members, tasks: db.projecttasks.filter((t) => String(t.project) === String(project._id)).map((t) => ({ ...t, assignee: userView(db, t.assignee) })), milestones: db.projectmilestones.filter((m) => String(m.project) === String(project._id)), updates: db.progressupdates.filter((u) => String(u.project) === String(project._id)).map((u) => ({ ...u, author: userView(db, u.author) })).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)) });
};
exports.createTask = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team management currently requires local data mode.' });
  const db = readDb(); const project = loadProject(db, req.params.id);
  if (!project || !canAccess(db, project, uid(req))) return res.status(403).json({ success: false, message: 'Project team access required.' });
  if (String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can assign tasks.' });
  const title = String(req.body.title || '').trim();
  if (!title || title.length > 160) return res.status(400).json({ success: false, message: 'Task title is required (maximum 160 characters).' });
  const assignee = String(req.body.assignee || uid(req));
  if (!membersOf(db, project).some((m) => String(m.student) === assignee) && String(project.owner) !== assignee) return res.status(400).json({ success: false, message: 'Assign tasks to a project member.' });
  const task = { _id: generateId(), project: project._id, title, description: String(req.body.description || '').trim().slice(0, 2000), assignee, createdBy: uid(req), startDate: req.body.startDate || '', deadline: req.body.deadline || '', priority: ['Low','Medium','High','Urgent'].includes(req.body.priority) ? req.body.priority : 'Medium', status: 'Not Started', attachments: [], createdAt: now(), updatedAt: now() };
  db.projecttasks.push(task); if (assignee !== uid(req)) notify(db, assignee, uid(req), project, `${userView(db, uid(req))?.name} assigned you: ${title}`, 'task_assigned'); writeDb(db);
  res.status(201).json({ success: true, task: { ...task, assignee: userView(db, assignee) } });
};
exports.updateTask = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team management currently requires local data mode.' });
  const db = readDb(); const task = db.projecttasks.find((t) => t._id === req.params.taskId); const project = task && loadProject(db, task.project);
  if (!task || !project || !canAccess(db, project, uid(req))) return res.status(404).json({ success: false, message: 'Task not found.' });
  if (req.body.status && !['Not Started', 'In Progress', 'Under Review', 'Completed'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid task status.' });
  if (String(project.owner) !== uid(req) && String(task.assignee) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the owner or assignee can update this task.' });
  if (req.body.status) {
    const previous = task.status; task.status = req.body.status;
    if (String(task.assignee) === uid(req) && previous !== task.status) notify(db, project.owner, uid(req), project, `${userView(db, uid(req))?.name} changed “${task.title}” to ${task.status}.`, task.status === 'Completed' ? 'task_completed' : 'task_status');
  }
  task.updatedAt = now(); writeDb(db); res.json({ success: true, task: { ...task, assignee: userView(db, task.assignee), assignedBy: userView(db, task.createdBy) } });
};

exports.myTasks = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'My Tasks currently requires local data mode.' });
  const db = readDb(); const me = uid(req);
  const tasks = (db.projecttasks || []).filter((t) => String(t.assignee) === me).map((t) => {
    const project = loadProject(db, t.project);
    if (!project || !canAccess(db, project, me)) return null;
    return { ...t, project: { _id: project._id, title: project.title, owner: userView(db, project.owner) }, assignee: userView(db, t.assignee), assignedBy: userView(db, t.createdBy) };
  }).filter(Boolean).sort((a,b)=>new Date(a.deadline||a.createdAt)-new Date(b.deadline||b.createdAt));
  res.json({ success: true, tasks });
};

exports.uploadTaskAttachment = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Task uploads currently require local data mode.' });
  const db = readDb(); const task = (db.projecttasks || []).find((t) => t._id === req.params.taskId); const project = task && loadProject(db, task.project);
  if (!task || !project || !canAccess(db, project, uid(req)) || (String(task.assignee) !== uid(req) && String(project.owner) !== uid(req))) return res.status(403).json({ success: false, message: 'Only the assigned student or project owner can attach task files.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose an allowed task file.' });
  const attachment = { _id: generateId(), filePath: `/uploads/tasks/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, uploadedBy: uid(req), uploadedAt: now() };
  task.attachments = task.attachments || []; task.attachments.push(attachment); task.updatedAt = now();
  if (String(uid(req)) !== String(project.owner)) notify(db, project.owner, uid(req), project, `${userView(db, uid(req))?.name} uploaded a file for “${task.title}”.`, 'task_file');
  writeDb(db); res.status(201).json({ success: true, attachment: { ...attachment, uploader: userView(db, uid(req)) } });
};
exports.createMilestone = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team management currently requires local data mode.' });
  const db = readDb(); const project = loadProject(db, req.params.id);
  if (!project || !canAccess(db, project, uid(req))) return res.status(403).json({ success: false, message: 'Project team access required.' });
  const title = String(req.body.title || '').trim(); if (!title) return res.status(400).json({ success: false, message: 'Milestone title is required.' });
  const milestone = { _id: generateId(), project: project._id, title: title.slice(0, 160), dueDate: req.body.dueDate || '', completed: false, createdBy: uid(req), createdAt: now() }; db.projectmilestones.push(milestone); writeDb(db); res.status(201).json({ success: true, milestone });
};
exports.updateMilestone = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team management currently requires local data mode.' });
  const db = readDb(); const m = db.projectmilestones.find((x) => x._id === req.params.milestoneId); const project = m && loadProject(db, m.project);
  if (!m || !project || !canAccess(db, project, uid(req))) return res.status(404).json({ success: false, message: 'Milestone not found.' });
  m.completed = Boolean(req.body.completed); m.completedAt = m.completed ? now() : null;
  if (m.completed) membersOf(db, project).forEach((member) => notify(db, member.student, uid(req), project, `Milestone completed: ${m.title}`, 'milestone'));
  writeDb(db); res.json({ success: true, milestone: m });
};
exports.createUpdate = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Team management currently requires local data mode.' });
  const db = readDb(); const project = loadProject(db, req.params.id); const message = String(req.body.message || '').trim();
  if (!project || !canAccess(db, project, uid(req))) return res.status(403).json({ success: false, message: 'Project team access required.' });
  if (!message || message.length > 2000) return res.status(400).json({ success: false, message: 'Update is required (maximum 2000 characters).' });
  if (req.body.progress !== undefined && (String(project.owner) !== uid(req) || !Number.isFinite(Number(req.body.progress)) || Number(req.body.progress) < 0 || Number(req.body.progress) > 100)) return res.status(403).json({ success: false, message: 'Only the project owner can set progress from 0 to 100.' });
  const update = { _id: generateId(), project: project._id, author: uid(req), message, createdAt: now() }; db.progressupdates.push(update);
  if (req.body.progress !== undefined) project.progress = Number(req.body.progress);
  membersOf(db, project).filter((m) => String(m.student) !== uid(req)).forEach((m) => notify(db, m.student, uid(req), project, `${userView(db, uid(req))?.name} posted a project update`, 'progress'));
  writeDb(db); res.status(201).json({ success: true, update: { ...update, author: userView(db, uid(req)) }, progress: project.progress || 0 });
};
exports.updateStatus = async (req, res) => {
  const valid = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid project status.' });
  if (isConnected()) {
    const project = await Project.findOne({ _id: req.params.id, owner: uid(req) });
    if (!project) return res.status(403).json({ success: false, message: 'Only the project owner can change status.' });
    project.status = req.body.status; await project.save(); return res.json({ success: true, project });
  }
  const db = readDb(); const project = loadProject(db, req.params.id);
  if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can change status.' });
  if (project.status !== req.body.status) { project.status = req.body.status; project.updatedAt = now(); membersOf(db, project).forEach((m) => notify(db, m.student, uid(req), project, `Project status changed to ${project.status}`, 'status')); }
  writeDb(db); res.json({ success: true, project });
};

exports.adminOverview = async (req, res) => {
  if (isConnected()) {
    const [students, projects, requests] = await Promise.all([User.countDocuments(), Project.find().select('status'), require('../models/User').countDocuments()]);
    return res.json({ success: true, stats: { students, users: students, projects: projects.length, completed: projects.filter((p) => p.status === 'Completed').length, ongoing: projects.filter((p) => p.status === 'In Progress').length, requests } });
  }
  const db = readDb(); const ps = db.projects || [];
  res.json({ success: true, stats: { students: db.users.length, users: db.users.length, projects: ps.length, completed: ps.filter((p) => p.status === 'Completed').length, ongoing: ps.filter((p) => p.status === 'In Progress').length, requests: db.joinrequests.length } });
};
exports.adminStudents = async (req, res) => {
  if (isConnected()) {
    const q = String(req.query.search || '').trim(); const users = await User.find(q ? { $or: [{ name: new RegExp(q, 'i') }, { department: new RegExp(q, 'i') }, { year: new RegExp(q, 'i') }] } : {}).select('-password').sort({ createdAt: -1 }); return res.json({ success: true, students: users });
  }
  const db = readDb(); const q = String(req.query.search || '').toLowerCase(); res.json({ success: true, students: db.users.filter((u) => !q || `${u.name} ${u.department} ${u.year}`.toLowerCase().includes(q)).map(({ password, ...u }) => ({ ...u, active: u.active !== false })) });
};
exports.adminProjects = async (req, res) => {
  if (isConnected()) return res.json({ success: true, projects: await Project.find().populate('owner', 'name email').sort({ createdAt: -1 }) });
  const db = readDb(); res.json({ success: true, projects: db.projects.map((p) => ({ ...p, owner: userView(db, p.owner), members: membersOf(db, p).map((m) => ({ ...m, student: userView(db, m.student) })) })).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)) });
};
exports.adminToggleStudent = async (req, res) => {
  if (String(req.params.id) === uid(req)) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  let target;
  if (isConnected()) { target = await User.findById(req.params.id); if (!target) return res.status(404).json({ success: false, message: 'Student not found.' }); target.active = req.body.active === true; await target.save(); }
  else { const db = readDb(); target = db.users.find((u) => String(u._id) === req.params.id); if (!target) return res.status(404).json({ success: false, message: 'Student not found.' }); target.active = req.body.active === true; db.adminlogs.push({ _id: generateId(), actor: uid(req), action: `${target.active ? 'activated' : 'deactivated'} student`, target: target._id, createdAt: now() }); writeDb(db); }
  res.json({ success: true, student: { _id: target._id, name: target.name, active: target.active } });
};
exports.adminDeleteStudent = async (req, res) => {
  if (isConnected()) { const target = await User.findById(req.params.id); if (!target) return res.status(404).json({ success:false,message:'Student not found.' }); await User.deleteOne({ _id: target._id }); return res.json({ success:true }); }
  const db = readDb(); const index = db.users.findIndex((u) => String(u._id) === req.params.id); if (index < 0) return res.status(404).json({ success:false,message:'Student not found.' });
  db.adminlogs.push({ _id: generateId(), actor: uid(req), action: 'removed student', target: req.params.id, createdAt: now() }); db.users.splice(index, 1); db.studentprofiles = db.studentprofiles.filter((p) => String(p.user) !== req.params.id); writeDb(db); res.json({ success:true });
};
exports.adminDeleteProject = async (req, res) => {
  if (isConnected()) { const result = await Project.deleteOne({ _id: req.params.id }); if (!result.deletedCount) return res.status(404).json({ success:false,message:'Project not found.' }); return res.json({ success:true }); }
  const db = readDb(); const idx = db.projects.findIndex((p) => String(p._id) === req.params.id); if (idx < 0) return res.status(404).json({ success:false,message:'Project not found.' });
  db.adminlogs.push({ _id: generateId(), actor: uid(req), action: 'removed project', target: req.params.id, createdAt: now() }); db.projects.splice(idx, 1); db.projectmembers = db.projectmembers.filter((m) => String(m.project) !== req.params.id); db.projecttasks = db.projecttasks.filter((t) => String(t.project) !== req.params.id); db.projectmilestones = db.projectmilestones.filter((m) => String(m.project) !== req.params.id); db.progressupdates = db.progressupdates.filter((u) => String(u.project) !== req.params.id); writeDb(db); res.json({ success:true });
};

exports.removeMember = (req, res) => {
  if (isConnected()) return res.status(501).json({ success: false, message: 'Member management currently requires local data mode.' });
  const db = readDb(); const project = loadProject(db, req.params.id);
  if (!project || String(project.owner) !== uid(req)) return res.status(403).json({ success: false, message: 'Only the project owner can remove a member.' });
  if (String(req.params.studentId) === String(project.owner)) return res.status(400).json({ success: false, message: 'The project owner cannot be removed.' });
  const index = db.projectmembers.findIndex((m) => String(m.project) === String(project._id) && String(m.student) === req.params.studentId);
  if (index < 0) return res.status(404).json({ success: false, message: 'Active team membership not found.' });
  db.projectmembers.splice(index, 1);
  db.chatrooms.filter((r) => String(r.project) === String(project._id)).forEach((r) => { r.members = r.members.filter((m) => String(m) !== req.params.studentId); });
  db.notifications.push({ _id: generateId(), recipient: req.params.studentId, sender: uid(req), project: project._id, type: 'membership_removed', isRead: false, message: `Your membership in ${project.title} was removed by the project owner.`, createdAt: now() });
  project.currentMembers = membersOf(db, project).length; writeDb(db); res.json({ success: true });
};
