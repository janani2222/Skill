const mongoose = require('mongoose');
const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');
const Project = require('../models/Project');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

const currentId = (req) => String(req.user._id || req.user.id);
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
      return { _id: sId, name: 'Student', avatar: '/avatars/professional-neutral.svg' };
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
    return u
      ? { _id: String(u._id), name: u.name, email: u.email, department: u.department, year: u.year, avatar: p?.avatar || '/avatars/professional-neutral.svg' }
      : { _id: sId, name: 'Student', avatar: '/avatars/professional-neutral.svg' };
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

const notify = async (recipient, sender, project, message, type, eventId = '') => {
  const notification = {
    _id: generateId(),
    recipient: String(recipient),
    sender: String(sender),
    project: project ? String(project._id) : null,
    message,
    type,
    isRead: false,
    createdAt: now(),
    ...(eventId ? { event: String(eventId) } : {}),
  };
  const alreadyStored = (items) => eventId && items.some(
    (item) => String(item.recipient) === notification.recipient
      && String(item.type) === type
      && String(item.event || '') === String(eventId)
  );

  if (isConnected()) {
    const notifications = mongoose.connection.db.collection('notifications');
    const existing = eventId
      ? await notifications.findOne({ recipient: notification.recipient, type, event: String(eventId) })
      : null;
    if (!existing) await notifications.insertOne(notification);
  }

  const db = readDb();
  db.notifications = db.notifications || [];
  if (!alreadyStored(db.notifications)) db.notifications.push(notification);
  writeDb(db);
};

const ensureRoomForAcceptedTeam = async (project) => {
  const pId = String(project._id);
  const members = await getProjectMembers(project._id);
  const allowedMembers = [...new Set([String(project.owner), ...members.map((m) => String(m.student))])];

  if (isConnected()) {
    let room = await mongoose.connection.db.collection('chatrooms').findOne({ project: pId });
    if (!room) {
      room = {
        _id: generateId(),
        type: 'group',
        project: pId,
        name: `${project.title} Group Chat`,
        members: allowedMembers,
        createdAt: now(),
        updatedAt: now(),
      };
      await mongoose.connection.db.collection('chatrooms').insertOne(room);
    } else {
      room.type = 'group';
      room.members = allowedMembers;
      room.name = room.name || `${project.title} Group Chat`;
      await mongoose.connection.db.collection('chatrooms').updateOne(
        { _id: room._id },
        { $set: { members: allowedMembers, name: room.name, type: 'group' } }
      );
    }
    return room;
  } else {
    const db = readDb();
    let room = (db.chatrooms || []).find((item) => String(item.project) === pId);
    if (!room) {
      room = { _id: generateId(), type: 'group', project: pId, name: `${project.title} Group Chat`, members: allowedMembers, createdAt: now() };
      db.chatrooms = db.chatrooms || [];
      db.chatrooms.push(room);
    } else {
      room.type = 'group';
      room.name = room.name || `${project.title} Group Chat`;
      room.members = allowedMembers;
    }
    writeDb(db);
    return room;
  }
};

