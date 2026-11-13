const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

const currentId = (req) => String(req.user._id || req.user.id);
const userView = (db, id) => {
  const user = (db.users || []).find((item) => String(item._id) === String(id));
  if (!user) return { _id: id, name: 'Student' };
  const profile = (db.studentprofiles || []).find((item) => String(item.user) === String(id));
  return { _id: user._id, name: user.name, department: user.department, year: user.year, avatar: profile?.avatar || '/avatars/professional-neutral.svg' };
};
const projectView = (db, project) => ({ ...project, owner: userView(db, project.owner), currentMembers: (db.projectmembers || []).filter((m) => String(m.project) === String(project._id)).length || project.currentMembers || 1 });
// Older accepted memberships may predate creation of a chat room (or may have
// a room whose member list did not get updated). Keep chat access aligned with
// the authoritative project membership records.
const roomForAcceptedTeam = (db, project) => {
  const memberIds = (db.projectmembers || [])
    .filter((item) => String(item.project) === String(project._id))
    .map((item) => String(item.student));
  const allowedMembers = [...new Set([String(project.owner), ...memberIds])];
  let room = (db.chatrooms || []).find((item) => String(item.project) === String(project._id));
  if (!room) {
    room = { _id: generateId(), type: 'group', project: project._id, name: `${project.title} Group Chat`, members: allowedMembers, createdAt: new Date().toISOString() };
    db.chatrooms.push(room);
  } else {
    room.type = 'group';
    room.name = room.name || `${project.title} Group Chat`;
    room.members = allowedMembers;
  }
  return room;
};
const conversationView = (db, room, me) => {
  const messages = (db.chatmessages || []).filter((item) => String(item.room) === String(room._id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const lastMessage = messages[0] || null;
  const project = room.type === 'group' && room.project ? (db.projects || []).find((item) => String(item._id) === String(room.project)) : null;
  const other = room.type === 'direct' ? (room.members || []).find((id) => String(id) !== me) : null;
  const profile = other && (db.studentprofiles || []).find((item) => String(item.user) === String(other));
  return {
    _id: room._id,
    type: room.type || 'group',
    title: project?.title || (other ? userView(db, other).name : room.name || 'Project Group'),
    avatar: project?.thumbnail || profile?.avatar || '/avatars/professional-neutral.svg',
    project: project ? { _id: project._id, title: project.title } : null,
    members: (room.members || []).map((id) => userView(db, id)),
    lastMessage: lastMessage ? { ...lastMessage, sender: userView(db, lastMessage.sender) } : null,
    unreadCount: messages.filter((item) => String(item.sender) !== me && !(item.readBy || []).some((id) => String(id) === me)).length,
    updatedAt: lastMessage?.createdAt || room.updatedAt || room.createdAt,
  };
};

exports.listConversations = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Messaging is currently available in local mode.' });
    const db = readDb(); const me = currentId(req);
    // Ensure every existing accepted team has its group conversation available.
    const projects = (db.projects || []).filter((project) => String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me));
    projects.forEach((project) => roomForAcceptedTeam(db, project));
    const rooms = (db.chatrooms || []).filter((room) => (room.members || []).some((id) => String(id) === me));
    writeDb(db);
    res.json({ success: true, conversations: rooms.map((room) => conversationView(db, room, me)).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)) });
  } catch (error) { next(error); }
};

exports.startDirectConversation = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Messaging is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const targetId = String(req.params.studentId);
    if (targetId === me) return res.status(400).json({ success: false, message: 'Choose another student to start a conversation.' });
    const target = (db.users || []).find((item) => String(item._id) === targetId && item.active !== false);
    if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });
    const members = [me, targetId].sort();
    let room = (db.chatrooms || []).find((item) => item.type === 'direct' && Array.isArray(item.members) && members.every((id) => item.members.some((member) => String(member) === id)) && item.members.length === 2);
    if (!room) {
      room = { _id: generateId(), type: 'direct', project: null, name: `${userView(db, me).name} and ${target.name}`, members, createdAt: new Date().toISOString() };
      db.chatrooms.push(room); writeDb(db);
    }
    res.status(200).json({ success: true, conversation: conversationView(db, room, me) });
  } catch (error) { next(error); }
};

