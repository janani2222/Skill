const mongoose = require('mongoose');
const { isConnected } = require('../config/db');
const { readDb } = require('../config/localDb');

const syncDataToMongo = async () => {
  if (!isConnected()) return;

  try {
    const db = readDb();
    const usersCol = mongoose.connection.db.collection('users');
    const profilesCol = mongoose.connection.db.collection('studentprofiles');
    const projectsCol = mongoose.connection.db.collection('projects');
    const membersCol = mongoose.connection.db.collection('projectmembers');
    const tasksCol = mongoose.connection.db.collection('projecttasks');
    const milestonesCol = mongoose.connection.db.collection('projectmilestones');
    const updatesCol = mongoose.connection.db.collection('progressupdates');
    const roomsCol = mongoose.connection.db.collection('chatrooms');
    const messagesCol = mongoose.connection.db.collection('chatmessages');

    const existingUsers = await usersCol.find({}).toArray();
    const userMap = {};

    for (const u of (db.users || [])) {
      const existing = existingUsers.find((eu) => eu.email && u.email && eu.email.toLowerCase() === u.email.toLowerCase());
      if (existing) {
        userMap[String(u._id)] = String(existing._id);
      } else {
        const uId = mongoose.Types.ObjectId.isValid(u._id) ? new mongoose.Types.ObjectId(u._id) : new mongoose.Types.ObjectId();
        const doc = { ...u, _id: uId };
        await usersCol.insertOne(doc);
        userMap[String(u._id)] = String(doc._id);

        const localProfile = (db.studentprofiles || []).find((sp) => String(sp.user) === String(u._id));
        if (localProfile) {
          const spId = mongoose.Types.ObjectId.isValid(localProfile._id) ? new mongoose.Types.ObjectId(localProfile._id) : new mongoose.Types.ObjectId();
          await profilesCol.insertOne({ ...localProfile, _id: spId, user: doc._id });
        }
      }
    }

    const existingProjects = await projectsCol.find({}).toArray();
    const projectMap = {};

    for (const p of (db.projects || [])) {
      const existing = existingProjects.find((ep) => (ep.title && p.title && ep.title.toLowerCase() === p.title.toLowerCase()) || String(ep._id) === String(p._id));
      if (existing) {
        projectMap[String(p._id)] = String(existing._id);
      } else {
        const pId = mongoose.Types.ObjectId.isValid(p._id) ? new mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId();
        const ownerId = userMap[String(p.owner)] || p.owner;
        const ownerObjId = mongoose.Types.ObjectId.isValid(ownerId) ? new mongoose.Types.ObjectId(ownerId) : ownerId;
        const doc = {
          ...p,
          _id: pId,
          owner: ownerObjId,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        };
        await projectsCol.insertOne(doc);
        projectMap[String(p._id)] = String(doc._id);
      }
    }

    // Members
    for (const m of (db.projectmembers || [])) {
      const pId = projectMap[String(m.project)] || String(m.project);
      const sId = userMap[String(m.student)] || String(m.student);
      const existing = await membersCol.findOne({ project: pId, student: sId });
      if (!existing) {
        await membersCol.insertOne({
          _id: m._id,
          project: pId,
          student: sId,
          role: m.role || 'Full Stack Developer',
          joinedAt: m.joinedAt || new Date().toISOString(),
        });
      }
    }

    // Tasks
    for (const t of (db.projecttasks || [])) {
      const pId = projectMap[String(t.project)] || String(t.project);
      const aId = userMap[String(t.assignee)] || String(t.assignee);
      const cId = userMap[String(t.createdBy)] || String(t.createdBy);
      const existing = await tasksCol.findOne({
        $or: [
          { _id: t._id },
          ...(mongoose.Types.ObjectId.isValid(t._id) ? [{ _id: new mongoose.Types.ObjectId(t._id) }] : [])
        ]
      });
      if (!existing) {
        await tasksCol.insertOne({
          ...t,
          project: pId,
          assignee: aId,
          createdBy: cId,
        });
      }
    }

    // Milestones
    for (const ms of (db.projectmilestones || [])) {
      const pId = projectMap[String(ms.project)] || String(ms.project);
      const existing = await milestonesCol.findOne({
        $or: [
          { _id: ms._id },
          ...(mongoose.Types.ObjectId.isValid(ms._id) ? [{ _id: new mongoose.Types.ObjectId(ms._id) }] : [])
        ]
      });
      if (!existing) {
        await milestonesCol.insertOne({ ...ms, project: pId });
      }
    }

    // Updates
    for (const pu of (db.progressupdates || [])) {
      const pId = projectMap[String(pu.project)] || String(pu.project);
      const authorId = userMap[String(pu.author)] || String(pu.author);
      const existing = await updatesCol.findOne({
        $or: [
          { _id: pu._id },
          ...(mongoose.Types.ObjectId.isValid(pu._id) ? [{ _id: new mongoose.Types.ObjectId(pu._id) }] : [])
        ]
      });
      if (!existing) {
        await updatesCol.insertOne({ ...pu, project: pId, author: authorId });
      }
    }

    // Chatrooms
    for (const r of (db.chatrooms || [])) {
      const pId = r.project ? (projectMap[String(r.project)] || String(r.project)) : null;
      const members = (r.members || []).map((m) => userMap[String(m)] || String(m));
      const existing = await roomsCol.findOne({
        $or: [
          { _id: r._id },
          ...(mongoose.Types.ObjectId.isValid(r._id) ? [{ _id: new mongoose.Types.ObjectId(r._id) }] : [])
        ]
      });
      if (!existing) {
        await roomsCol.insertOne({ ...r, project: pId, members });
      }
    }

    // Messages
    for (const msg of (db.chatmessages || [])) {
      const sender = userMap[String(msg.sender)] || String(msg.sender);
      const readBy = (msg.readBy || []).map((rb) => userMap[String(rb)] || String(rb));
      const existing = await messagesCol.findOne({
        $or: [
          { _id: msg._id },
          ...(mongoose.Types.ObjectId.isValid(msg._id) ? [{ _id: new mongoose.Types.ObjectId(msg._id) }] : [])
        ]
      });
      if (!existing) {
        await messagesCol.insertOne({ ...msg, sender, readBy });
      }
    }
  } catch (err) {
    console.warn('[SkillBridge] Data sync warning:', err.message);
  }
};

module.exports = syncDataToMongo;