const loadConversationView = async (room, me) => {
  const rId = String(room._id);
  let messages = [];
  if (isConnected()) {
    messages = await mongoose.connection.db.collection('chatmessages')
      .find({ room: rId })
      .sort({ createdAt: -1 })
      .toArray();
  } else {
    const db = readDb();
    messages = (db.chatmessages || []).filter((item) => String(item.room) === rId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const lastMessage = messages[0] || null;
  const project = room.type === 'group' && room.project ? await loadProject(room.project) : null;
  const other = room.type === 'direct' ? (room.members || []).find((id) => String(id) !== String(me)) : null;
  const otherUser = other ? await loadUserView(other) : null;
  const memberUsers = await Promise.all((room.members || []).map((id) => loadUserView(id)));

  return {
    _id: String(room._id),
    type: room.type || 'group',
    title: project?.title || (otherUser ? otherUser.name : room.name || 'Project Group'),
    avatar: project?.thumbnail || otherUser?.avatar || '/avatars/professional-neutral.svg',
    project: project ? { _id: String(project._id), title: project.title } : null,
    members: memberUsers.filter(Boolean),
    lastMessage: lastMessage ? { ...lastMessage, sender: await loadUserView(lastMessage.sender) } : null,
    unreadCount: messages.filter((item) => String(item.sender) !== String(me) && !(item.readBy || []).some((id) => String(id) === String(me))).length,
    updatedAt: lastMessage?.createdAt || room.updatedAt || room.createdAt,
  };
};

// ============================================================================
// Conversations & Direct Messaging
// ============================================================================
exports.listConversations = async (req, res, next) => {
  try {
    const me = currentId(req);
    let rooms = [];

    if (isConnected()) {
      const meFilter = [
        { student: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ student: new mongoose.Types.ObjectId(me) }] : [])
      ];
      const rawMembers = await mongoose.connection.db.collection('projectmembers').find({ $or: meFilter }).toArray();
      const memberProjectIds = rawMembers.map((m) => String(m.project));

      const pFilter = [
        { owner: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ owner: new mongoose.Types.ObjectId(me) }] : []),
        { _id: { $in: memberProjectIds } },
        ...(memberProjectIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => ({ _id: new mongoose.Types.ObjectId(id) })))
      ];
      const projects = await Project.find({ $or: pFilter });

      for (const project of projects) {
        await ensureRoomForAcceptedTeam(project);
      }

      rooms = await mongoose.connection.db.collection('chatrooms').find({
        members: { $in: [me, ...(mongoose.Types.ObjectId.isValid(me) ? [new mongoose.Types.ObjectId(me)] : [])] }
      }).toArray();
    } else {
      const db = readDb();
      const projects = (db.projects || []).filter(
        (project) => String(project.owner) === me || (db.projectmembers || []).some((item) => String(item.project) === String(project._id) && String(item.student) === me)
      );
      for (const project of projects) {
        await ensureRoomForAcceptedTeam(project);
      }
      rooms = (db.chatrooms || []).filter((room) => (room.members || []).some((id) => String(id) === me));
    }

    const conversationViews = await Promise.all(rooms.map((room) => loadConversationView(room, me)));
    conversationViews.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    res.json({ success: true, conversations: conversationViews });
  } catch (error) {
    next(error);
  }
};

