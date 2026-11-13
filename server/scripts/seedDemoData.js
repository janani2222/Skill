const bcrypt = require('bcryptjs');
const { readDb, writeDb, generateId } = require('../config/localDb');

const profiles = [
  ['Aarav Menon', 'Computer Science and Engineering', 'Second Year', ['React', 'Node.js', 'MongoDB'], ['Web Development', 'Open Source']],
  ['Meera Iyer', 'Information Technology', 'Third Year', ['Python', 'Django', 'PostgreSQL'], ['Data Science', 'Cloud Computing']],
  ['Rohan Das', 'Artificial Intelligence and Data Science', 'Third Year', ['Python', 'TensorFlow', 'OpenAI'], ['Artificial Intelligence', 'Research']],
  ['Ananya Rao', 'Electronics and Communication Engineering', 'Fourth Year', ['C++', 'Embedded Systems', 'IoT'], ['Robotics', 'Smart Hardware']],
  ['Vikram Shah', 'Mechanical Engineering', 'Second Year', ['Python', 'CAD', 'Arduino'], ['Automation', 'Product Design']],
  ['Diya Nair', 'Computer Science and Engineering', 'Fourth Year', ['Java', 'Spring Boot', 'MySQL'], ['Backend Development', 'Distributed Systems']],
  ['Kabir Singh', 'Information Technology', 'First Year', ['JavaScript', 'React', 'Firebase'], ['Mobile Development', 'UX Design']],
  ['Ishita Bose', 'Civil Engineering', 'Third Year', ['Python', 'GIS', 'Data Analysis'], ['Sustainable Cities', 'Climate Technology']],
  ['Aditya Kulkarni', 'Computer Science and Engineering', 'Third Year', ['Go', 'Docker', 'Kubernetes'], ['Cloud Computing', 'DevOps']],
  ['Sara Thomas', 'Artificial Intelligence and Data Science', 'Second Year', ['Python', 'Pandas', 'Machine Learning'], ['Machine Learning', 'Healthcare Technology']],
];

const seed = () => {
  const db = readDb(); db.users = db.users || []; db.studentprofiles = db.studentprofiles || []; db.skills = db.skills || []; db.projects = db.projects || [];
  if (db.users.some((user) => user.isDemo)) return console.log('Demo data already exists. Nothing added.');
  const password = bcrypt.hashSync('Demo@12345', 10);
  profiles.forEach(([name, department, year, skills, interests], index) => {
    const userId = generateId(); const now = new Date(Date.now() - index * 86400000).toISOString();
    db.users.push({ _id: userId, name, email: `demo${index + 1}@skillbridge.local`, password, department, year, role: 'student', isDemo: true, createdAt: now });
    const skillIds = skills.map((name) => { let skill = db.skills.find((item) => item.name.toLowerCase() === name.toLowerCase()); if (!skill) { skill = { _id: generateId(), name, category: 'Technical' }; db.skills.push(skill); } return skill._id; });
    db.studentprofiles.push({ _id: generateId(), user: userId, collegeName: 'SkillBridge University', degree: 'Bachelor of Technology', graduationYear: String(2027 + (index % 2)), location: 'Campus / Hostel', aboutMe: `A motivated student exploring ${interests[0].toLowerCase()} and collaborative project work.`, avatar: '', skills: skillIds, interests, socialLinks: { github: '', linkedin: '', portfolio: '' }, completionPercentage: 80, createdAt: now });
    db.projects.push({ _id: generateId(), owner: userId, title: `${skills[0]} ${interests[0]} Lab`, description: `A student project focused on ${interests[0].toLowerCase()} using practical engineering workflows.`, category: interests[0] === 'Artificial Intelligence' ? 'Artificial Intelligence' : 'Web Development', technologies: skills.slice(0, 3), role: 'Project Developer', teamMembers: [], startDate: '2026-06-01', completionDate: '', status: index % 2 ? 'In Progress' : 'Completed', thumbnail: '', githubUrl: '', liveDemoUrl: '', media: [], isDemo: true, createdAt: now, updatedAt: now });
  });
  writeDb(db); console.log('Added 10 demo students and projects. Demo login password: Demo@12345');
};

const clear = () => { const db = readDb(); const demoIds = new Set((db.users || []).filter((user) => user.isDemo).map((user) => user._id)); db.users = (db.users || []).filter((user) => !user.isDemo); db.studentprofiles = (db.studentprofiles || []).filter((profile) => !demoIds.has(profile.user)); db.projects = (db.projects || []).filter((project) => !project.isDemo && !demoIds.has(project.owner)); writeDb(db); console.log(`Removed ${demoIds.size} demo students.`); };

process.argv.includes('--clear') ? clear() : seed();
