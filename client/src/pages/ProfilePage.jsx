import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import {
  User,
  GraduationCap,
  MapPin,
  Calendar,
  Code2,
  Sparkles,
  Github,
  Linkedin,
  Globe,
  Camera,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatarImage,
  addStudentSkill,
  removeStudentSkill,
  fetchAllSkills,
} from '../services/studentService';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Artificial Intelligence and Data Science',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const POPULAR_SKILL_SUGGESTIONS = [
  'React.js',
  'Node.js',
  'MongoDB',
  'Express.js',
  'Python',
  'Java',
  'C++',
  'Data Structures',
  'JavaScript',
  'Tailwind CSS',
  'Machine Learning',
  'Git & GitHub',
];

const POPULAR_INTEREST_SUGGESTIONS = [
  'Web Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Cloud Computing',
  'UI/UX Design',
  'App Development',
  'Cybersecurity',
  'Open Source',
];

const ProfilePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    year: '',
    collegeName: '',
    degree: '',
    graduationYear: '',
    location: '',
    aboutMe: '',
    github: '',
    linkedin: '',
    portfolio: '',
    interests: [],
  });

  // Skill Add State
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [modalSaving, setModalSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);
  const { user, refreshUser, updateUserState, updateProfileState } = useAuth();

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      if (res.success && res.profile) {
        setProfileData(res.profile);
        initFormData(res.profile, user);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const initFormData = (profile, currentUser) => {
    setEditFormData({
      name: currentUser?.name || '',
      department: currentUser?.department || 'Computer Science and Engineering',
      year: currentUser?.year || 'First Year',
      collegeName: profile?.collegeName || 'Engineering Campus',
      degree: profile?.degree || 'Bachelor of Technology (B.Tech)',
      graduationYear: profile?.graduationYear || '2027',
      location: profile?.location || 'Campus / Hostel',
      aboutMe: profile?.aboutMe || '',
      github: profile?.socialLinks?.github || '',
      linkedin: profile?.socialLinks?.linkedin || '',
      portfolio: profile?.socialLinks?.portfolio || '',
      interests: profile?.interests ? [...profile.interests] : [],
    });
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Handle Profile Update Submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const payload = {
        name: editFormData.name,
        department: editFormData.department,
        year: editFormData.year,
        collegeName: editFormData.collegeName,
        degree: editFormData.degree,
        graduationYear: editFormData.graduationYear,
        location: editFormData.location,
        aboutMe: editFormData.aboutMe,
        interests: editFormData.interests,
        socialLinks: {
          github: editFormData.github,
          linkedin: editFormData.linkedin,
          portfolio: editFormData.portfolio,
        },
      };

      const res = await updateMyProfile(payload);
      if (res.success) {
        setProfileData(res.profile);
        if (res.profile?.user) {
          updateUserState(res.profile.user);
        }
        updateProfileState(res.profile);
        setIsEditModalOpen(false);
        setStatusMsg({
          text: 'Profile updated successfully!',
          type: 'success',
        });
        await refreshUser();
      }
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setModalSaving(false);
    }
  };

  // Handle Avatar Image Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatarImage(formData);
      if (res.success) {
        setProfileData((prev) => ({
          ...prev,
          avatar: res.avatar,
          completionPercentage: res.completionPercentage,
        }));
        setStatusMsg({
          text: 'Profile photograph uploaded successfully!',
          type: 'success',
        });
        await refreshUser();
      }
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to upload photo.',
        type: 'error',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Add Skill
  const handleAddSkill = async (skillToAdd) => {
    const name = (skillToAdd || newSkillInput).trim();
    if (!name) return;

    try {
      const res = await addStudentSkill(name);
      if (res.success) {
        setProfileData((prev) => ({
          ...prev,
          skills: res.skills,
          completionPercentage: res.completionPercentage,
        }));
        setNewSkillInput('');
        setStatusMsg({
          text: `Skill "${name}" added!`,
          type: 'success',
        });
        await refreshUser();
      }
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to add skill',
        type: 'error',
      });
    }
  };

  // Remove Skill
  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await removeStudentSkill(skillId);
      if (res.success) {
        setProfileData((prev) => ({
          ...prev,
          skills: res.skills,
          completionPercentage: res.completionPercentage,
        }));
        setStatusMsg({
          text: 'Skill removed successfully.',
          type: 'success',
        });
        await refreshUser();
      }
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to remove skill',
        type: 'error',
      });
    }
  };

  // Modal Interests Management
  const handleAddModalInterest = (interestName) => {
    const val = (interestName || newInterestInput).trim();
    if (!val) return;
    if (!editFormData.interests.includes(val)) {
      setEditFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, val],
      }));
    }
    setNewInterestInput('');
  };

  const handleRemoveModalInterest = (itemToRemove) => {
    setEditFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== itemToRemove),
    }));
  };

  const currentSkills = profileData?.skills || [];
  const currentInterests = profileData?.interests || [];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        {/* Topnav */}
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="profile-page-content">
          {/* Status Alert Notification */}
          {statusMsg.text && (
            <div
              className={`auth-alert ${
                statusMsg.type === 'error' ? 'auth-alert-error' : 'auth-alert-success'
              }`}
              style={{ marginBottom: '20px' }}
            >
              {statusMsg.type === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>{statusMsg.text}</span>
              <button
                onClick={() => setStatusMsg({ text: '', type: '' })}
                style={{ marginLeft: 'auto', background: 'transparent' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* A. PROFILE HERO HEADER */}
          <div className="profile-hero-card">
            <div className="profile-cover-gradient" />
            <div className="profile-header-body">
              <div className="profile-avatar-group">
                {/* Avatar with Upload Capability */}
                <div
                  className="profile-avatar-wrapper"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload profile photo"
                >
                  {profileData?.avatar ? (
                    <img src={profileData.avatar} alt={user?.name} />
                  ) : (
                    <div className="profile-avatar-initials">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}

                  <div className="avatar-upload-overlay">
                    <Camera size={22} />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Change'}</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="profile-meta-header">
                  <h1 className="profile-student-name">{user?.name}</h1>
                  <div className="profile-student-dept">
                    <span>{user?.department}</span>
                    <span>&bull;</span>
                    <span>{user?.year}</span>
                    <span>&bull;</span>
                    <span style={{ color: '#B99545', fontWeight: 700 }}>
                      {profileData?.collegeName || 'Engineering Campus'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-header-actions">
                <button
                  onClick={() => {
                    initFormData(profileData, user);
                    setIsEditModalOpen(true);
                  }}
                  className="btn-gold"
                >
                  <FileEdit size={16} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* MAIN PROFILE TWO-COLUMN CONTENT */}
          <div className="profile-grid-layout">
            {/* Left Column: About Me, Skills, Education */}
            <div className="profile-column-left">
              {/* B. ABOUT ME */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <User className="profile-section-icon" size={20} />
                    About Me
                  </h3>
                  <button
                    onClick={() => {
                      initFormData(profileData, user);
                      setIsEditModalOpen(true);
                    }}
                    className="btn-outline-gold"
                    style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                  >
                    Edit Bio
                  </button>
                </div>
                <p className="about-me-text">
                  {profileData?.aboutMe ||
                    'Add an introduction to share your academic interests, coding aspirations, and the kinds of collegiate projects you want to build!'}
                </p>
              </div>

              {/* D. TECHNICAL SKILLS MANAGEMENT */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Code2 className="profile-section-icon" size={20} />
                    Technical Skills
                  </h3>
                  <span className="badge badge-gold">
                    {currentSkills.length} Verified Skills
                  </span>
                </div>

                <div className="skills-management-box">
                  {/* Skill Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddSkill();
                    }}
                    className="skill-input-row"
                  >
                    <input
                      type="text"
                      placeholder="Add a new skill (e.g., React.js, Python, MongoDB)..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                    />
                    <button type="submit" className="btn-gold" style={{ padding: '8px 18px' }}>
                      <Plus size={16} /> Add Skill
                    </button>
                  </form>

                  {/* Suggestion Chips */}
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 700 }}>
                      QUICK ADD SUGGESTIONS:
                    </span>
                    <div className="skill-suggestion-chips">
                      {POPULAR_SKILL_SUGGESTIONS.filter(
                        (s) => !currentSkills.some((cs) => cs.name?.toLowerCase() === s.toLowerCase())
                      )
                        .slice(0, 8)
                        .map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            className="suggestion-chip"
                            onClick={() => handleAddSkill(sug)}
                          >
                            + {sug}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Skills Tags List */}
                  <div className="skill-tags-wrapper">
                    {currentSkills && currentSkills.length > 0 ? (
                      currentSkills.map((s) => (
                        <div key={s._id} className="skill-tag-pill-interactive">
                          <Code2 size={14} color="#B99545" />
                          <span>{s.name}</span>
                          <span className="skill-tag-category">{s.category || 'Tech'}</span>
                          <button
                            onClick={() => handleRemoveSkill(s._id)}
                            className="skill-remove-btn"
                            title={`Remove ${s.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                        No technical skills added yet. Use the input above to list your skills!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* C. EDUCATION DETAILS */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <GraduationCap className="profile-section-icon" size={20} />
                    Education
                  </h3>
                </div>

                <div className="education-card-box">
                  <h4 className="edu-college-name">
                    {profileData?.collegeName || 'College Institute of Engineering & Technology'}
                  </h4>
                  <p className="edu-degree">
                    {profileData?.degree || 'Bachelor of Technology (B.Tech)'} &bull; {user?.department}
                  </p>
                  <div className="edu-meta-row">
                    <span>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Class of {profileData?.graduationYear || '2027'} ({user?.year})
                    </span>
                    <span>&bull;</span>
                    <span>
                      <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {profileData?.location || 'Campus / Hostel'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interests & Social Links */}
            <div className="profile-column-right">
              {/* E. INTERESTS */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Sparkles className="profile-section-icon" size={20} />
                    Academic Interests
                  </h3>
                </div>

                <div className="skills-tags-cluster">
                  {currentInterests && currentInterests.length > 0 ? (
                    currentInterests.map((interest, idx) => (
                      <span key={idx} className="interest-tag-pill">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#9CA3AF', fontSize: '0.88rem' }}>
                      No interests specified yet. Click "Edit Profile" to add fields of interest.
                    </p>
                  )}
                </div>
              </div>

              {/* F. SOCIAL & PORTFOLIO LINKS */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Globe className="profile-section-icon" size={20} />
                    Social & Portfolios
                  </h3>
                </div>

                <div className="social-links-list">
                  {profileData?.socialLinks?.github ? (
                    <a
                      href={
                        profileData.socialLinks.github.startsWith('http')
                          ? profileData.socialLinks.github
                          : `https://${profileData.socialLinks.github}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="social-link-item"
                    >
                      <div className="social-icon-wrapper">
                        <Github size={20} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.github}
                      </span>
                      <ExternalLink size={14} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item" style={{ opacity: 0.6 }}>
                      <div className="social-icon-wrapper">
                        <Github size={20} />
                      </div>
                      <span className="social-url-text">GitHub profile not linked</span>
                    </div>
                  )}

                  {profileData?.socialLinks?.linkedin ? (
                    <a
                      href={
                        profileData.socialLinks.linkedin.startsWith('http')
                          ? profileData.socialLinks.linkedin
                          : `https://${profileData.socialLinks.linkedin}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="social-link-item"
                    >
                      <div className="social-icon-wrapper">
                        <Linkedin size={20} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.linkedin}
                      </span>
                      <ExternalLink size={14} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item" style={{ opacity: 0.6 }}>
                      <div className="social-icon-wrapper">
                        <Linkedin size={20} />
                      </div>
                      <span className="social-url-text">LinkedIn profile not linked</span>
                    </div>
                  )}

                  {profileData?.socialLinks?.portfolio ? (
                    <a
                      href={
                        profileData.socialLinks.portfolio.startsWith('http')
                          ? profileData.socialLinks.portfolio
                          : `https://${profileData.socialLinks.portfolio}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="social-link-item"
                    >
                      <div className="social-icon-wrapper">
                        <Globe size={20} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.portfolio}
                      </span>
                      <ExternalLink size={14} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item" style={{ opacity: 0.6 }}>
                      <div className="social-icon-wrapper">
                        <Globe size={20} />
                      </div>
                      <span className="social-url-text">Personal portfolio not linked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* G. EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Edit Student Profile</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                    required
                  />
                </div>

                {/* Department & Year */}
                <div className="form-row-two" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      value={editFormData.department}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          department: e.target.value,
                        })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select
                      value={editFormData.year}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, year: e.target.value })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* College & Degree */}
                <div className="form-row-two" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Institution / College Name</label>
                    <input
                      type="text"
                      value={editFormData.collegeName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          collegeName: e.target.value,
                        })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Degree</label>
                    <input
                      type="text"
                      value={editFormData.degree}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, degree: e.target.value })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                {/* Graduation Year & Location */}
                <div className="form-row-two" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Expected Graduation Year</label>
                    <input
                      type="text"
                      value={editFormData.graduationYear}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          graduationYear: e.target.value,
                        })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location / City</label>
                    <input
                      type="text"
                      value={editFormData.location}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          location: e.target.value,
                        })
                      }
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                {/* About Me */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">About Me / Personal Bio</label>
                  <textarea
                    rows={4}
                    value={editFormData.aboutMe}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, aboutMe: e.target.value })
                    }
                    className="form-input"
                    style={{ paddingLeft: '14px', resize: 'vertical' }}
                    placeholder="Tell your peers about your interests, project ambitions, and coding background..."
                  />
                </div>

                {/* Interests Manager */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Academic Interests</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add an interest (e.g. Artificial Intelligence, Cloud)..."
                      value={newInterestInput}
                      onChange={(e) => setNewInterestInput(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                    />
                    <button
                      type="button"
                      className="btn-navy"
                      onClick={() => handleAddModalInterest()}
                    >
                      Add
                    </button>
                  </div>

                  {/* Suggestion Chips for Interests */}
                  <div className="skill-suggestion-chips" style={{ marginBottom: '10px' }}>
                    {POPULAR_INTEREST_SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => handleAddModalInterest(item)}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>

                  <div className="skills-tags-cluster">
                    {editFormData.interests.map((item) => (
                      <span key={item} className="interest-tag-pill">
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveModalInterest(item)}
                          className="skill-remove-btn"
                          style={{ marginLeft: '4px' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">GitHub Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={editFormData.github}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, github: e.target.value })
                    }
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={editFormData.linkedin}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        linkedin: e.target.value,
                      })
                    }
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Portfolio URL</label>
                  <input
                    type="text"
                    placeholder="https://myportfolio.dev"
                    value={editFormData.portfolio}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        portfolio: e.target.value,
                      })
                    }
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  disabled={modalSaving}
                >
                  {modalSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
