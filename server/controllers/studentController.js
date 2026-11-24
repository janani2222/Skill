const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Skill = require('../models/Skill');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const fs = require('fs');
const { isConnected } = require('../config/db');
const { readDb, writeDb, generateId } = require('../config/localDb');

const profileDepartments = ['Computer Science and Engineering', 'Artificial Intelligence and Data Science', 'Information Technology', 'Electronics and Communication Engineering', 'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Other'];
const profileYears = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const defaultAvatarPaths = new Set(['/avatars/professional-neutral.svg', '/avatars/professional-blue.svg', '/avatars/professional-gold.svg']);
const isValidProfileUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch { return false; }
};
const profileUpdateError = (body = {}) => {
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80)) return 'Name must be between 1 and 80 characters.';
  if (body.department !== undefined && !profileDepartments.includes(body.department)) return 'Choose a valid department.';
  if (body.year !== undefined && !profileYears.includes(body.year)) return 'Choose a valid academic year.';
  if (body.collegeName !== undefined && (typeof body.collegeName !== 'string' || body.collegeName.length > 140)) return 'College name must be 140 characters or fewer.';
  if (body.degree !== undefined && (typeof body.degree !== 'string' || body.degree.length > 100)) return 'Degree must be 100 characters or fewer.';
  if (body.location !== undefined && (typeof body.location !== 'string' || body.location.length > 120)) return 'Campus or hostel information must be 120 characters or fewer.';
  if (body.graduationYear !== undefined && body.graduationYear !== '' && (!/^\d{4}$/.test(String(body.graduationYear)) || Number(body.graduationYear) < 2000 || Number(body.graduationYear) > 2040)) return 'Enter a valid graduation year between 2000 and 2040.';
  if (body.aboutMe !== undefined && (typeof body.aboutMe !== 'string' || body.aboutMe.length > 1000)) return 'About Me must be 1,000 characters or fewer.';
  if (body.skills !== undefined && (!Array.isArray(body.skills) || body.skills.length > 50 || body.skills.some((item) => typeof item !== 'string' && (typeof item?.name !== 'string' || item.name.length > 60)))) return 'Skills must be a list of up to 50 names, each 60 characters or fewer.';
  if (body.interests !== undefined && (!Array.isArray(body.interests) || body.interests.length > 30 || body.interests.some((item) => typeof item !== 'string' || item.length > 60))) return 'Academic interests must be a list of up to 30 items, each 60 characters or fewer.';
  for (const [field, label, maxItems, maxLength] of [
    ['hobbies', 'Hobbies', 30, 60],
    ['languagesKnown', 'Languages', 30, 60],
    ['academicAchievements', 'Achievements', 30, 300],
  ]) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > maxItems || body[field].some((item) => typeof item !== 'string' || !item.trim() || item.length > maxLength))) {
      return `${label} must be a list of up to ${maxItems} non-empty items, each ${maxLength} characters or fewer.`;
    }
  }
  if (body.cgpa !== undefined && body.cgpa !== null && body.cgpa !== '' && (typeof body.cgpa !== 'number' && typeof body.cgpa !== 'string' || !Number.isFinite(Number(body.cgpa)) || Number(body.cgpa) < 0 || Number(body.cgpa) > 10)) return 'CGPA must be a number between 0 and 10.';
  if (body.projectsCompleted !== undefined && body.projectsCompleted !== null && body.projectsCompleted !== '' && (typeof body.projectsCompleted !== 'number' && typeof body.projectsCompleted !== 'string' || !Number.isInteger(Number(body.projectsCompleted)) || Number(body.projectsCompleted) < 0)) return 'Projects completed must be a non-negative whole number.';
  if (body.internships !== undefined && (!Array.isArray(body.internships) || body.internships.length > 20 || body.internships.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || typeof item.companyName !== 'string' || !item.companyName.trim() || item.companyName.length > 140 || typeof item.role !== 'string' || !item.role.trim() || item.role.length > 100 || typeof (item.duration || '') !== 'string' || item.duration.length > 80 || typeof (item.description || '') !== 'string' || item.description.length > 1000))) return 'Each internship needs a company and role; duration must be 80 characters or fewer and description 1,000 characters or fewer.';
  if (body.certifications !== undefined && (!Array.isArray(body.certifications) || body.certifications.length > 30 || body.certifications.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 140 || typeof item.issuingOrganization !== 'string' || !item.issuingOrganization.trim() || item.issuingOrganization.length > 140 || typeof (item.year || '') !== 'string' || (item.year && !/^\d{4}$/.test(item.year))))) return 'Each certification needs a name and issuing organisation; enter the year as four digits.';
  if (body.socialLinks !== undefined) {
    if (!body.socialLinks || typeof body.socialLinks !== 'object' || Array.isArray(body.socialLinks)) return 'Social links must be an object.';
    for (const key of ['github', 'linkedin', 'portfolio']) {
      const value = body.socialLinks[key];
      if (value !== undefined && (typeof value !== 'string' || value.length > 300 || !isValidProfileUrl(value.trim()))) return `Enter a valid ${key} URL.`;
    }
  }
  return '';
};

