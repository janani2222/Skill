const Project = require('../models/Project');
const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');
const mongoose = require('mongoose');

const ownerId = (req) => String(req.user._id || req.user.id);
const normalize = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const projectPayload = (body) => ({
  title: String(body.title || '').trim(),
  description: String(body.description || '').trim(),
  category: body.category || 'Web Development',
  technologies: normalize(body.technologies),
  role: body.role || 'Full Stack Developer',
  requiredSkills: normalize(body.requiredSkills),
  requiredRoles: normalize(body.requiredRoles),
  maxMembers: Math.max(1, Number(body.maxMembers || 5)),
  teamMembers: normalize(body.teamMembers),
  startDate: body.startDate || '',
  completionDate: body.completionDate || '',
  status: body.status || 'In Progress',
  thumbnail: body.thumbnail || '',
  githubUrl: body.githubUrl || '',
  liveDemoUrl: body.liveDemoUrl || '',
});

const withOwner = (project, db) => {
  const user = db.users.find((item) => item._id === project.owner);
  return { ...project, owner: user ? { _id: user._id, name: user.name, department: user.department, year: user.year } : project.owner };
};

exports.listProjects = async (req, res, next) => {
  try {
    const query = String(req.query.search || '').trim();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.mine === 'true') filter.owner = ownerId(req);
    else if (req.query.studentId) filter.owner = req.query.studentId;
    if (query) filter.$or = [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }, { category: { $regex: query, $options: 'i' } }, { technologies: { $regex: query, $options: 'i' } }];
    if (isConnected()) {
      const projects = await Project.find(filter).populate('owner', 'name department year').sort({ createdAt: -1 });
      return res.json({ success: true, projects });
    }
    const db = readDb();
    let projects = db.projects || [];
    if (req.query.mine === 'true') projects = projects.filter((project) => String(project.owner) === ownerId(req));
    if (req.query.studentId) projects = projects.filter((project) => String(project.owner) === String(req.query.studentId));
    if (req.query.status) projects = projects.filter((project) => project.status === req.query.status);
    if (req.query.category) projects = projects.filter((project) => project.category === req.query.category);
    if (query) projects = projects.filter((project) => `${project.title} ${project.description} ${project.category} ${(project.technologies || []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
    return res.json({ success: true, projects: projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((project) => withOwner(project, db)) });
  } catch (error) { next(error); }
};

exports.getProject = async (req, res, next) => {
  try {
    if (isConnected()) {
      const project = await Project.findById(req.params.id).populate('owner', 'name department year');
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const me = ownerId(req); const isOwner = String(project.owner?._id || project.owner) === me;
      const membership = await mongoose.connection.collection('projectmembers').findOne({ project: new mongoose.Types.ObjectId(req.params.id), student: new mongoose.Types.ObjectId(me) });
      const result = project.toObject(); if (!isOwner && !membership) result.media = [];
      return res.json({ success: true, project: result });
    }
    const db = readDb();
    const project = (db.projects || []).find((item) => item._id === req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const isMember = String(project.owner) === ownerId(req) || (db.projectmembers || []).some((m) => String(m.project) === String(project._id) && String(m.student) === ownerId(req));
    return res.json({ success: true, project: { ...withOwner(project, db), media: isMember ? (project.media || []) : [] } });
  } catch (error) { next(error); }
};

// Public project discovery deliberately returns only the published project fields.
exports.listPublicProjects = async (req, res, next) => {
  try {
    const q = String(req.query.search || '').trim();
    if (isConnected()) {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.technology) filter.technologies = req.query.technology;
      if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }, { technologies: { $regex: q, $options: 'i' } }];
      const projects = await Project.find(filter).populate('owner', 'name department year').sort({ createdAt: -1 });
      return res.json({ success: true, projects: projects.filter((p) => p.owner).map((p) => ({ _id: p._id, title: p.title, description: p.description, category: p.category, technologies: p.technologies, requiredSkills: p.requiredSkills || [], requiredRoles: p.requiredRoles || [], maxMembers: p.maxMembers || 5, currentMembers: p.currentMembers || 1, status: p.status, progress: p.progress || 0, thumbnail: p.thumbnail, owner: p.owner, createdAt: p.createdAt })) });
    }
    const db = readDb(); let projects = (db.projects || []).filter((p) => db.users.some((u) => String(u._id) === String(p.owner)));
    if (q) projects = projects.filter((p) => `${p.title} ${p.description} ${(p.technologies || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
    if (req.query.category) projects = projects.filter((p) => p.category === req.query.category);
    if (req.query.status) projects = projects.filter((p) => p.status === req.query.status);
    if (req.query.technology) projects = projects.filter((p) => (p.technologies || []).some((x) => x.toLowerCase() === String(req.query.technology).toLowerCase()));
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, projects: projects.map((p) => { const view = withOwner(p, db); const members = (db.projectmembers || []).filter((m) => String(m.project) === String(p._id)); return { _id: p._id, title: p.title, description: p.description, category: p.category, technologies: p.technologies || [], requiredSkills: p.requiredSkills || [], requiredRoles: p.requiredRoles || [], maxMembers: p.maxMembers || 5, currentMembers: members.length || 1, status: p.status, progress: p.progress || 0, thumbnail: p.thumbnail || '', owner: view.owner, createdAt: p.createdAt }; }) });
  } catch (error) { next(error); }
};

