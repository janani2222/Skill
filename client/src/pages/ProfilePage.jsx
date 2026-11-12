import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/studentService';

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

const ProfilePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: 'Computer Science and Engineering',
    year: 'First Year',
    collegeName: '',
    degree: '',
    graduationYear: '',
    location: '',
    aboutMe: '',
    skills: [],
    interests: [],
    github: '',
    linkedin: '',
    portfolio: '',
  });

  // Local input states for adding tags inside the modal
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [modalSaving, setModalSaving] = useState(false);

  const { user, refreshUser, updateUserState, updateProfileState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Load student profile from backend
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
    // Extract skills as objects with names or strings
    const currentSkills = (profile?.skills || []).map((s) =>
      typeof s === 'string' ? { name: s, category: 'Technical' } : { name: s.name || '', category: s.category || 'Technical', _id: s._id }
    );

    setEditFormData({
      name: currentUser?.name || profile?.user?.name || '',
      department: currentUser?.department || profile?.user?.department || 'Computer Science and Engineering',
      year: currentUser?.year || profile?.user?.year || 'First Year',
      collegeName: profile?.collegeName || 'College Institute of Engineering & Technology',
      degree: profile?.degree || 'Bachelor of Technology (B.Tech)',
      graduationYear: profile?.graduationYear || '2027',
      location: profile?.location || 'Campus / Hostel',
      aboutMe: profile?.aboutMe || '',
      skills: currentSkills,
      interests: profile?.interests ? [...profile.interests] : [],
      github: profile?.socialLinks?.github || '',
      linkedin: profile?.socialLinks?.linkedin || '',
      portfolio: profile?.socialLinks?.portfolio || '',
    });
    setValidationErrors({});
    setSkillInput('');
    setInterestInput('');
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Open modal if navigated from Dashboard "Edit Profile"
  useEffect(() => {
    if (location.state?.openEdit && profileData) {
      initFormData(profileData, user);
      setIsEditModalOpen(true);
      // Clear state so modal doesn't reopen unexpectedly
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, profileData]);

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isEditModalOpen]);

  // Add a skill tag inside the modal
  const handleAddSkillTag = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;

    // Check duplicate
    const exists = editFormData.skills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setValidationErrors((prev) => ({
        ...prev,
        skillInput: `"${trimmed}" is already added.`,
      }));
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: trimmed, category: 'Technical' }],
    }));
    setSkillInput('');
    setValidationErrors((prev) => ({ ...prev, skillInput: '' }));
  };

  // Remove a skill tag inside the modal
  const handleRemoveSkillTag = (indexToRemove) => {
    setEditFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Add an academic interest tag inside the modal
  const handleAddInterestTag = (e) => {
    if (e) e.preventDefault();
    const trimmed = interestInput.trim();
    if (!trimmed) return;

    // Check duplicate
    const exists = editFormData.interests.some(
      (i) => i.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setValidationErrors((prev) => ({
        ...prev,
        interestInput: `"${trimmed}" is already added.`,
      }));
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, trimmed],
    }));
    setInterestInput('');
    setValidationErrors((prev) => ({ ...prev, interestInput: '' }));
  };

  // Remove an interest tag inside the modal
  const handleRemoveInterestTag = (indexToRemove) => {
    setEditFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    if (!editFormData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (editFormData.graduationYear) {
      const yearNum = parseInt(editFormData.graduationYear, 10);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2040) {
        errors.graduationYear = 'Please enter a valid 4-digit graduation year (e.g., 2027).';
      }
    }

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

    if (editFormData.github && !urlRegex.test(editFormData.github.trim())) {
      errors.github = 'Please enter a valid GitHub URL.';
    }

    if (editFormData.linkedin && !urlRegex.test(editFormData.linkedin.trim())) {
      errors.linkedin = 'Please enter a valid LinkedIn URL.';
    }

    if (editFormData.portfolio && !urlRegex.test(editFormData.portfolio.trim())) {
      errors.portfolio = 'Please enter a valid portfolio URL.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save changes handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setModalSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const payload = {
        name: editFormData.name.trim(),
        department: editFormData.department,
        year: editFormData.year,
        collegeName: editFormData.collegeName.trim(),
        degree: editFormData.degree.trim(),
        graduationYear: editFormData.graduationYear.trim(),
        location: editFormData.location.trim(),
        aboutMe: editFormData.aboutMe.trim(),
        skills: editFormData.skills.map((s) => s.name),
        interests: editFormData.interests,
        socialLinks: {
          github: editFormData.github.trim(),
          linkedin: editFormData.linkedin.trim(),
          portfolio: editFormData.portfolio.trim(),
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

  // Cancel handler: close and discard
  const handleCancelEdit = () => {
    initFormData(profileData, user);
    setIsEditModalOpen(false);
    setValidationErrors({});
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
              style={{ marginBottom: '22px' }}
            >
              {statusMsg.type === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>{statusMsg.text}</span>
              <button
                onClick={() => setStatusMsg({ text: '', type: '' })}
                style={{ marginLeft: 'auto', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 1. PROFILE HEADER CARD (CLEAN & READ-ONLY) */}
          <div className="profile-hero-card">
            <div className="profile-cover-gradient" />
            <div className="profile-header-body">
              <div className="profile-avatar-group">
                <div className="profile-avatar-wrapper">
                  {profileData?.avatar ? (
                    <img src={profileData.avatar} alt={user?.name || 'Student'} />
                  ) : (
                    <div className="profile-avatar-initials">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                </div>

                <div className="profile-meta-header">
                  <h1 className="profile-student-name">{user?.name}</h1>
                  <div className="profile-student-dept">
                    <span>{user?.department}</span>
                    <span>&bull;</span>
                    <span>{user?.year}</span>
                    <span>&bull;</span>
                    <span className="profile-institution-tag">
                      {profileData?.collegeName || 'College Institute of Engineering & Technology'}
                    </span>
                    {profileData?.location && (
                      <>
                        <span>&bull;</span>
                        <span>{profileData.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MAIN PROFILE TWO-COLUMN CONTENT */}
          <div className="profile-grid-layout">
            {/* Left Column: About Me, Education, Technical Skills */}
            <div className="profile-column-left">
              {/* A. ABOUT ME */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <User className="profile-section-icon" size={20} />
                    About Me
                  </h3>
                </div>
                {profileData?.aboutMe && profileData.aboutMe.trim() ? (
                  <p className="about-me-text">{profileData.aboutMe}</p>
                ) : (
                  <p className="profile-empty-state">No introduction added yet.</p>
                )}
              </div>

              {/* B. EDUCATION */}
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

              {/* C. TECHNICAL SKILLS (READ-ONLY, NO DEFAULTS) */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Code2 className="profile-section-icon" size={20} />
                    Technical Skills
                  </h3>
                  {currentSkills.length > 0 && (
                    <span className="badge badge-gold">
                      {currentSkills.length} {currentSkills.length === 1 ? 'Skill' : 'Skills'}
                    </span>
                  )}
                </div>

                {currentSkills && currentSkills.length > 0 ? (
                  <div className="skills-display-cluster">
                    {currentSkills.map((s, idx) => (
                      <span key={s._id || s.name || idx} className="skill-tag-read-only">
                        <Code2 size={13} color="#B99545" />
                        <span>{s.name || s}</span>
                        {s.category && s.category !== 'Technical' && (
                          <span className="skill-category-badge">{s.category}</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="profile-empty-state">No technical skills added yet.</p>
                )}
              </div>
            </div>

            {/* Right Column: Academic Interests, Social & Portfolio Links */}
            <div className="profile-column-right">
              {/* D. ACADEMIC INTERESTS */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Sparkles className="profile-section-icon" size={20} />
                    Academic Interests
                  </h3>
                </div>

                {currentInterests && currentInterests.length > 0 ? (
                  <div className="skills-display-cluster">
                    {currentInterests.map((interest, idx) => (
                      <span key={idx} className="interest-tag-read-only">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="profile-empty-state">No academic interests added yet.</p>
                )}
              </div>

              {/* E. SOCIAL & PORTFOLIO LINKS */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">
                    <Globe className="profile-section-icon" size={20} />
                    Social & Portfolios
                  </h3>
                </div>

                <div className="social-links-list">
                  {/* GitHub */}
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
                        <Github size={18} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.github}
                      </span>
                      <ExternalLink size={13} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item unlinked">
                      <div className="social-icon-wrapper">
                        <Github size={18} />
                      </div>
                      <span className="social-url-text">GitHub: Not linked</span>
                    </div>
                  )}

                  {/* LinkedIn */}
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
                        <Linkedin size={18} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.linkedin}
                      </span>
                      <ExternalLink size={13} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item unlinked">
                      <div className="social-icon-wrapper">
                        <Linkedin size={18} />
                      </div>
                      <span className="social-url-text">LinkedIn: Not linked</span>
                    </div>
                  )}

                  {/* Portfolio */}
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
                        <Globe size={18} />
                      </div>
                      <span className="social-url-text">
                        {profileData.socialLinks.portfolio}
                      </span>
                      <ExternalLink size={13} color="#9CA3AF" />
                    </a>
                  ) : (
                    <div className="social-link-item unlinked">
                      <div className="social-icon-wrapper">
                        <Globe size={18} />
                      </div>
                      <span className="social-url-text">Portfolio: Not linked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. EDIT PROFILE MODAL (FIXED SCROLLING & VISIBLE SAVE/CANCEL BUTTONS) */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={handleCancelEdit}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Edit Student Profile</h3>
                <p>Update your academic details, technical skills, and portfolio.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCancelEdit}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Form with Flex Scrolling Container */}
            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="modal-body">
                {/* Row 1: Full Name & Department */}
                <div className="form-grid-two">
                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">
                      Full Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className={`edit-input ${validationErrors.name ? 'input-error' : ''}`}
                      placeholder="e.g. Janani Raman"
                    />
                    {validationErrors.name && (
                      <span className="field-validation-error">{validationErrors.name}</span>
                    )}
                  </div>

                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">Department</label>
                    <select
                      value={editFormData.department}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, department: e.target.value })
                      }
                      className="edit-input"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Year of Study & Institution Name */}
                <div className="form-grid-two">
                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">Year of Study</label>
                    <select
                      value={editFormData.year}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, year: e.target.value })
                      }
                      className="edit-input"
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">Institution / College Name</label>
                    <input
                      type="text"
                      value={editFormData.collegeName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, collegeName: e.target.value })
                      }
                      className="edit-input"
                      placeholder="e.g. College of Technology"
                    />
                  </div>
                </div>

                {/* Row 3: Degree & Expected Graduation Year */}
                <div className="form-grid-two">
                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">Degree</label>
                    <input
                      type="text"
                      value={editFormData.degree}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, degree: e.target.value })
                      }
                      className="edit-input"
                      placeholder="e.g. Bachelor of Technology (B.Tech)"
                    />
                  </div>

                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">Expected Graduation Year</label>
                    <input
                      type="text"
                      value={editFormData.graduationYear}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, graduationYear: e.target.value })
                      }
                      className={`edit-input ${validationErrors.graduationYear ? 'input-error' : ''}`}
                      placeholder="e.g. 2027"
                    />
                    {validationErrors.graduationYear && (
                      <span className="field-validation-error">{validationErrors.graduationYear}</span>
                    )}
                  </div>
                </div>

                {/* Row 4: Location / City */}
                <div className="edit-field-group">
                  <label className="edit-field-label">Location / City</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, location: e.target.value })
                    }
                    className="edit-input"
                    placeholder="e.g. Coimbatore, Tamil Nadu"
                  />
                </div>

                {/* Row 5: Technical Skills (Interactive Tag Input) */}
                <div className="edit-field-group">
                  <label className="edit-field-label">Technical Skills</label>
                  <div className="tag-input-row">
                    <input
                      type="text"
                      placeholder="Add a technical skill (e.g. Java, React, Python)..."
                      value={skillInput}
                      onChange={(e) => {
                        setSkillInput(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, skillInput: '' }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillTag();
                        }
                      }}
                      className="edit-input"
                    />
                    <button
                      type="button"
                      className="tag-add-btn"
                      onClick={handleAddSkillTag}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {validationErrors.skillInput && (
                    <span className="field-validation-error" style={{ marginBottom: '6px' }}>
                      {validationErrors.skillInput}
                    </span>
                  )}
                  <div className="editable-tags-cluster">
                    {editFormData.skills && editFormData.skills.length > 0 ? (
                      editFormData.skills.map((s, idx) => (
                        <span key={idx} className="interactive-tag-badge">
                          <Code2 size={12} color="#B99545" />
                          <span>{s.name}</span>
                          <button
                            type="button"
                            className="tag-delete-btn"
                            onClick={() => handleRemoveSkillTag(idx)}
                            aria-label={`Remove skill ${s.name}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.84rem' }}>
                        No skills added yet. Type a skill above and press Enter or Add.
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 6: Academic Interests (Interactive Tag Input) */}
                <div className="edit-field-group">
                  <label className="edit-field-label">Academic Interests</label>
                  <div className="tag-input-row">
                    <input
                      type="text"
                      placeholder="Add an interest (e.g. Web Development, AI, Cloud)..."
                      value={interestInput}
                      onChange={(e) => {
                        setInterestInput(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, interestInput: '' }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterestTag();
                        }
                      }}
                      className="edit-input"
                    />
                    <button
                      type="button"
                      className="tag-add-btn"
                      onClick={handleAddInterestTag}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {validationErrors.interestInput && (
                    <span className="field-validation-error" style={{ marginBottom: '6px' }}>
                      {validationErrors.interestInput}
                    </span>
                  )}
                  <div className="editable-tags-cluster">
                    {editFormData.interests && editFormData.interests.length > 0 ? (
                      editFormData.interests.map((interest, idx) => (
                        <span key={idx} className="interactive-tag-badge interest-badge">
                          <span>{interest}</span>
                          <button
                            type="button"
                            className="tag-delete-btn"
                            onClick={() => handleRemoveInterestTag(idx)}
                            aria-label={`Remove interest ${interest}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.84rem' }}>
                        No interests added yet. Type an interest above and press Enter or Add.
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 7: About Me / Personal Bio */}
                <div className="edit-field-group">
                  <label className="edit-field-label">About Me / Personal Bio</label>
                  <textarea
                    rows={4}
                    value={editFormData.aboutMe}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, aboutMe: e.target.value })
                    }
                    className="edit-input"
                    style={{ resize: 'vertical' }}
                    placeholder="Write a brief introduction about your academic focus, projects, and career aspirations..."
                  />
                </div>

                {/* Row 8: GitHub & LinkedIn URLs */}
                <div className="form-grid-two">
                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">GitHub Profile URL</label>
                    <input
                      type="text"
                      value={editFormData.github}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, github: e.target.value })
                      }
                      className={`edit-input ${validationErrors.github ? 'input-error' : ''}`}
                      placeholder="https://github.com/username"
                    />
                    {validationErrors.github && (
                      <span className="field-validation-error">{validationErrors.github}</span>
                    )}
                  </div>

                  <div className="edit-field-group no-margin">
                    <label className="edit-field-label">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={editFormData.linkedin}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, linkedin: e.target.value })
                      }
                      className={`edit-input ${validationErrors.linkedin ? 'input-error' : ''}`}
                      placeholder="https://linkedin.com/in/username"
                    />
                    {validationErrors.linkedin && (
                      <span className="field-validation-error">{validationErrors.linkedin}</span>
                    )}
                  </div>
                </div>

                {/* Row 9: Personal Portfolio URL */}
                <div className="edit-field-group">
                  <label className="edit-field-label">Personal Portfolio URL</label>
                  <input
                    type="text"
                    value={editFormData.portfolio}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, portfolio: e.target.value })
                    }
                    className={`edit-input ${validationErrors.portfolio ? 'input-error' : ''}`}
                    placeholder="https://myportfolio.dev"
                  />
                  {validationErrors.portfolio && (
                    <span className="field-validation-error">{validationErrors.portfolio}</span>
                  )}
                </div>
              </div>

              {/* Fixed Footer with Visible Cancel and Save Changes Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={modalSaving}
                >
                  {modalSaving ? 'Saving Changes...' : 'Save Changes'}
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