// Helper to calculate profile completion
const calculateProfilePercentage = (profile, user) => {
  let percentage = 25; // Base for user registration details (name, email, department, year)
  if (profile.aboutMe && profile.aboutMe.trim().length > 10) percentage += 20;
  if (profile.skills && profile.skills.length > 0) percentage += 20;
  if (profile.interests && profile.interests.length > 0) percentage += 15;
  if (
    profile.socialLinks &&
    (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.portfolio)
  ) {
    percentage += 10;
  }
  if (profile.avatar && profile.avatar.trim().length > 0) percentage += 10;
  return Math.min(percentage, 100);
};

const rankRecommendations = (students, currentProfile, currentProjects, currentUserId) => {
  const ownSkills = new Set((currentProfile?.skills || []).map((item) => String(item.name || item).toLowerCase()));
  const ownInterests = new Set((currentProfile?.interests || []).map((item) => String(item).toLowerCase()));
  const ownTechnologies = new Set((currentProjects || []).flatMap((item) => item.technologies || []).map((item) => String(item).toLowerCase()));
  return students.filter((student) => String(student.user._id) !== String(currentUserId)).map((student) => {
    const skills = (student.profile.skills || []).map((item) => String(item.name || item).toLowerCase());
    const interests = (student.profile.interests || []).map((item) => String(item).toLowerCase());
    const technologies = (student.projects || []).flatMap((item) => item.technologies || []).map((item) => String(item).toLowerCase());
    const matchingSkills = skills.filter((item) => ownSkills.has(item)).length;
    const matchingInterests = interests.filter((item) => ownInterests.has(item)).length;
    const matchingTechnologies = technologies.filter((item) => ownTechnologies.has(item)).length;
    const sameDepartment = student.user.department === currentProfile?.user?.department;
    const score = matchingSkills * 5 + matchingTechnologies * 3 + matchingInterests * 2 + (sameDepartment ? 2 : 0) + (student.user.year === currentProfile?.user?.year ? 1 : 0);
    const reason = matchingSkills ? `${matchingSkills} Matching Skills` : matchingTechnologies ? 'Similar Project Interests' : matchingInterests ? 'Similar Academic Interests' : sameDepartment ? 'Same Department' : 'Active SkillBridge Student';
    return { ...student, recommendationScore: score, recommendationReason: reason };
  }).sort((a, b) => b.recommendationScore - a.recommendationScore);
};