exports.startDirectConversation = async (req, res, next) => {
  try {
    const me = currentId(req);
    const targetId = String(req.params.studentId);
    if (targetId === me) return res.status(400).json({ success: false, message: 'Choose another student to start a conversation.' });

    const target = await loadUserView(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Student not found.' });

    const meUser = await loadUserView(me);
    const members = [me, targetId].sort();

    let room = null;
    if (isConnected()) {
      room = await mongoose.connection.db.collection('chatrooms').findOne({
        type: 'direct',
        members: { $all: members, $size: 2 },
      });
      if (!room) {
        room = {
          _id: generateId(),
          type: 'direct',
          project: null,
          name: `${meUser.name} and ${target.name}`,
          members,
          createdAt: now(),
          updatedAt: now(),
        };
        await mongoose.connection.db.collection('chatrooms').insertOne(room);
      }
    } else {
      const db = readDb();
      room = (db.chatrooms || []).find(
        (item) => item.type === 'direct' && Array.isArray(item.members) && members.every((id) => item.members.some((member) => String(member) === id)) && item.members.length === 2
      );
      if (!room) {
        room = { _id: generateId(), type: 'direct', project: null, name: `${meUser.name} and ${target.name}`, members, createdAt: now() };
        db.chatrooms = db.chatrooms || [];
        db.chatrooms.push(room);
        writeDb(db);
      }
    }

    res.status(200).json({ success: true, conversation: await loadConversationView(room, me) });
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const me = currentId(req);
    const cId = String(req.params.conversationId);
    let room = null;

    if (isConnected()) {
      room = await mongoose.connection.db.collection('chatrooms').findOne({
        $or: [
          { _id: cId },
          ...(mongoose.Types.ObjectId.isValid(cId) ? [{ _id: new mongoose.Types.ObjectId(cId) }] : [])
        ]
      });
    }
    if (!room) {
      const db = readDb();
      room = (db.chatrooms || []).find((item) => String(item._id) === cId);
    }

    if (!room || !(room.members || []).some((id) => String(id) === me)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (room.type !== 'direct' && room.project) {
      const project = await loadProject(room.project);
      const members = project ? await getProjectMembers(project._id) : [];
      const allowed = project && (String(project.owner) === me || members.some((item) => String(item.student) === me));
      if (!allowed) return res.status(403).json({ success: false, message: 'Only current project team members can access this group.' });
      await ensureRoomForAcceptedTeam(project);
    }

    let messages = [];
    if (isConnected()) {
      messages = await mongoose.connection.db.collection('chatmessages')
        .find({ room: String(room._id) })
        .sort({ createdAt: 1 })
        .toArray();

      await mongoose.connection.db.collection('chatmessages').updateMany(
        { room: String(room._id), readBy: { $ne: me } },
        { $addToSet: { readBy: me } }
      );
    } else {
      const db = readDb();
      messages = (db.chatmessages || []).filter((item) => String(item.room) === String(room._id)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      messages.forEach((item) => {
        item.readBy = item.readBy || [];
        if (!item.readBy.some((id) => String(id) === me)) item.readBy.push(me);
      });
      writeDb(db);
    }

    const unreadCount = messages.filter((item) => String(item.sender) !== me && !(item.readBy || []).some((id) => String(id) === me)).length;

    const populatedMessages = await Promise.all(
      messages.map(async (item) => ({
        ...item,
        _id: String(item._id),
        sender: await loadUserView(item.sender),
        readBy: item.readBy || [],
      }))
    );

    res.json({
      success: true,
      conversation: await loadConversationView(room, me),
      messages: populatedMessages,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendConversationMessage = async (req, res, next) => {
  try {
    const me = currentId(req);
    const cId = String(req.params.conversationId);
    let room = null;

    if (isConnected()) {
      room = await mongoose.connection.db.collection('chatrooms').findOne({
        $or: [
          { _id: cId },
          ...(mongoose.Types.ObjectId.isValid(cId) ? [{ _id: new mongoose.Types.ObjectId(cId) }] : [])
        ]
      });
    }
    if (!room) {
      const db = readDb();
      room = (db.chatrooms || []).find((item) => String(item._id) === cId);
    }

    if (!room || !(room.members || []).some((id) => String(id) === me)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    let project = null;
    if (room.type !== 'direct' && room.project) {
      project = await loadProject(room.project);
      const members = project ? await getProjectMembers(project._id) : [];
      const allowed = project && (String(project.owner) === me || members.some((item) => String(item.student) === me));
      if (!allowed) return res.status(403).json({ success: false, message: 'Only current project team members can post in this group.' });
      await ensureRoomForAcceptedTeam(project);
    }

    const text = String(req.body.message || '').trim();
    if ((!text && !req.file) || text.length > 5000) return res.status(400).json({ success: false, message: 'Write a message (up to 5,000 characters) or attach a file.' });

    const message = {
      _id: generateId(),
      room: String(room._id),
      sender: me,
      message: text,
      attachment: req.file
        ? {
            _id: generateId(),
            filePath: `/uploads/chat/${req.file.filename}`,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            uploadedAt: now(),
          }
        : null,
      readBy: [me],
      deliveredAt: now(),
      createdAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('chatmessages').insertOne({ ...message });
      await mongoose.connection.db.collection('chatrooms').updateOne(
        { _id: room._id },
        { $set: { updatedAt: message.createdAt } }
      );
    }
    const db = readDb();
    db.chatmessages = db.chatmessages || [];
    db.chatmessages.push(message);
    const lRoom = (db.chatrooms || []).find((r) => String(r._id) === String(room._id));
    if (lRoom) lRoom.updatedAt = message.createdAt;
    writeDb(db);

    const meUser = await loadUserView(me);
    const recipients = (room.members || []).filter((id) => String(id) !== me);
    for (const recipient of recipients) {
      const notif = {
        _id: generateId(),
        recipient: String(recipient),
        sender: me,
        project: project ? String(project._id) : null,
        conversation: String(room._id),
        message: `${meUser?.name || 'Someone'} sent you a message${project ? ` in ${project.title}` : ''}.`,
        type: project ? 'chat' : 'direct_message',
        isRead: false,
        createdAt: message.createdAt,
      };
      if (isConnected()) {
        await mongoose.connection.db.collection('notifications').insertOne(notif);
      }
      db.notifications = db.notifications || [];
      db.notifications.push(notif);
      writeDb(db);
    }

    res.status(201).json({ success: true, message: { ...message, sender: meUser } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Projects Explorer & Current Projects
// ============================================================================
exports.explore = async (req, res, next) => {
  try {
    const me = currentId(req);
    if (isConnected()) {
      const filter = {
        owner: {
          $ne: mongoose.Types.ObjectId.isValid(me) ? new mongoose.Types.ObjectId(me) : me
        }
      };
      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.technology) filter.technologies = req.query.technology;
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: String(req.query.search), $options: 'i' } },
          { description: { $regex: String(req.query.search), $options: 'i' } },
          { technologies: { $regex: String(req.query.search), $options: 'i' } },
        ];
      }
      const projects = await Project.find(filter).populate('owner', 'name department year').sort({ createdAt: -1 });
      return res.json({
        success: true,
        projects: projects
          .filter((p) => p.owner)
          .map((p) => ({
            _id: String(p._id),
            title: p.title,
            description: p.description,
            category: p.category,
            technologies: p.technologies,
            requiredSkills: p.requiredSkills || [],
            requiredRoles: p.requiredRoles || [],
            maxMembers: p.maxMembers || 5,
            currentMembers: p.currentMembers || 1,
            status: p.status,
            thumbnail: p.thumbnail,
            owner: p.owner,
          })),
      });
    }

    const db = readDb();
    const q = String(req.query.search || '').toLowerCase();
    let projects = (db.projects || []).filter((p) => String(p.owner) !== me);
    if (q) projects = projects.filter((p) => `${p.title} ${p.description} ${(p.technologies || []).join(' ')} ${(p.requiredSkills || []).join(' ')}`.toLowerCase().includes(q));
    if (req.query.category) projects = projects.filter((p) => p.category === req.query.category);
    if (req.query.status) projects = projects.filter((p) => p.status === req.query.status);
    projects.sort((a, b) => (req.query.sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)));
    res.json({ success: true, projects: await Promise.all(projects.map(async (p) => ({ ...p, owner: await loadUserView(p.owner) }))) });
  } catch (error) {
    next(error);
  }
};

exports.listCurrentProjects = async (req, res, next) => {
  try {
    const me = currentId(req);
    if (isConnected()) {
      const meFilter = [
        { student: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ student: new mongoose.Types.ObjectId(me) }] : [])
      ];
      const rawMembers = await mongoose.connection.db.collection('projectmembers').find({ $or: meFilter }).toArray();
      const ids = rawMembers.map((m) => String(m.project)).filter(Boolean);

      const filter = {
        $or: [
          { owner: me },
          ...(mongoose.Types.ObjectId.isValid(me) ? [{ owner: new mongoose.Types.ObjectId(me) }] : []),
          { _id: { $in: ids } },
          ...(ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => ({ _id: new mongoose.Types.ObjectId(id) })))
        ]
      };
      if (req.query.status) filter.status = req.query.status;
      if (req.query.search) {
        const q = String(req.query.search);
        filter.$and = [{ $or: [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }] }];
      }

      const projects = await Project.find(filter).populate('owner', 'name department year').sort({ updatedAt: -1 });

      const response = await Promise.all(
        projects.map(async (p) => {
          const pObj = p.toObject();
          const pId = String(p._id);
          const pMembers = await getProjectMembers(pId);
          const membersWithStudents = await Promise.all(
            pMembers.map(async (m) => ({
              ...m,
              student: await loadUserView(m.student),
            }))
          );
          return {
            ...pObj,
            _id: String(p._id),
            owner: p.owner ? { _id: String(p.owner._id), name: p.owner.name, department: p.owner.department, year: p.owner.year } : await loadUserView(p.owner),
            memberCount: membersWithStudents.length + 1,
            members: membersWithStudents.filter((m) => m.student),
            progress: pObj.progress || 0,
          };
        })
      );

      return res.json({ success: true, projects: response });
    }

    const db = readDb();
    const memberProjectIds = new Set((db.projectmembers || []).filter((m) => String(m.student) === me).map((m) => String(m.project)));
    let projects = (db.projects || []).filter((p) => String(p.owner) === me || memberProjectIds.has(String(p._id)));
    if (req.query.status) projects = projects.filter((p) => p.status === req.query.status);
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      projects = projects.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));
    }
    const response = await Promise.all(
      projects
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .map(async (p) => {
          const members = (db.projectmembers || [])
            .filter((m) => String(m.project) === String(p._id))
            .map((m) => ({ ...m, student: (db.users || []).find((u) => String(u._id) === String(m.student)) }))
            .filter((m) => m.student);
          return { ...p, owner: await loadUserView(p.owner), members, memberCount: members.length + 1, progress: p.progress || 0 };
        })
    );
    res.json({ success: true, projects: response });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Join Requests
// ============================================================================
exports.listRequests = async (req, res, next) => {
  try {
    const me = currentId(req);
    let requests = [];

    if (isConnected()) {
      const myProjects = await Project.find({
        $or: [
          { owner: me },
          ...(mongoose.Types.ObjectId.isValid(me) ? [{ owner: new mongoose.Types.ObjectId(me) }] : [])
        ]
      });
      const projectIds = myProjects.map((p) => String(p._id));
      const rawReqs = await mongoose.connection.db.collection('joinrequests').find({
        project: { $in: [...projectIds, ...projectIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))] },
        status: 'Pending',
      }).toArray();

      requests = await Promise.all(
        rawReqs.map(async (r) => ({
          ...r,
          _id: String(r._id),
          applicant: await loadUserView(r.applicant),
          project: myProjects.find((p) => String(p._id) === String(r.project)),
        }))
      );
    } else {
      const db = readDb();
      const mine = new Set((db.projects || []).filter((p) => String(p.owner) === me).map((p) => String(p._id)));
      requests = await Promise.all(
        (db.joinrequests || [])
          .filter((r) => mine.has(String(r.project)) && r.status === 'Pending')
          .map(async (r) => ({ ...r, applicant: await loadUserView(r.applicant), project: (db.projects || []).find((p) => String(p._id) === String(r.project)) }))
      );
    }

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const me = currentId(req);
    const project = await loadProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (String(project.owner) === me) return res.status(400).json({ success: false, message: 'You cannot join your own project.' });

    const members = await getProjectMembers(project._id);
    if (members.length + 1 >= Number(project.maxMembers || 5)) return res.status(400).json({ success: false, message: 'This team is full.' });
    if (members.some((m) => String(m.student) === me)) return res.status(409).json({ success: false, message: 'You are already a member of this project.' });

    let existingReq = null;
    if (isConnected()) {
      existingReq = await mongoose.connection.db.collection('joinrequests').findOne({
        project: String(project._id),
        applicant: me,
        status: 'Pending',
      });
    } else {
      const db = readDb();
      existingReq = (db.joinrequests || []).find((r) => String(r.project) === String(project._id) && String(r.applicant) === me && r.status === 'Pending');
    }
    if (existingReq) {
      const meUser = await loadUserView(me);
      await notify(
        project.owner,
        me,
        project,
        `${meUser?.name || 'A student'} has requested to join your project ${project.title}.`,
        'join_request',
        existingReq._id
      );
      return res.status(409).json({ success: false, message: 'You already have a pending request.' });
    }

    const request = {
      _id: generateId(),
      project: String(project._id),
      applicant: me,
      message: String(req.body.message || '').trim(),
      skills: String(req.body.skills || '').trim(),
      experience: String(req.body.experience || '').trim(),
      portfolioUrl: String(req.body.portfolioUrl || '').trim(),
      status: 'Pending',
      createdAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('joinrequests').insertOne({ ...request });
    }
    const db = readDb();
    db.joinrequests = db.joinrequests || [];
    db.joinrequests.push(request);
    writeDb(db);

    const meUser = await loadUserView(me);
    await notify(project.owner, me, project, `${meUser?.name || 'A student'} has requested to join your project ${project.title}.`, 'join_request', request._id);

    res.status(201).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const me = currentId(req);
    const rId = String(req.params.requestId);

    let request = null;
    if (isConnected()) {
      request = await mongoose.connection.db.collection('joinrequests').findOne({
        $or: [
          { _id: rId },
          ...(mongoose.Types.ObjectId.isValid(rId) ? [{ _id: new mongoose.Types.ObjectId(rId) }] : [])
        ]
      });
    }
    if (!request) {
      const db = readDb();
      request = (db.joinrequests || []).find((r) => String(r._id) === rId);
    }

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    const project = await loadProject(request.project);
    if (!project || String(project.owner) !== me) return res.status(403).json({ success: false, message: 'You cannot manage this request.' });
    if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'This request has already been handled.' });
    if (!['Accepted', 'Rejected'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Request status must be Accepted or Rejected.' });

    const pId = String(project._id);
    const applicantId = String(request.applicant);

    if (req.body.status === 'Accepted') {
      const members = await getProjectMembers(project._id);
      if (members.length + 1 >= Number(project.maxMembers || 5)) return res.status(400).json({ success: false, message: 'This team is full.' });
      if (members.some((m) => String(m.student) === applicantId)) return res.status(409).json({ success: false, message: 'This student is already a team member.' });

      request.status = 'Accepted';
      const newMember = {
        _id: generateId(),
        project: pId,
        student: applicantId,
        role: req.body.role || project.role || 'Contributor',
        joinedAt: now(),
      };

      if (isConnected()) {
        await mongoose.connection.db.collection('joinrequests').updateOne({ _id: request._id }, { $set: { status: 'Accepted' } });
        await mongoose.connection.db.collection('projectmembers').insertOne(newMember);
        await mongoose.connection.db.collection('chatrooms').updateMany(
          { project: pId },
          { $addToSet: { members: applicantId } }
        );
      }
      const db = readDb();
      const lReq = (db.joinrequests || []).find((r) => String(r._id) === String(request._id));
      if (lReq) lReq.status = 'Accepted';
      db.projectmembers = db.projectmembers || [];
      db.projectmembers.push(newMember);
      (db.chatrooms || []).filter((r) => String(r.project) === pId).forEach((r) => {
        r.members = r.members || [];
        if (!r.members.includes(applicantId)) r.members.push(applicantId);
      });
      writeDb(db);

      await notify(applicantId, me, project, `Congratulations! Your request to join ${project.title} has been accepted by the project owner.`, 'request_accepted', request._id);
    } else {
      request.status = 'Rejected';
      if (isConnected()) {
        await mongoose.connection.db.collection('joinrequests').updateOne({ _id: request._id }, { $set: { status: 'Rejected' } });
      }
      const db = readDb();
      const lReq = (db.joinrequests || []).find((r) => String(r._id) === String(request._id));
      if (lReq) lReq.status = 'Rejected';
      writeDb(db);

      await notify(applicantId, me, project, `Your request to join ${project.title} was not accepted.`, 'request_rejected', request._id);
    }

    const currentMembers = (await getProjectMembers(project._id)).length + 1;
    if (isConnected()) {
      await Project.updateOne({ _id: project._id }, { $set: { currentMembers } });
    }
    const db = readDb();
    const lp = (db.projects || []).find((p) => String(p._id) === pId);
    if (lp) lp.currentMembers = currentMembers;
    writeDb(db);

    res.json({ success: true, request, currentMembers });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Notifications
// ============================================================================
exports.listNotifications = async (req, res, next) => {
  try {
    const me = currentId(req);
    let notifications = [];

    if (isConnected()) {
      const meFilter = [
        { recipient: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ recipient: new mongoose.Types.ObjectId(me) }] : [])
      ];
      notifications = await mongoose.connection.db.collection('notifications')
        .find({ $or: meFilter })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      const db = readDb();
      notifications = (db.notifications || []).filter((n) => String(n.recipient) === me).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const invitationIds = notifications
      .filter((notification) => notification.type === 'team_invitation' && notification.invitationId)
      .map((notification) => String(notification.invitationId));
    let invitations = [];
    if (invitationIds.length && isConnected()) {
      invitations = await mongoose.connection.db.collection('teaminvitations')
        .find({ _id: { $in: invitationIds } })
        .project({ _id: 1, status: 1 })
        .toArray();
    } else if (invitationIds.length) {
      const db = readDb();
      invitations = (db.teaminvitations || []).filter((invitation) => invitationIds.includes(String(invitation._id)));
    }
    const invitationStatus = new Map(invitations.map((invitation) => [String(invitation._id), invitation.status]));

    const populated = await Promise.all(
      notifications.map(async (n) => {
        const project = n.project ? await loadProject(n.project) : null;
        return {
          ...n,
          _id: String(n._id),
          sender: await loadUserView(n.sender),
          projectTitle: project?.title || '',
          ...(n.invitationId ? { invitationStatus: invitationStatus.get(String(n.invitationId)) || 'Unavailable' } : {}),
        };
      })
    );

    res.json({ success: true, notifications: populated });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    const me = currentId(req);
    if (isConnected()) {
      const meFilter = [
        { recipient: me },
        ...(mongoose.Types.ObjectId.isValid(me) ? [{ recipient: new mongoose.Types.ObjectId(me) }] : [])
      ];
      await mongoose.connection.db.collection('notifications').updateMany({ $or: meFilter }, { $set: { isRead: true } });
    }
    const db = readDb();
    (db.notifications || []).filter((n) => String(n.recipient) === me).forEach((n) => { n.isRead = true; });
    writeDb(db);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const me = currentId(req);
    const nId = String(req.params.notificationId);
    if (isConnected()) {
      await mongoose.connection.db.collection('notifications').updateOne(
        { _id: nId, recipient: me },
        { $set: { isRead: true } }
      );
    }
    const db = readDb();
    const item = (db.notifications || []).find((n) => String(n._id) === nId && String(n.recipient) === me);
    if (item) {
      item.isRead = true;
      writeDb(db);
    }
    res.json({ success: true, notification: item || { _id: nId, isRead: true } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Project Access & Chat
// ============================================================================
exports.getProjectAccess = async (req, res, next) => {
  try {
    const me = currentId(req);
    const project = await loadProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const pId = String(project._id);
    const isOwner = String(project.owner) === me;
    const members = await getProjectMembers(project._id);
    const member = members.find((item) => String(item.student) === me);

    let request = null;
    let room = null;

    if (isConnected()) {
      request = await mongoose.connection.db.collection('joinrequests').findOne(
        { project: pId, applicant: me },
        { sort: { createdAt: -1 } }
      );
      room = await mongoose.connection.db.collection('chatrooms').findOne({
        project: pId,
        members: { $in: [me, ...(mongoose.Types.ObjectId.isValid(me) ? [new mongoose.Types.ObjectId(me)] : [])] }
      });
    } else {
      const db = readDb();
      request = [...(db.joinrequests || [])].reverse().find((item) => String(item.project) === pId && String(item.applicant) === me);
      room = (db.chatrooms || []).find((item) => String(item.project) === pId && item.members.some((id) => String(id) === me));
    }

    res.json({
      success: true,
      status: isOwner ? 'owner' : member ? 'member' : request?.status?.toLowerCase() || 'none',
      requestStatus: request?.status || null,
      room: room ? { _id: String(room._id), name: room.name } : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getChat = async (req, res, next) => {
  try {
    const me = currentId(req);
    const project = await loadProject(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const members = await getProjectMembers(project._id);
    const allowed = String(project.owner) === me || members.some((item) => String(item.student) === me);
    if (!allowed) return res.status(403).json({ success: false, message: 'Join the project to access its group chat.' });

    const room = await ensureRoomForAcceptedTeam(project);
    const rId = String(room._id);

    let messages = [];
    if (isConnected()) {
      messages = await mongoose.connection.db.collection('chatmessages')
        .find({ room: rId })
        .sort({ createdAt: 1 })
        .toArray();

      await mongoose.connection.db.collection('chatmessages').updateMany(
        { room: rId, readBy: { $ne: me } },
        { $addToSet: { readBy: me } }
      );
    } else {
      const db = readDb();
      messages = (db.chatmessages || []).filter((item) => String(item.room) === rId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      messages.forEach((item) => {
        item.readBy = item.readBy || [];
        if (!item.readBy.some((id) => String(id) === me)) item.readBy.push(me);
      });
      writeDb(db);
    }

    const unreadCount = messages.filter((item) => String(item.sender) !== me && !(item.readBy || []).some((id) => String(id) === me)).length;
    const populatedMessages = await Promise.all(
      messages.map(async (item) => ({
        ...item,
        _id: String(item._id),
        sender: await loadUserView(item.sender),
        readBy: item.readBy || [],
      }))
    );

    const roomView = await loadConversationView(room, me);

    res.json({
      success: true,
      unreadCount,
      room: roomView,
      messages: populatedMessages,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const me = currentId(req);
    const project = await loadProject(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const members = await getProjectMembers(project._id);
    const allowed = String(project.owner) === me || members.some((item) => String(item.student) === me);
    if (!allowed) return res.status(403).json({ success: false, message: 'Join the project to access its group chat.' });

    const text = String(req.body.message || '').trim();
    const link = String(req.body.link || '').trim();
    if (!text && !link && !req.file) return res.status(400).json({ success: false, message: 'Write a message or attach a file.' });
    if (link && !/^https?:\/\//i.test(link)) return res.status(400).json({ success: false, message: 'Only http or https links can be shared.' });

    const room = await ensureRoomForAcceptedTeam(project);
    const message = {
      _id: generateId(),
      room: String(room._id),
      sender: me,
      message: text,
      link,
      attachment: req.file
        ? {
            _id: generateId(),
            filePath: `/uploads/chat/${req.file.filename}`,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            uploadedAt: now(),
          }
        : null,
      readBy: [me],
      deliveredAt: now(),
      createdAt: now(),
    };

    if (isConnected()) {
      await mongoose.connection.db.collection('chatmessages').insertOne({ ...message });
      await mongoose.connection.db.collection('chatrooms').updateOne(
        { _id: room._id },
        { $set: { updatedAt: message.createdAt } }
      );
    }
    const db = readDb();
    db.chatmessages = db.chatmessages || [];
    db.chatmessages.push(message);
    const lRoom = (db.chatrooms || []).find((r) => String(r._id) === String(room._id));
    if (lRoom) lRoom.updatedAt = message.createdAt;
    writeDb(db);

    const meUser = await loadUserView(me);
    const otherMembers = (room.members || []).filter((member) => String(member) !== me);
    for (const recipient of otherMembers) {
      const notif = {
        _id: generateId(),
        recipient: String(recipient),
        sender: me,
        project: String(project._id),
        message: `${meUser?.name || 'A team member'} sent a new message in ${project.title}.`,
        type: 'chat',
        isRead: false,
        createdAt: message.createdAt,
      };
      if (isConnected()) {
        await mongoose.connection.db.collection('notifications').insertOne(notif);
      }
      db.notifications = db.notifications || [];
      db.notifications.push(notif);
      writeDb(db);
    }

    res.status(201).json({ success: true, message: { ...message, sender: meUser } });
  } catch (error) {
    next(error);
  }
};