exports.getConversation = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Messaging is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const room = (db.chatrooms || []).find((item) => String(item._id) === String(req.params.conversationId));
    if (!room || !(room.members || []).some((id) => String(id) === me)) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    if (room.type !== 'direct') {
      const project = (db.projects || []).find((item) => String(item._id) === String(room.project));
      const allowed = project && (String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me));
      if (!allowed) return res.status(403).json({ success: false, message: 'Only current project team members can access this group.' });
      roomForAcceptedTeam(db, project);
    }
    const messages = (db.chatmessages || []).filter((item) => String(item.room) === String(room._id)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const unreadCount = messages.filter((item) => String(item.sender) !== me && !(item.readBy || []).some((id) => String(id) === me)).length;
    messages.forEach((item) => { item.readBy = item.readBy || []; if (!item.readBy.some((id) => String(id) === me)) item.readBy.push(me); });
    writeDb(db);
    res.json({ success: true, conversation: conversationView(db, room, me), messages: messages.map((item) => ({ ...item, sender: userView(db, item.sender), readBy: item.readBy || [] })), unreadCount });
  } catch (error) { next(error); }
};

exports.sendConversationMessage = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Messaging is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const room = (db.chatrooms || []).find((item) => String(item._id) === String(req.params.conversationId));
    if (!room || !(room.members || []).some((id) => String(id) === me)) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    if (room.type !== 'direct') {
      const project = (db.projects || []).find((item) => String(item._id) === String(room.project));
      const allowed = project && (String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me));
      if (!allowed) return res.status(403).json({ success: false, message: 'Only current project team members can post in this group.' });
      roomForAcceptedTeam(db, project);
    }
    const text = String(req.body.message || '').trim();
    if ((!text && !req.file) || text.length > 5000) return res.status(400).json({ success: false, message: 'Write a message (up to 5,000 characters) or attach a file.' });
    const message = { _id: generateId(), room: room._id, sender: me, message: text, attachment: req.file ? { _id: generateId(), filePath: `/uploads/chat/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, uploadedAt: new Date().toISOString() } : null, readBy: [me], deliveredAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    db.chatmessages.push(message);
    room.updatedAt = message.createdAt;
    const project = room.type === 'group' && room.project ? (db.projects || []).find((item) => String(item._id) === String(room.project)) : null;
    room.members.filter((id) => String(id) !== me).forEach((recipient) => db.notifications.push({ _id: generateId(), recipient: String(recipient), sender: me, project: project?._id || null, conversation: room._id, message: `${userView(db, me).name} sent you a message${project ? ` in ${project.title}` : ''}.`, type: project ? 'chat' : 'direct_message', isRead: false, createdAt: message.createdAt }));
    writeDb(db);
    res.status(201).json({ success: true, message: { ...message, sender: userView(db, me) } });
  } catch (error) { next(error); }
};

exports.explore = (req, res, next) => {
  try {
    if (isConnected()) {
      const filter = { owner: { $ne: currentId(req) } };
      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.technology) filter.technologies = req.query.technology;
      if (req.query.search) filter.$or = [{ title: { $regex: String(req.query.search), $options: 'i' } }, { description: { $regex: String(req.query.search), $options: 'i' } }, { technologies: { $regex: String(req.query.search), $options: 'i' } }];
      return Project.find(filter).populate('owner', 'name department year').sort({ createdAt: -1 }).then((projects) => res.json({ success: true, projects: projects.filter((p) => p.owner).map((p) => ({ _id:p._id,title:p.title,description:p.description,category:p.category,technologies:p.technologies,requiredSkills:p.requiredSkills||[],requiredRoles:p.requiredRoles||[],maxMembers:p.maxMembers||5,currentMembers:p.currentMembers||1,status:p.status,thumbnail:p.thumbnail,owner:p.owner })) })).catch(next);
    }
    const db = readDb(); const me = currentId(req);
    const q = String(req.query.search || '').toLowerCase();
    let projects = (db.projects || []).filter((p) => String(p.owner) !== me);
    if (q) projects = projects.filter((p) => `${p.title} ${p.description} ${(p.technologies || []).join(' ')} ${(p.requiredSkills || []).join(' ')}`.toLowerCase().includes(q));
    if (req.query.category) projects = projects.filter((p) => p.category === req.query.category);
    if (req.query.status) projects = projects.filter((p) => p.status === req.query.status);
    projects.sort((a, b) => req.query.sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, projects: projects.map((p) => projectView(db, p)) });
  } catch (error) { next(error); }
};

exports.listCurrentProjects = async (req, res, next) => {
  try {
    const me = currentId(req);
    if (isConnected()) {
      const meObjectId = new mongoose.Types.ObjectId(me);
      const rawMembers = await mongoose.connection.collection('projectmembers').find({ student: meObjectId }).toArray();
      const ids = rawMembers.map((m) => m.project).filter(Boolean);
      const filter = { $or: [{ owner: meObjectId }, { _id: { $in: ids } }] };
      if (req.query.status) filter.status = req.query.status;
      const projects = await Project.find(filter).populate('owner', 'name department year').sort({ updatedAt: -1 });
      return res.json({ success: true, projects: projects.map((p) => ({ ...p.toObject(), memberCount: p.currentMembers || 1, members: [] })) });
    }
    const db = readDb();
    const memberProjectIds = new Set((db.projectmembers || []).filter((m) => String(m.student) === me).map((m) => String(m.project)));
    let projects = (db.projects || []).filter((p) => String(p.owner) === me || memberProjectIds.has(String(p._id)));
    if (req.query.status) projects = projects.filter((p) => p.status === req.query.status);
    if (req.query.search) { const q = String(req.query.search).toLowerCase(); projects = projects.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q)); }
    const response = projects.sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt)).map((p) => {
      const members = (db.projectmembers || []).filter((m) => String(m.project) === String(p._id)).map((m) => ({ ...m, student: userView(db, m.student) })).filter((m) => m.student);
      return { ...p, owner: userView(db, p.owner), members, memberCount: members.length || 1 };
    });
    res.json({ success: true, projects: response });
  } catch (error) { next(error); }
};

exports.listRequests = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const mine = new Set((db.projects || []).filter((p) => String(p.owner) === currentId(req)).map((p) => String(p._id)));
    const requests = (db.joinrequests || []).filter((r) => mine.has(String(r.project)) && r.status === 'Pending').map((r) => ({ ...r, applicant: userView(db, r.applicant), project: db.projects.find((p) => p._id === r.project) }));
    res.json({ success: true, requests });
  } catch (error) { next(error); }
};

exports.createRequest = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const project = (db.projects || []).find((p) => p._id === req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (String(project.owner) === me) return res.status(400).json({ success: false, message: 'You cannot join your own project.' });
    const members = db.projectmembers.filter((m) => String(m.project) === String(project._id));
    if (members.length >= Number(project.maxMembers || 5)) return res.status(400).json({ success: false, message: 'This team is full.' });
    if (db.joinrequests.some((r) => String(r.project) === String(project._id) && String(r.applicant) === me && r.status === 'Pending')) return res.status(409).json({ success: false, message: 'You already have a pending request.' });
    const request = { _id: generateId(), project: project._id, applicant: me, message: String(req.body.message || '').trim(), skills: String(req.body.skills || '').trim(), experience: String(req.body.experience || '').trim(), portfolioUrl: String(req.body.portfolioUrl || '').trim(), status: 'Pending', createdAt: new Date().toISOString() };
    db.joinrequests.push(request);
    db.notifications.push({ _id: generateId(), recipient: project.owner, sender: me, project: project._id, message: `${userView(db, me).name} has requested to join your project ${project.title}.`, type: 'join_request', isRead: false, createdAt: request.createdAt });
    writeDb(db); res.status(201).json({ success: true, request });
  } catch (error) { next(error); }
};

exports.updateRequest = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const request = db.joinrequests.find((r) => r._id === req.params.requestId); const project = db.projects.find((p) => p._id === request?.project);
    if (!request || !project || String(project.owner) !== currentId(req)) return res.status(403).json({ success: false, message: 'You cannot manage this request.' });
    if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'This request has already been handled.' });
    if (req.body.status === 'Accepted') {
      const members = db.projectmembers.filter((m) => String(m.project) === String(project._id));
      if (members.length >= Number(project.maxMembers || 5)) return res.status(400).json({ success: false, message: 'This team is full.' });
      request.status = 'Accepted'; db.projectmembers.push({ _id: generateId(), project: project._id, student: request.applicant, role: req.body.role || project.role || 'Contributor', joinedAt: new Date().toISOString() });
      let room = db.chatrooms.find((item) => String(item.project) === String(project._id));
      if (!room) room = { _id: generateId(), project: project._id, name: `${project.title} Group Chat`, members: [project.owner, request.applicant], createdAt: new Date().toISOString() };
      else if (!room.members.some((member) => String(member) === String(request.applicant))) room.members.push(request.applicant);
      if (!db.chatrooms.some((item) => item._id === room._id)) db.chatrooms.push(room);
      db.notifications.push({ _id: generateId(), recipient: request.applicant, sender: currentId(req), project: project._id, message: `Congratulations! Your request to join ${project.title} has been accepted by the project owner.`, type: 'request_accepted', isRead: false, createdAt: new Date().toISOString() });
    } else { request.status = 'Rejected'; db.notifications.push({ _id: generateId(), recipient: request.applicant, sender: currentId(req), project: project._id, message: `Your request to join ${project.title} was not accepted.`, type: 'request_rejected', isRead: false, createdAt: new Date().toISOString() }); }
    project.currentMembers = db.projectmembers.filter((m) => String(m.project) === String(project._id)).length; writeDb(db); res.json({ success: true, request });
  } catch (error) { next(error); }
};

exports.listNotifications = (req, res, next) => {
  try { const db = readDb(); const me = currentId(req); const soon = Date.now() + 24 * 60 * 60 * 1000;
    (db.projecttasks || []).filter((t) => String(t.assignee) === me && t.deadline && new Date(t.deadline).getTime() >= Date.now() && new Date(t.deadline).getTime() <= soon).forEach((task) => {
      if (!(db.notifications || []).some((n) => String(n.recipient) === me && n.task === task._id && n.type === 'task_deadline')) db.notifications.push({ _id: generateId(), recipient: me, project: task.project, task: task._id, message: `Task deadline approaching: ${task.title}`, type: 'task_deadline', isRead: false, createdAt: new Date().toISOString() });
    });
    writeDb(db); const notifications = (db.notifications || []).filter((n) => String(n.recipient) === me).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((n) => ({ ...n, sender: userView(db, n.sender), projectTitle: db.projects.find((p) => String(p._id) === String(n.project))?.title || '' })); res.json({ success: true, notifications }); } catch (error) { next(error); }
};
exports.markNotificationsRead = (req, res, next) => {
  try { const db = readDb(); db.notifications.filter((n) => String(n.recipient) === currentId(req)).forEach((n) => { n.isRead = true; }); writeDb(db); res.json({ success: true }); } catch (error) { next(error); }
};
exports.markNotificationRead = (req, res, next) => {
  try { const db = readDb(); const item = db.notifications.find((n) => n._id === req.params.notificationId && String(n.recipient) === currentId(req)); if (!item) return res.status(404).json({ success: false, message: 'Notification not found.' }); item.isRead = true; writeDb(db); res.json({ success: true, notification: item }); } catch (error) { next(error); }
};

exports.getProjectAccess = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const project = db.projects.find((item) => item._id === req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const isOwner = String(project.owner) === me;
    const member = db.projectmembers.find((item) => String(item.project) === String(project._id) && String(item.student) === me);
    const request = [...db.joinrequests].reverse().find((item) => String(item.project) === String(project._id) && String(item.applicant) === me);
    const room = db.chatrooms.find((item) => String(item.project) === String(project._id) && item.members.some((id) => String(id) === me));
    res.json({ success: true, status: isOwner ? 'owner' : member ? 'member' : request?.status?.toLowerCase() || 'none', requestStatus: request?.status || null, room: room ? { _id: room._id, name: room.name } : null });
  } catch (error) { next(error); }
};

exports.getChat = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const project = (db.projects || []).find((item) => String(item._id) === String(req.params.projectId));
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    const allowed = String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me);
    if (!allowed) return res.status(403).json({ success: false, message: 'Join the project to access its group chat.' });
    const room = roomForAcceptedTeam(db, project);
    const stored = db.chatmessages.filter((item) => String(item.room) === String(room._id));
    const unreadCount = stored.filter((item) => String(item.sender) !== me && !(item.readBy || []).some((id) => String(id) === me)).length;
    stored.forEach((item) => { item.readBy = item.readBy || []; if (!item.readBy.some((id) => String(id) === me)) item.readBy.push(me); });
    writeDb(db);
    const messages = stored.map((item) => ({ ...item, sender: userView(db, item.sender), readBy: item.readBy || [] })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ success: true, unreadCount, room: { ...room, members: room.members.map((id) => userView(db, id)) }, messages });
  } catch (error) { next(error); }
};

exports.sendChatMessage = (req, res, next) => {
  try {
    if (isConnected()) return res.status(501).json({ success: false, message: 'Collaboration is currently available in local mode.' });
    const db = readDb(); const me = currentId(req); const project = (db.projects || []).find((item) => String(item._id) === String(req.params.projectId));
    const text = String(req.body.message || '').trim(); const link = String(req.body.link || '').trim();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    const allowed = String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me);
    if (!allowed) return res.status(403).json({ success: false, message: 'Join the project to access its group chat.' });
    const room = roomForAcceptedTeam(db, project);
    if (!text && !link && !req.file) return res.status(400).json({ success: false, message: 'Write a message or attach a file.' });
    if (link && !/^https?:\/\//i.test(link)) return res.status(400).json({ success: false, message: 'Only http or https links can be shared.' });
    const attachment = req.file ? { _id: generateId(), filePath: `/uploads/chat/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, uploadedAt: new Date().toISOString() } : null;
    const message = { _id: generateId(), room: room._id, sender: me, message: text, link, attachment, readBy: [me], deliveredAt: new Date().toISOString(), createdAt: new Date().toISOString() }; db.chatmessages.push(message);
    if (project) room.members.filter((member) => String(member) !== me).forEach((member) => db.notifications.push({ _id: generateId(), recipient: String(member), sender: me, project: project._id, message: `${userView(db, me).name} sent a new message in ${project.title}.`, type: 'chat', isRead: false, createdAt: message.createdAt }));
    writeDb(db);
    res.status(201).json({ success: true, message: { ...message, sender: userView(db, me) } });
  } catch (error) { next(error); }
};