// @desc    Get current student's profile
// @route   GET /api/students/me
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      if (!profile) {
        profile = await StudentProfile.create({ user: userId, skills: [], interests: [] });
        profile = await profile.populate('user', 'name email department year role');
      }

      profile.calculateCompletion();
      await profile.save();

      return res.status(200).json({ success: true, profile });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      const user = db.users.find((u) => u._id === userId || u.id === userId);

      if (!profile) {
        profile = {
          _id: generateId(),
          user: userId,
          collegeName: 'College Institute of Engineering & Technology',
          degree: 'Bachelor of Technology (B.Tech)',
          graduationYear: '2027',
          location: 'Campus / Hostel',
          aboutMe: '',
          avatar: '',
          skills: [],
          interests: [],
          socialLinks: { github: '', linkedin: '', portfolio: '' },
          completionPercentage: 25,
          createdAt: new Date().toISOString(),
        };
        db.studentprofiles.push(profile);
        writeDb(db);
      }

      // Populate skills
      const populatedSkills = (profile.skills || []).map((skId) => {
        const found = db.skills.find((s) => s._id === skId || s.name?.toLowerCase() === skId?.toString().toLowerCase());
        return found || { _id: skId, name: skId };
      });

      const fullProfile = {
        ...profile,
        skills: populatedSkills,
        user: user ? { _id: user._id, name: user.name, email: user.email, department: user.department, year: user.year } : null,
      };

      return res.status(200).json({ success: true, profile: fullProfile });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update current student profile & user info