exports.getPublicProject = async (req, res, next) => {
  try {
    if (isConnected()) { const p = await Project.findById(req.params.id).populate('owner', 'name department year'); if (!p || !p.owner) return res.status(404).json({ success: false, message: 'Project not found.' }); return res.json({ success: true, project: { _id: p._id, title: p.title, description: p.description, category: p.category, technologies: p.technologies, requiredSkills: p.requiredSkills || [], requiredRoles: p.requiredRoles || [], maxMembers: p.maxMembers || 5, currentMembers: p.currentMembers || 1, status: p.status, thumbnail: p.thumbnail, owner: p.owner, createdAt: p.createdAt } }); }
    const db = readDb(); const p = (db.projects || []).find((x) => String(x._id) === String(req.params.id)); if (!p || !db.users.some((u) => String(u._id) === String(p.owner))) return res.status(404).json({ success: false, message: 'Project not found.' });
    const view = withOwner(p, db); const members = (db.projectmembers || []).filter((m) => String(m.project) === String(p._id)); return res.json({ success: true, project: { _id: p._id, title: p.title, description: p.description, category: p.category, technologies: p.technologies || [], requiredSkills: p.requiredSkills || [], requiredRoles: p.requiredRoles || [], maxMembers: p.maxMembers || 5, currentMembers: members.length || 1, status: p.status, thumbnail: p.thumbnail || '', owner: view.owner, createdAt: p.createdAt } });
  } catch (error) { next(error); }
};

exports.createProject = async (req, res, next) => {
  try {
    const payload = projectPayload(req.body);
    if (!payload.title || !payload.description) return res.status(400).json({ success: false, message: 'Project title and description are required' });
    if (isConnected()) return res.status(201).json({ success: true, project: await Project.create({ ...payload, owner: ownerId(req) }) });
    const db = readDb();
    const project = { _id: generateId(), owner: ownerId(req), ...payload, currentMembers: 1, media: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.projects.push(project); writeDb(db);
    db.projectmembers.push({ _id: generateId(), project: project._id, student: ownerId(req), role: payload.role, joinedAt: project.createdAt });
    writeDb(db);
    return res.status(201).json({ success: true, project: withOwner(project, db) });
  } catch (error) { next(error); }
};

exports.updateProject = async (req, res, next) => {
  try {
    if (isConnected()) {
      const project = await Project.findOne({ _id: req.params.id, owner: ownerId(req) });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
      const previousStatus = project.status; Object.assign(project, projectPayload(req.body)); await project.save();
      return res.json({ success: true, project });
    }
    const db = readDb(); const project = (db.projects || []).find((item) => item._id === req.params.id && String(item.owner) === ownerId(req));
    if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    const previousStatus = project.status; Object.assign(project, projectPayload(req.body), { updatedAt: new Date().toISOString() });
    if (previousStatus !== project.status) (db.projectmembers || []).filter((m) => String(m.project) === String(project._id) && String(m.student) !== ownerId(req)).forEach((m) => db.notifications.push({ _id: generateId(), recipient: String(m.student), sender: ownerId(req), project: project._id, type: 'status', isRead: false, message: `Project status changed to ${project.status}.`, createdAt: new Date().toISOString() }));
    writeDb(db);
    return res.json({ success: true, project: withOwner(project, db) });
  } catch (error) { next(error); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    if (isConnected()) {
      const project = await Project.findOneAndDelete({ _id: req.params.id, owner: ownerId(req) });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
      return res.json({ success: true, message: 'Project deleted successfully' });
    }
    const db = readDb(); const index = (db.projects || []).findIndex((item) => item._id === req.params.id && String(item.owner) === ownerId(req));
    if (index < 0) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    db.projects.splice(index, 1); writeDb(db); return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) { next(error); }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please choose a file' });
    const media = { _id: generateId(), filePath: `/uploads/projects/${req.file.filename}`, fileName: req.file.originalname, fileType: req.file.mimetype === 'application/pdf' ? 'document' : 'image', description: req.body.description || '', uploadedAt: new Date().toISOString() };
    if (isConnected()) {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
      const isMember = await mongoose.connection.collection('projectmembers').findOne({ project: new mongoose.Types.ObjectId(req.params.id), student: new mongoose.Types.ObjectId(ownerId(req)) });
      if (String(project.owner) !== ownerId(req) && !isMember) return res.status(403).json({ success: false, message: 'Only project team members can share files.' });
      project.media.push(media); await project.save(); return res.status(201).json({ success: true, media });
    }
    const db = readDb(); const project = (db.projects || []).find((item) => item._id === req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    const isMember = String(project.owner) === ownerId(req) || (db.projectmembers || []).some((m) => String(m.project) === String(project._id) && String(m.student) === ownerId(req));
    if (!isMember) return res.status(403).json({ success: false, message: 'Only project team members can share files.' });
    project.media = project.media || []; project.media.push(media);
    (db.projectmembers || []).filter((m) => String(m.project) === String(project._id) && String(m.student) !== ownerId(req)).forEach((m) => db.notifications.push({ _id: generateId(), recipient: String(m.student), sender: ownerId(req), project: project._id, type: 'file_shared', isRead: false, message: `${req.user.name} shared a project file: ${media.fileName}.`, createdAt: media.uploadedAt }));
    writeDb(db); return res.status(201).json({ success: true, media });
  } catch (error) { next(error); }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    if (isConnected()) {
      const project = await Project.findOne({ _id: req.params.id, owner: ownerId(req) });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
      project.media = project.media.filter((item) => String(item._id) !== req.params.mediaId); await project.save(); return res.json({ success: true });
    }
    const db = readDb(); const project = (db.projects || []).find((item) => item._id === req.params.id && String(item.owner) === ownerId(req));
    if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    project.media = (project.media || []).filter((item) => item._id !== req.params.mediaId); writeDb(db); return res.json({ success: true });
  } catch (error) { next(error); }
};