// @route   PUT /api/students/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const validationError = profileUpdateError(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const userId = req.user._id || req.user.id;
    const {
      name,
      department,
      year,
      collegeName,
      degree,
      graduationYear,
      location,
      hobbies,
      languagesKnown,
      cgpa,
      projectsCompleted,
      currentSemester,
      academicAchievements,
      internships,
      certifications,
      aboutMe,
      skills,
      interests,
      socialLinks,
    } = req.body;

    if (isConnected()) {
      // 1. Update User basic info
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (department) userUpdates.department = department;
      if (year) userUpdates.year = year;

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(userId, userUpdates, { new: true, runValidators: true });
      }

      // 2. Find or create profile
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      if (collegeName !== undefined) profile.collegeName = collegeName;
      if (degree !== undefined) profile.degree = degree;
      if (graduationYear !== undefined) profile.graduationYear = graduationYear;
      if (location !== undefined) profile.location = location;
      if (Array.isArray(hobbies)) profile.hobbies = hobbies;
      if (Array.isArray(languagesKnown)) profile.languagesKnown = languagesKnown;
      if (cgpa !== undefined) profile.cgpa = cgpa === '' || cgpa === null ? null : Number(cgpa);
      if (projectsCompleted !== undefined) profile.projectsCompleted = projectsCompleted === '' || projectsCompleted === null ? null : Number(projectsCompleted);
      if (currentSemester !== undefined) profile.currentSemester = currentSemester;
      if (Array.isArray(academicAchievements)) profile.academicAchievements = academicAchievements;
      if (Array.isArray(internships)) profile.internships = internships;
      if (Array.isArray(certifications)) profile.certifications = certifications;
      if (aboutMe !== undefined) profile.aboutMe = aboutMe;
      if (Array.isArray(interests)) profile.interests = interests;

      // Handle skills array update
      if (Array.isArray(skills)) {
        const skillIds = [];
        for (const item of skills) {
          const skillName = (typeof item === 'string' ? item : item.name || '').trim();
          if (skillName) {
            let skillDoc = await Skill.findOne({
              name: { $regex: new RegExp(`^${skillName}$`, 'i') },
            });
            if (!skillDoc) {
              skillDoc = await Skill.create({
                name: skillName,
                category: typeof item === 'object' && item.category ? item.category : 'Technical',
              });
            }
            if (!skillIds.some((id) => id.toString() === skillDoc._id.toString())) {
              skillIds.push(skillDoc._id);
            }
          }
        }
        profile.skills = skillIds;
      }

      if (socialLinks) {
        profile.socialLinks = {
          github: socialLinks.github !== undefined ? socialLinks.github : profile.socialLinks.github,
          linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : profile.socialLinks.linkedin,
          portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : profile.socialLinks.portfolio,
        };
      }

      profile.calculateCompletion();
      await profile.save();

      await Activity.create({
        user: userId,
        action: 'profile_updated',
        title: 'Profile Updated',
        description: 'Updated profile details, skills, and portfolio information',
      });

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        profile: updatedProfile,
      });
    } else {
      const db = readDb();
      // Update user
      const userIndex = db.users.findIndex((u) => u._id === userId || u.id === userId);
      if (userIndex !== -1) {
        if (name) db.users[userIndex].name = name.trim();
        if (department) db.users[userIndex].department = department;
        if (year) db.users[userIndex].year = year;
      }

      // Update profile
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = {
          _id: generateId(),
          user: userId,
          skills: [],
          interests: [],
          socialLinks: { github: '', linkedin: '', portfolio: '' },
          createdAt: new Date().toISOString(),
        };
        db.studentprofiles.push(profile);
      }

      if (collegeName !== undefined) profile.collegeName = collegeName;
      if (degree !== undefined) profile.degree = degree;
      if (graduationYear !== undefined) profile.graduationYear = graduationYear;
      if (location !== undefined) profile.location = location;
      if (Array.isArray(hobbies)) profile.hobbies = hobbies;
      if (Array.isArray(languagesKnown)) profile.languagesKnown = languagesKnown;
      if (cgpa !== undefined) profile.cgpa = cgpa === '' || cgpa === null ? null : Number(cgpa);
      if (projectsCompleted !== undefined) profile.projectsCompleted = projectsCompleted === '' || projectsCompleted === null ? null : Number(projectsCompleted);
      if (currentSemester !== undefined) profile.currentSemester = currentSemester;
      if (Array.isArray(academicAchievements)) profile.academicAchievements = academicAchievements;
      if (Array.isArray(internships)) profile.internships = internships;
      if (Array.isArray(certifications)) profile.certifications = certifications;
      if (aboutMe !== undefined) profile.aboutMe = aboutMe;
      if (Array.isArray(interests)) profile.interests = interests;

      // Handle skills array update in localDb
      if (Array.isArray(skills)) {
        const skillIds = [];
        for (const item of skills) {
          const skillName = (typeof item === 'string' ? item : item.name || '').trim();
          if (skillName) {
            let skillDoc = db.skills.find(
              (s) => s.name?.toLowerCase() === skillName.toLowerCase()
            );
            if (!skillDoc) {
              skillDoc = {
                _id: generateId(),
                name: skillName,
                category: typeof item === 'object' && item.category ? item.category : 'Technical',
              };
              db.skills.push(skillDoc);
            }
            if (!skillIds.includes(skillDoc._id)) {
              skillIds.push(skillDoc._id);
            }
          }
        }
        profile.skills = skillIds;
      }

      if (socialLinks) {
        profile.socialLinks = {
          github: socialLinks.github !== undefined ? socialLinks.github : profile.socialLinks.github,
          linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : profile.socialLinks.linkedin,
          portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : profile.socialLinks.portfolio,
        };
      }

      profile.completionPercentage = calculateProfilePercentage(profile, db.users[userIndex]);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'profile_updated',
        title: 'Profile Updated',
        description: 'Updated profile details, skills, and portfolio information',
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      const populatedSkills = (profile.skills || []).map((skId) =>
        db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      const fullProfile = {
        ...profile,
        skills: populatedSkills,
        user: db.users[userIndex] ? {
          _id: db.users[userIndex]._id,
          name: db.users[userIndex].name,
          email: db.users[userIndex].email,
          department: db.users[userIndex].department,
          year: db.users[userIndex].year,
        } : null,
      };

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        profile: fullProfile,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Save a selected default avatar or remove the current profile photo
// @route   PUT /api/students/me/avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    const avatar = req.body?.avatar;
    if (typeof avatar !== 'string' || (avatar !== '' && !defaultAvatarPaths.has(avatar))) {
      return res.status(400).json({ success: false, message: 'Choose a built-in avatar or remove the current photo.' });
    }
    const userId = req.user._id || req.user.id;
    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });
      profile.avatar = avatar;
      profile.calculateCompletion();
      await profile.save();
      await Activity.create({ user: userId, action: 'avatar_updated', title: 'Profile Picture Updated', description: avatar ? 'Changed the profile photo' : 'Removed the profile photo' });
      return res.json({ success: true, avatar: profile.avatar, completionPercentage: profile.completionPercentage });
    }
    const db = readDb();
    let profile = db.studentprofiles.find((item) => String(item.user) === String(userId));
    if (!profile) { profile = { _id: generateId(), user: userId, skills: [], interests: [], socialLinks: {} }; db.studentprofiles.push(profile); }
    profile.avatar = avatar;
    profile.completionPercentage = calculateProfilePercentage(profile);
    db.activities.push({ _id: generateId(), user: userId, action: 'avatar_updated', title: 'Profile Picture Updated', description: avatar ? 'Changed the profile photo' : 'Removed the profile photo', createdAt: new Date().toISOString() });
    writeDb(db);
    return res.json({ success: true, avatar: profile.avatar, completionPercentage: profile.completionPercentage });
  } catch (error) { next(error); }
};

// @desc    Upload profile picture
// @route   POST /api/students/me/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image file to upload.',
      });
    }

    const header = fs.readFileSync(req.file.path).subarray(0, 12);
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = header.subarray(0, 3).toString() === 'GIF';
    const isWebp = header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
    if (!isJpeg && !isPng && !isGif && !isWebp) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'The uploaded file is not a supported image.' });
    }

    const userId = req.user._id || req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      profile.avatar = avatarUrl;
      profile.calculateCompletion();
      await profile.save();

      await Activity.create({
        user: userId,
        action: 'avatar_updated',
        title: 'Profile Picture Updated',
        description: 'Uploaded a new university profile photo',
      });

      return res.status(200).json({
        success: true,
        message: 'Profile photograph uploaded successfully!',
        avatar: avatarUrl,
        completionPercentage: profile.completionPercentage,
      });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = { _id: generateId(), user: userId, skills: [], interests: [], socialLinks: {} };
        db.studentprofiles.push(profile);
      }

      profile.avatar = avatarUrl;
      profile.completionPercentage = calculateProfilePercentage(profile);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'avatar_updated',
        title: 'Profile Picture Updated',
        description: 'Uploaded a new university profile photo',
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      return res.status(200).json({
        success: true,
        message: 'Profile photograph uploaded successfully!',
        avatar: avatarUrl,
        completionPercentage: profile.completionPercentage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available skills
// @route   GET /api/skills
// @access  Public
exports.getAllSkills = async (req, res, next) => {
  try {
    if (isConnected()) {
      const skills = await Skill.find().sort({ name: 1 });
      return res.status(200).json({ success: true, count: skills.length, skills });
    } else {
      const db = readDb();
      return res.status(200).json({
        success: true,
        count: (db.skills || []).length,
        skills: db.skills || [],
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a skill to student's profile
// @route   POST /api/students/me/skills
// @access  Private
exports.addSkill = async (req, res, next) => {
  try {
    const { skillName, category } = req.body;
    if (!skillName || !skillName.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const trimmedName = skillName.trim();
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let skill = await Skill.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (!skill) {
        skill = await Skill.create({
          name: trimmedName,
          category: category || 'Technical',
        });
      }

      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) profile = new StudentProfile({ user: userId, skills: [], interests: [] });

      const alreadyExists = (profile.skills || []).some(
        (s) => s.toString() === skill._id.toString()
      );

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: `The skill "${skill.name}" is already in your profile`,
        });
      }

      profile.skills.push(skill._id);
      profile.calculateCompletion();
      await profile.save();

      await Activity.create({
        user: userId,
        action: 'skill_added',
        title: 'Added Technical Skill',
        description: `Added "${skill.name}" to technical skills list`,
      });

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: `Skill "${skill.name}" added successfully!`,
        skills: updatedProfile.skills,
        completionPercentage: updatedProfile.completionPercentage,
      });
    } else {
      const db = readDb();
      let skill = db.skills.find(
        (s) => s.name?.toLowerCase() === trimmedName.toLowerCase()
      );

      if (!skill) {
        skill = {
          _id: generateId(),
          name: trimmedName,
          category: category || 'Technical',
        };
        db.skills.push(skill);
      }

      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        profile = { _id: generateId(), user: userId, skills: [], interests: [], socialLinks: {} };
        db.studentprofiles.push(profile);
      }

      if (!profile.skills) profile.skills = [];

      const alreadyExists = profile.skills.some(
        (s) => s === skill._id || s._id === skill._id || s.toLowerCase?.() === skill.name.toLowerCase()
      );

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: `The skill "${skill.name}" is already in your profile`,
        });
      }

      profile.skills.push(skill._id);
      profile.completionPercentage = calculateProfilePercentage(profile);

      db.activities.push({
        _id: generateId(),
        user: userId,
        action: 'skill_added',
        title: 'Added Technical Skill',
        description: `Added "${skill.name}" to technical skills list`,
        createdAt: new Date().toISOString(),
      });

      writeDb(db);

      const populatedSkills = profile.skills.map(
        (skId) => db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      return res.status(200).json({
        success: true,
        message: `Skill "${skill.name}" added successfully!`,
        skills: populatedSkills,
        completionPercentage: profile.completionPercentage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a skill from student's profile
// @route   DELETE /api/students/me/skills/:skillId
// @access  Private
exports.removeSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let profile = await StudentProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const skillToRemove = await Skill.findById(skillId);
      profile.skills = (profile.skills || []).filter(
        (s) => s.toString() !== skillId.toString()
      );

      profile.calculateCompletion();
      await profile.save();

      if (skillToRemove) {
        await Activity.create({
          user: userId,
          action: 'skill_removed',
          title: 'Removed Skill',
          description: `Removed "${skillToRemove.name}" from skills profile`,
        });
      }

      const updatedProfile = await StudentProfile.findOne({ user: userId })
        .populate('user', 'name email department year role')
        .populate('skills');

      return res.status(200).json({
        success: true,
        message: 'Skill removed successfully',
        skills: updatedProfile.skills,
        completionPercentage: updatedProfile.completionPercentage,
      });
    } else {
      const db = readDb();
      let profile = db.studentprofiles.find((p) => p.user === userId);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const skillToRemove = db.skills.find((s) => s._id === skillId || s.name === skillId);
      profile.skills = (profile.skills || []).filter(
        (s) => s !== skillId && s._id !== skillId && s !== skillToRemove?.name
      );

      profile.completionPercentage = calculateProfilePercentage(profile);

      if (skillToRemove) {
        db.activities.push({
          _id: generateId(),
          user: userId,
          action: 'skill_removed',
          title: 'Removed Skill',
          description: `Removed "${skillToRemove.name}" from skills profile`,
          createdAt: new Date().toISOString(),
        });
      }

      writeDb(db);

      const populatedSkills = (profile.skills || []).map(
        (skId) => db.skills.find((s) => s._id === skId || s.name === skId) || { _id: skId, name: skId }
      );

      return res.status(200).json({
        success: true,
        message: 'Skill removed successfully',
        skills: populatedSkills,
        completionPercentage: profile.completionPercentage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's recent activities
// @route   GET /api/students/me/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const activities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10);
      return res.status(200).json({ success: true, count: activities.length, activities });
    } else {
      const db = readDb();
      const activities = (db.activities || [])
        .filter((a) => a.user === userId)
        .reverse()
        .slice(0, 10);
      return res.status(200).json({ success: true, count: activities.length, activities });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Discover students with optional search and filters
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').toLowerCase().trim();
    const department = String(req.query.department || '').toLowerCase();
    const year = String(req.query.year || '').toLowerCase();
    const skill = String(req.query.skill || '').toLowerCase();
    const interest = String(req.query.interest || '').toLowerCase();
    const currentUserId = String(req.user._id || req.user.id);
    if (isConnected()) {
      const users = await User.find({
        role: { $ne: 'admin' },
        ...(department ? { department: { $regex: department, $options: 'i' } } : {}),
        ...(year ? { year: { $regex: year, $options: 'i' } } : {}),
      }).select('-password').sort({ createdAt: -1 }).lean();
      const students = await Promise.all(users.map(async (user) => {
        const profile = await StudentProfile.findOne({ user: user._id }).populate('skills').lean() || { skills: [], interests: [], socialLinks: {} };
        const projects = await Project.find({ owner: user._id }).select('technologies title').lean();
        return { user, profile, projects, projectCount: projects.length };
      }));
      const filtered = students.filter((student) => {
        const values = [student.user.name, student.user.department, student.user.year, student.profile.collegeName, ...(student.profile.interests || []), ...(student.profile.skills || []).map((item) => item.name), ...(student.projects || []).flatMap((item) => item.technologies || [])].join(' ').toLowerCase();
        return (!search || values.includes(search)) && (!skill || (student.profile.skills || []).some((item) => item.name?.toLowerCase().includes(skill))) && (!interest || (student.profile.interests || []).some((item) => item.toLowerCase().includes(interest)));
      });
      const currentProfile = await StudentProfile.findOne({ user: currentUserId }).populate('skills').populate('user', 'department year').lean();
      const currentProjects = await Project.find({ owner: currentUserId }).select('technologies').lean();
      const recommendations = rankRecommendations(filtered, currentProfile, currentProjects, currentUserId);
      return res.json({ success: true, students: search || skill || interest || department || year ? filtered : recommendations, recommendations: recommendations.slice(0, 6) });
    }
    const db = readDb();
    const students = db.users.filter((user) => user.role !== 'admin').map((user) => {
      const profile = db.studentprofiles.find((item) => item.user === user._id) || { skills: [], interests: [], socialLinks: {} };
      const projects = (db.projects || []).filter((project) => String(project.owner) === String(user._id));
      return { user: { _id: user._id, name: user.name, email: user.email, department: user.department, year: user.year }, profile: { ...profile, skills: (profile.skills || []).map((id) => db.skills.find((item) => item._id === id) || { _id: id, name: id }) }, projects, projectCount: projects.length };
    }).filter((student) => {
      const values = [student.user.name, student.user.department, student.user.year, student.profile.collegeName, ...(student.profile.interests || []), ...(student.profile.skills || []).map((item) => item.name), ...(student.projects || []).flatMap((item) => item.technologies || [])].join(' ').toLowerCase();
      return (!search || values.includes(search)) && (!department || student.user.department.toLowerCase().includes(department)) && (!year || student.user.year.toLowerCase().includes(year)) && (!skill || (student.profile.skills || []).some((item) => item.name?.toLowerCase().includes(skill))) && (!interest || (student.profile.interests || []).some((item) => item.toLowerCase().includes(interest)));
    }).sort((a, b) => new Date(b.user.createdAt) - new Date(a.user.createdAt));
    const currentStudent = students.find((student) => String(student.user._id) === currentUserId);
    const recommendations = rankRecommendations(students, { ...(currentStudent?.profile || {}), user: currentStudent?.user }, currentStudent?.projects || [], currentUserId);
    return res.json({ success: true, students: search || skill || interest || department || year ? students : recommendations, recommendations: recommendations.slice(0, 6) });
  } catch (error) { next(error); }
};

exports.getPublicProfile = async (req, res, next) => {
  try {
    if (isConnected()) {
      const profile = await StudentProfile.findOne({ user: req.params.id }).populate('user', 'name email department year').populate('skills');
      if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found' });
      return res.json({ success: true, profile });
    }
    const db = readDb(); const user = db.users.find((item) => item._id === req.params.id); const profile = db.studentprofiles.find((item) => item.user === req.params.id);
    if (!user || !profile) return res.status(404).json({ success: false, message: 'Student profile not found' });
    return res.json({ success: true, profile: { ...profile, user: { _id: user._id, name: user.name, email: user.email, department: user.department, year: user.year }, skills: (profile.skills || []).map((id) => db.skills.find((skill) => skill._id === id) || { _id: id, name: id }) } });
  } catch (error) { next(error); }
};
