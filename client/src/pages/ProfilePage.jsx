import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowUpRight, Award, BriefcaseBusiness, CalendarDays, Camera, Check, CheckCircle2,
  Code2, ExternalLink, Github, Globe, GraduationCap, MapPin, Pencil,
  Heart, Languages, Plus, Save, Sparkles, Trophy, UserRound, X, Building2, Linkedin,
} from 'lucide-react';
import {
  siAndroid, siAngular, siArduino, siApachekafka, siBootstrap, siC, siCplusplus,
  siCss, siD3, siDart, siDjango, siDocker, siElasticsearch, siExpress, siFastapi,
  siFigma, siFirebase, siFlask, siFlutter, siGit, siGithub, siGitlab, siGo,
  siGooglecloud, siGraphql, siHtml5, siJenkins, siJest, siJavascript, siJquery, siJupyter,
  siJulia, siKeras, siKotlin, siKubernetes, siLinux, siMongodb, siMysql, siNodedotjs,
  siNextdotjs, siNumpy, siOpencv, siOpenjdk, siPandas, siPhp, siPostgresql,
  siPostman, siPython, siPytorch, siR, siRabbitmq, siRaspberrypi, siReact,
  siRedis, siRuby, siRust, siScikitlearn, siSpringboot, siSqlite, siSvelte,
  siSupabase, siSwift, siTailwindcss, siTensorflow, siTerraform, siTypescript,
  siUnity, siUnrealengine, siVite, siVuedotjs, siWebpack,
} from 'simple-icons';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyAvatar, updateMyProfile, uploadAvatarImage, fetchAllSkills } from '../services/studentService';

const DEPARTMENTS = ['Computer Science and Engineering', 'Artificial Intelligence and Data Science', 'Information Technology', 'Electronics and Communication Engineering', 'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Other'];
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const DEFAULT_AVATAR = '/avatars/professional-neutral.svg';
const DEFAULT_AVATARS = [
  { src: '/avatars/professional-neutral.svg', label: 'Classic' },
  { src: '/avatars/professional-blue.svg', label: 'Blue' },
  { src: '/avatars/professional-gold.svg', label: 'Gold' },
];

const TECHNOLOGIES = [
  ['Java', 'java'], ['JavaScript', 'javascript'], ['jQuery', 'jquery'], ['Jenkins', 'jenkins'], ['Jest', 'jest'], ['Julia', 'julia'], ['C', 'c'], ['C++', 'cplusplus'], ['C#', 'csharp'], ['Python', 'python'], ['PHP', 'php'], ['PostgreSQL', 'postgresql'], ['PyTorch', 'pytorch'], ['Pandas', 'pandas'], ['NumPy', 'numpy'], ['React', 'react'], ['Angular', 'angular'], ['Vue.js', 'vuejs'], ['Svelte', 'svelte'], ['Next.js', 'nextjs'], ['Node.js', 'nodejs'], ['Express.js', 'express'], ['Spring Boot', 'spring'], ['Django', 'django'], ['Flask', 'flask'], ['FastAPI', 'fastapi'], ['HTML5', 'html5'], ['CSS3', 'css3'], ['Tailwind CSS', 'tailwindcss'], ['Bootstrap', 'bootstrap'], ['TypeScript', 'typescript'], ['Go', 'go'], ['Rust', 'rust'], ['Ruby', 'ruby'], ['Kotlin', 'kotlin'], ['Swift', 'swift'], ['Dart', 'dart'], ['Flutter', 'flutter'], ['Android', 'android'], ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['Redis', 'redis'], ['SQLite', 'sqlite'], ['Firebase', 'firebase'], ['Supabase', 'supabase'], ['Oracle', 'oracle'], ['Microsoft SQL Server', 'microsoftsqlserver'], ['TensorFlow', 'tensorflow'], ['Keras', 'keras'], ['scikit-learn', 'scikitlearn'], ['OpenCV', 'opencv'], ['Jupyter', 'jupyter'], ['AWS', 'amazonwebservices'], ['Azure', 'azure'], ['Google Cloud', 'googlecloud'], ['Docker', 'docker'], ['Kubernetes', 'kubernetes'], ['Terraform', 'terraform'], ['Git', 'git'], ['GitHub', 'github'], ['GitLab', 'gitlab'], ['Linux', 'linux'], ['Figma', 'figma'], ['Postman', 'postman'], ['Vite', 'vite'], ['Webpack', 'webpack'], ['GraphQL', 'graphql'], ['D3.js', 'd3js'], ['Unity', 'unity'], ['Unreal Engine', 'unrealengine'], ['Apache Kafka', 'apachekafka'], ['RabbitMQ', 'rabbitmq'], ['Elasticsearch', 'elasticsearch'], ['Power BI', 'powerbi'], ['Tableau', 'tableau'], ['R', 'r'], ['MATLAB', 'matlab'], ['Arduino', 'arduino'], ['Raspberry Pi', 'raspberrypi'],
].map(([name, slug]) => ({ name, slug, category: 'Technology' }));

const BRAND_ICONS = {
  java: siOpenjdk, javascript: siJavascript, jquery: siJquery, jenkins: siJenkins, jest: siJest, julia: siJulia,
  c: siC, cplusplus: siCplusplus, python: siPython, php: siPhp, postgresql: siPostgresql, pytorch: siPytorch,
  pandas: siPandas, numpy: siNumpy, react: siReact, angular: siAngular, vuejs: siVuedotjs, svelte: siSvelte,
  nextjs: siNextdotjs, nodejs: siNodedotjs, express: siExpress, spring: siSpringboot, django: siDjango,
  flask: siFlask, fastapi: siFastapi, html5: siHtml5, css3: siCss, tailwindcss: siTailwindcss,
  bootstrap: siBootstrap, typescript: siTypescript, go: siGo, rust: siRust, ruby: siRuby, kotlin: siKotlin,
  swift: siSwift, dart: siDart, flutter: siFlutter, android: siAndroid, mysql: siMysql, mongodb: siMongodb,
  redis: siRedis, sqlite: siSqlite, firebase: siFirebase, supabase: siSupabase, tensorflow: siTensorflow,
  keras: siKeras, scikitlearn: siScikitlearn, opencv: siOpencv, jupyter: siJupyter, googlecloud: siGooglecloud,
  docker: siDocker, kubernetes: siKubernetes, git: siGit, github: siGithub, gitlab: siGitlab, linux: siLinux,
  figma: siFigma, postman: siPostman, vite: siVite, webpack: siWebpack, graphql: siGraphql, d3js: siD3,
  unity: siUnity, unrealengine: siUnrealengine, apachekafka: siApachekafka, rabbitmq: siRabbitmq,
  elasticsearch: siElasticsearch, r: siR, arduino: siArduino, raspberrypi: siRaspberrypi,
};

const cleanSkills = (skills = []) => skills.map((item) => typeof item === 'string' ? { name: item, category: 'Technology' } : { ...item, name: item.name || '' }).filter((item) => item.name);
const profileUrl = (value = '') => value ? (value.startsWith('http') ? value : `https://${value}`) : '';

function TechnologyLogo({ name, size = 23 }) {
  const skill = TECHNOLOGIES.find((item) => item.name.toLowerCase() === String(name).toLowerCase());
  const icon = skill ? BRAND_ICONS[skill.slug] : null;
  if (!icon) return <Code2 size={size} aria-hidden="true"/>;
  return <svg className="profile-tech-logo" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={`#${icon.hex}`}><path d={icon.path}/></svg>;
}

function PencilButton({ label, onClick }) {
  return <button type="button" className="profile-edit-icon" aria-label={`Edit ${label}`} title={`Edit ${label}`} onClick={onClick}><Pencil size={17}/></button>;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editorSection, setEditorSection] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50 });
  const [selectedDefault, setSelectedDefault] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [editData, setEditData] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [hobbyInput, setHobbyInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');
  const [knownSkills, setKnownSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [cropImageUrl, setCropImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const { user, refreshUser, updateUserState, updateProfileState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const loadProfile = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getMyProfile();
      if (!response.success || !response.profile) throw new Error(response.message || 'Profile could not be loaded.');
      setProfileData(response.profile);
      updateProfileState(response.profile);
      setEditData(buildForm(response.profile, user));
    } catch (error) {
      setLoadError(error.message || 'Profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const buildForm = (profile, currentUser) => ({
    name: currentUser?.name || profile?.user?.name || '',
    department: currentUser?.department || profile?.user?.department || '',
    year: currentUser?.year || profile?.user?.year || '',
    collegeName: profile?.collegeName || '',
    degree: profile?.degree || '',
    graduationYear: profile?.graduationYear || '',
    location: profile?.location || '',
    aboutMe: profile?.aboutMe || '',
    skills: cleanSkills(profile?.skills),
    interests: [...(profile?.interests || [])],
    cgpa: profile?.cgpa === null || profile?.cgpa === undefined ? '' : String(profile.cgpa),
    projectsCompleted: profile?.projectsCompleted === null || profile?.projectsCompleted === undefined ? '' : String(profile.projectsCompleted),
    hobbies: [...(profile?.hobbies || [])],
    languagesKnown: [...(profile?.languagesKnown || [])],
    internships: (profile?.internships || []).map((item) => ({
      ...item,
      companyName: item.companyName || '',
      role: item.role || '',
      duration: item.duration || '',
      description: item.description || '',
    })),
    academicAchievements: [...(profile?.academicAchievements || [])],
    certifications: (profile?.certifications || []).map((item) => ({
      name: item.name || '',
      issuingOrganization: item.issuingOrganization || '',
      year: item.year || '',
    })),
    github: profile?.socialLinks?.github || '',
    linkedin: profile?.socialLinks?.linkedin || '',
    portfolio: profile?.socialLinks?.portfolio || '',
  });

  useEffect(() => { loadProfile(); }, [user?._id || user?.id]);
  useEffect(() => {
    fetchAllSkills().then((response) => setKnownSkills(response.skills || [])).catch(() => setKnownSkills([]));
  }, []);
  useEffect(() => {
    if (location.state?.openEdit && profileData) {
      openEditor('all');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, profileData]);
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setCropImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCropImageUrl('');
    return undefined;
  }, [avatarFile]);
  useEffect(() => {
    const isModalOpen = !!editorSection || avatarOpen;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    const onKeyDown = (event) => { if (event.key === 'Escape') { setEditorSection(''); closeAvatarEditor(); } };
    if (isModalOpen) window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); };
  }, [editorSection, avatarOpen]);

  const openEditor = (section = 'all') => {
    setEditData(buildForm(profileData, user));
    setSkillInput(''); setInterestInput(''); setHobbyInput(''); setLanguageInput(''); setAchievementInput(''); setFormError(''); setEditorSection(section);
  };
  const closeEditor = () => { setEditorSection(''); setFormError(''); };
  const changeField = (key, value) => setEditData((current) => ({ ...current, [key]: value }));
  const visibleSections = (section) => editorSection === 'all' || editorSection === section;

  const suggestions = useMemo(() => {
    const combined = [...TECHNOLOGIES, ...knownSkills.map((skill) => ({ name: skill.name, category: skill.category || 'Technology' }))];
    const unique = [...new Map(combined.map((item) => [item.name.toLowerCase(), item])).values()];
    const query = skillInput.trim().toLowerCase();
    if (!query) return [];
    const existing = new Set((editData?.skills || []).map((item) => item.name.toLowerCase()));
    return unique.filter((item) => item.name.toLowerCase().startsWith(query) && !existing.has(item.name.toLowerCase())).slice(0, 8);
  }, [skillInput, knownSkills, editData?.skills]);

  const addSkill = (candidate) => {
    const name = (candidate?.name || skillInput).trim();
    if (!name || editData.skills.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    const known = [...TECHNOLOGIES, ...knownSkills].find((item) => item.name.toLowerCase() === name.toLowerCase());
    setEditData((current) => ({ ...current, skills: [...current.skills, { name: known?.name || name, category: known?.category || 'Technology' }] }));
    setSkillInput('');
  };
  const removeSkill = (name) => setEditData((current) => ({ ...current, skills: current.skills.filter((item) => item.name !== name) }));
  const addInterest = () => {
    const value = interestInput.trim();
    if (!value || editData.interests.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setEditData((current) => ({ ...current, interests: [...current.interests, value] })); setInterestInput('');
  };
  const addListItem = (field, value) => {
    const item = value.trim();
    if (!item) return;
    setEditData((current) => current[field].some((existing) => existing.toLowerCase() === item.toLowerCase())
      ? current
      : { ...current, [field]: [...current[field], item] });
  };
  const changeEntry = (field, index, key, value) => setEditData((current) => ({
    ...current,
    [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
  }));
  const removeEntry = (field, index) => setEditData((current) => ({
    ...current,
    [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
  }));

  const validateEdit = () => {
    const errors = [];
    if (visibleSections('basic')) {
      if (!editData.name.trim() || editData.name.trim().length > 80) errors.push('Enter a name between 1 and 80 characters.');
      if (!DEPARTMENTS.includes(editData.department)) errors.push('Choose a valid department.');
      if (!YEARS.includes(editData.year)) errors.push('Choose a valid academic year.');
    }
    if (visibleSections('education')) {
      if (editData.collegeName.length > 140 || editData.degree.length > 100 || editData.location.length > 120) errors.push('College, degree, or campus information is too long.');
      if (editData.graduationYear && (!/^\d{4}$/.test(editData.graduationYear) || Number(editData.graduationYear) < 2000 || Number(editData.graduationYear) > 2040)) errors.push('Enter a graduation year between 2000 and 2040.');
    }
    if (visibleSections('about') && editData.aboutMe.length > 1000) errors.push('About Me must be 1,000 characters or fewer.');
    if (visibleSections('additional')) {
      if (editData.cgpa !== '' && (!Number.isFinite(Number(editData.cgpa)) || Number(editData.cgpa) < 0 || Number(editData.cgpa) > 10)) errors.push('CGPA must be between 0 and 10.');
      if (editData.projectsCompleted !== '' && (!Number.isInteger(Number(editData.projectsCompleted)) || Number(editData.projectsCompleted) < 0)) errors.push('Projects completed must be a non-negative whole number.');
      if (editData.hobbies.length > 30 || editData.hobbies.some((item) => item.length > 60)) errors.push('Add up to 30 hobbies, each 60 characters or fewer.');
      if (editData.languagesKnown.length > 30 || editData.languagesKnown.some((item) => item.length > 60)) errors.push('Add up to 30 languages, each 60 characters or fewer.');
    }
    if (visibleSections('experience')) {
      if (editData.academicAchievements.length > 30 || editData.academicAchievements.some((item) => item.length > 300)) errors.push('Add up to 30 achievements, each 300 characters or fewer.');
      if (editData.internships.some((item) => !item.companyName.trim() || !item.role.trim() || item.companyName.length > 140 || item.role.length > 100 || item.duration.length > 80 || item.description.length > 1000)) errors.push('Each internship needs a company and role; duration must be 80 characters or fewer and description 1,000 characters or fewer.');
      if (editData.certifications.some((item) => !item.name.trim() || !item.issuingOrganization.trim() || item.name.length > 140 || item.issuingOrganization.length > 140 || (item.year && !/^\d{4}$/.test(item.year)))) errors.push('Each certification needs a name and issuing organisation; enter the year as four digits.');
    }
    if (visibleSections('social')) {
      for (const [label, raw] of [['GitHub', editData.github], ['LinkedIn', editData.linkedin], ['Portfolio', editData.portfolio]]) {
        if (raw && !isValidWebUrl(raw)) errors.push(`${label} must be a valid http or https URL.`);
      }
    }
    setFormError(errors[0] || '');
    return errors.length === 0;
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    if (!validateEdit()) return;
    const payload = {};
    if (visibleSections('basic')) Object.assign(payload, { name: editData.name.trim(), department: editData.department, year: editData.year });
    if (visibleSections('education')) Object.assign(payload, { collegeName: editData.collegeName.trim(), degree: editData.degree.trim(), graduationYear: editData.graduationYear.trim(), location: editData.location.trim() });
    if (visibleSections('about')) payload.aboutMe = editData.aboutMe.trim();
    if (visibleSections('skills')) payload.skills = editData.skills.map(({ name, category }) => ({ name, category }));
    if (visibleSections('interests')) payload.interests = editData.interests;
    if (visibleSections('additional')) Object.assign(payload, {
      cgpa: editData.cgpa === '' ? null : Number(editData.cgpa),
      projectsCompleted: editData.projectsCompleted === '' ? null : Number(editData.projectsCompleted),
      hobbies: editData.hobbies,
      languagesKnown: editData.languagesKnown,
    });
    if (visibleSections('experience')) Object.assign(payload, {
      internships: editData.internships,
      academicAchievements: editData.academicAchievements,
      certifications: editData.certifications,
    });
    if (visibleSections('social')) payload.socialLinks = { github: editData.github.trim(), linkedin: editData.linkedin.trim(), portfolio: editData.portfolio.trim() };
    setSaving(true); setFormError('');
    try {
      const response = await updateMyProfile(payload);
      if (!response.success) throw new Error(response.message || 'Your changes could not be saved.');
      setProfileData(response.profile);
      updateProfileState(response.profile);
      if (response.profile?.user) updateUserState(response.profile.user);
      setEditorSection('');
      setNotice({ text: 'Your profile changes have been saved.', type: 'success' });
      await refreshUser();
    } catch (error) {
      setFormError(error.message || 'Your changes could not be saved.');
    } finally { setSaving(false); }
  };

  const openAvatarEditor = () => {
    setAvatarFile(null); setAvatarPreview(''); setAvatarPosition({ x: 50, y: 50 });
    setSelectedDefault(DEFAULT_AVATARS.some((item) => item.src === profileData?.avatar) ? profileData.avatar : '');
    setAvatarError(''); setAvatarOpen(true);
  };
  const closeAvatarEditor = () => { setAvatarOpen(false); setAvatarFile(null); setAvatarError(''); };
  const selectAvatarFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setAvatarError('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('The image must be 5 MB or smaller.'); return; }
    setAvatarError(''); setSelectedDefault(''); setAvatarFile(file); setAvatarPosition({ x: 50, y: 50 });
  };
  const persistAvatar = async (avatar) => {
    const response = await updateMyAvatar(avatar);
    if (!response.success) throw new Error(response.message || 'Profile photo could not be saved.');
    setProfileData((current) => ({ ...current, avatar: response.avatar || '' }));
    updateProfileState({ ...profileData, avatar: response.avatar || '' });
    await refreshUser();
  };
  const cropAndUpload = async () => {
    if (!avatarFile || !cropImageUrl) return;
    const image = new Image(); image.src = cropImageUrl;
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - side) * avatarPosition.x / 100;
    const sourceY = (image.naturalHeight - side) * avatarPosition.y / 100;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the cropped photo.');
    context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 512, 512);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('The selected photo could not be processed.');
    const formData = new FormData(); formData.append('avatar', blob, 'profile-photo.jpg');
    const response = await uploadAvatarImage(formData);
    if (!response.success) throw new Error(response.message || 'Profile photo could not be saved.');
    setProfileData((current) => ({ ...current, avatar: response.avatar }));
    updateProfileState({ ...profileData, avatar: response.avatar });
    await refreshUser();
  };
  const saveAvatar = async () => {
    setAvatarSaving(true); setAvatarError('');
    try {
      if (avatarFile) await cropAndUpload();
      else await persistAvatar(selectedDefault || '');
      setAvatarOpen(false); setAvatarFile(null);
      setNotice({ text: 'Profile photo updated.', type: 'success' });
    } catch (error) { setAvatarError(error.message || 'Profile photo could not be saved.'); }
    finally { setAvatarSaving(false); }
  };
  const removeAvatar = async () => {
    setAvatarSaving(true); setAvatarError('');
    try { await persistAvatar(''); setAvatarOpen(false); setNotice({ text: 'Profile photo removed.', type: 'success' }); }
    catch (error) { setAvatarError(error.message || 'Profile photo could not be removed.'); }
    finally { setAvatarSaving(false); }
  };

  const currentUser = profileData?.user || user || {};
  const currentSkills = cleanSkills(profileData?.skills);
  const currentInterests = profileData?.interests || [];
  const currentHobbies = profileData?.hobbies || [];
  const currentLanguages = profileData?.languagesKnown || [];
  const currentInternships = profileData?.internships || [];
  const currentAchievements = profileData?.academicAchievements || [];
  const currentCertifications = profileData?.certifications || [];
  const avatar = profileData?.avatar || DEFAULT_AVATAR;

  return <div className="dashboard-layout">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
    <div className="dashboard-main">
      <TopNav onToggleSidebar={() => setSidebarOpen((open) => !open)}/>
      <main className="profile-page-content">
        {notice.text && <div className={`profile-notice ${notice.type}`} role="status">{notice.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}<span>{notice.text}</span><button onClick={() => setNotice({ text: '', type: '' })} aria-label="Dismiss"><X size={16}/></button></div>}
        {loading ? <div className="profile-loading" role="status">Loading your profile…</div> : loadError ? <div className="profile-load-error" role="alert"><AlertCircle/><p>{loadError}</p><button className="btn-gold" onClick={loadProfile}>Try again</button></div> : <>
          <section className="profile-hero-card" aria-label="Student profile">
            <div className="profile-hero-photo"/>
            <div className="profile-hero-inner">
              <div className="profile-avatar-wrapper">
                <img src={avatar} alt={`${currentUser.name || 'Student'} profile`} onError={(event) => { event.currentTarget.src = DEFAULT_AVATAR; }}/>
                <button type="button" className="profile-camera-button" onClick={openAvatarEditor} aria-label="Change profile photo"><Camera size={18}/></button>
              </div>
              <div className="profile-meta-header">
                <h1 className="profile-student-name">{currentUser.name || 'Student'}</h1>
                <p className="profile-student-dept"><span>{currentUser.department}</span>{currentUser.department && currentUser.year && <i/>}<span>{currentUser.year}</span></p>
                <p className="profile-hero-detail"><Building2 size={16}/><span>{profileData.collegeName || 'College not added yet'}</span></p>
                <p className="profile-hero-detail"><MapPin size={16}/><span>{profileData.location || 'Campus / Hostel not added yet'}</span></p>
              </div>
              <div className="profile-hero-actions">
                <button type="button" className="profile-button profile-button-outline" onClick={openAvatarEditor}><Camera size={17}/>Change Profile</button>
                <button type="button" className="profile-button profile-button-gold" onClick={() => openEditor('all')}><Pencil size={16}/>Edit Profile</button>
              </div>
            </div>
          </section>

          <div className="profile-grid-layout">
            <div className="profile-column-left">
              <section className="profile-section-card">
                <SectionHeading icon={<UserRound size={21}/>} title="About Me" onEdit={() => openEditor('about')}/>
                <p className={profileData.aboutMe ? 'about-me-text' : 'profile-empty-state'}>{profileData.aboutMe || 'Add a short introduction about your interests and goals.'}</p>
              </section>
              <section className="profile-section-card">
                <SectionHeading icon={<GraduationCap size={22}/>} title="Education" onEdit={() => openEditor('education')}/>
                <div className="education-card-box">
                  <h3 className="edu-college-name">{profileData.collegeName || 'College not added yet'}</h3>
                  <p className="edu-degree">{profileData.degree || 'Degree not added yet'}{currentUser.department ? ` · ${currentUser.department}` : ''}</p>
                  <div className="edu-meta-row"><span><CalendarDays size={15}/>{profileData.graduationYear ? `Class of ${profileData.graduationYear}` : 'Graduation year not added'}</span><span><MapPin size={15}/>{profileData.location || 'Campus / Hostel'}</span></div>
                </div>
              </section>
              <section className="profile-section-card">
                <SectionHeading icon={<Code2 size={21}/>} title="Technical Skills" onEdit={() => openEditor('skills')} extra={currentSkills.length ? `${currentSkills.length} ${currentSkills.length === 1 ? 'skill' : 'skills'}` : ''}/>
                {currentSkills.length ? <div className="profile-tech-grid">{currentSkills.map((skill, index) => <div className="profile-tech-card" key={skill._id || skill.name || index}><TechnologyLogo name={skill.name} size={24}/><span>{skill.name}</span></div>)}</div> : <p className="profile-empty-state">Add technologies you work with to help classmates find you.</p>}
              </section>
              <section className="profile-section-card">
                <SectionHeading icon={<Award size={21}/>} title="Additional Information" onEdit={() => openEditor('additional')}/>
                <div className="profile-info-grid">
                  <ProfileInfoItem icon={<GraduationCap size={19}/>} label="CGPA" value={profileData.cgpa !== null && profileData.cgpa !== undefined && profileData.cgpa !== '' ? `${profileData.cgpa} / 10` : ''}/>
                  <ProfileInfoItem icon={<Heart size={19}/>} label="Hobbies" value={currentHobbies.filter(Boolean).join(', ')}/>
                  <ProfileInfoItem icon={<Languages size={19}/>} label="Languages Known" value={currentLanguages.filter(Boolean).join(', ')}/>
                  <ProfileInfoItem icon={<Trophy size={19}/>} label="Projects Completed" value={profileData.projectsCompleted !== null && profileData.projectsCompleted !== undefined && profileData.projectsCompleted !== '' ? `${profileData.projectsCompleted} ${Number(profileData.projectsCompleted) === 1 ? 'project' : 'projects'}` : ''}/>
                </div>
              </section>
            </div>
            <div className="profile-column-right">
              <section className="profile-section-card">
                <SectionHeading icon={<Sparkles size={21}/>} title="Academic Interests" onEdit={() => openEditor('interests')}/>
                {currentInterests.length ? <div className="profile-interests">{currentInterests.map((interest, index) => <span className="interest-tag-read-only" key={`${interest}-${index}`}>{interest}</span>)}</div> : <p className="profile-empty-state">Add academic topics you are interested in.</p>}
              </section>
              <section className="profile-section-card">
                <SectionHeading icon={<Globe size={21}/>} title="Social & Portfolios" onEdit={() => openEditor('social')}/>
                <div className="social-links-list">
                  <SocialLink icon={<Github size={19}/>} label="GitHub" value={profileData.socialLinks?.github}/>
                  <SocialLink icon={<Linkedin size={19}/>} label="LinkedIn" value={profileData.socialLinks?.linkedin}/>
                  <SocialLink icon={<Globe size={19}/>} label="Portfolio" value={profileData.socialLinks?.portfolio}/>
                </div>
              </section>
              <section className="profile-section-card">
                <SectionHeading icon={<BriefcaseBusiness size={21}/>} title="Experience & Achievements" onEdit={() => openEditor('experience')}/>
                <div className="profile-experience-list">
                  <ExperienceGroup icon={<BriefcaseBusiness size={18}/>} title="Internships">
                    {currentInternships.length ? currentInternships.map((item, index) => <div className="profile-experience-record" key={`${item.companyName}-${index}`}>
                      <strong>{item.companyName || <EmptyValue/>}</strong>
                      <span>Role: {item.role || <EmptyValue/>}</span>
                      <span>Duration: {item.duration || <EmptyValue/>}</span>
                      <p>{item.description || <EmptyValue/>}</p>
                    </div>) : <EmptyValue/>}
                  </ExperienceGroup>
                  <ExperienceGroup icon={<Trophy size={18}/>} title="Achievements">
                    {currentAchievements.length ? currentAchievements.map((item, index) => <div className="profile-experience-record compact" key={`${item}-${index}`}><span>{item || <EmptyValue/>}</span></div>) : <EmptyValue/>}
                  </ExperienceGroup>
                  <ExperienceGroup icon={<Award size={18}/>} title="Certifications">
                    {currentCertifications.length ? currentCertifications.map((item, index) => <div className="profile-experience-record" key={`${item.name}-${index}`}>
                      <strong>{item.name || <EmptyValue/>}</strong>
                      <span>Issuing organisation: {item.issuingOrganization || <EmptyValue/>}</span>
                      <span>Year: {item.year || <EmptyValue/>}</span>
                    </div>) : <EmptyValue/>}
                  </ExperienceGroup>
                </div>
              </section>
            </div>
          </div>
        </>}
      </main>
    </div>

    {editorSection && editData && <div className="profile-modal-backdrop" onClick={closeEditor}>
      <section className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" onClick={(event) => event.stopPropagation()}>
        <header className="profile-modal-header"><div><span className="profile-modal-eyebrow">SKILLBRIDGE PROFILE</span><h2 id="profile-edit-title">{editorSection === 'all' ? 'Edit Profile' : `Edit ${sectionTitle(editorSection)}`}</h2><p>Your changes are saved to your SkillBridge account.</p></div><button type="button" className="profile-modal-close" onClick={closeEditor} aria-label="Close"><X size={21}/></button></header>
        <form onSubmit={saveProfile} className="profile-modal-form" noValidate>
          <div className="profile-modal-body">
            {visibleSections('basic') && <EditorSection title="Student details">
              <div className="profile-form-grid">
                <Field label="Full name"><input value={editData.name} maxLength={80} onChange={(event) => changeField('name', event.target.value)} autoComplete="name"/></Field>
                <Field label="Department"><select value={editData.department} onChange={(event) => changeField('department', event.target.value)}><option value="">Select your department</option>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Academic year"><select value={editData.year} onChange={(event) => changeField('year', event.target.value)}><option value="">Select your year</option>{YEARS.map((item) => <option key={item}>{item}</option>)}</select></Field>
              </div>
            </EditorSection>}
            {visibleSections('education') && <EditorSection title="Education and campus">
              <div className="profile-form-grid">
                <Field label="College"><input value={editData.collegeName} maxLength={140} onChange={(event) => changeField('collegeName', event.target.value)}/></Field>
                <Field label="Degree"><input value={editData.degree} maxLength={100} onChange={(event) => changeField('degree', event.target.value)}/></Field>
                <Field label="Expected graduation year"><input inputMode="numeric" value={editData.graduationYear} maxLength={4} onChange={(event) => changeField('graduationYear', event.target.value.replace(/\D/g, ''))}/></Field>
                <Field label="Campus / Hostel"><input value={editData.location} maxLength={120} onChange={(event) => changeField('location', event.target.value)}/></Field>
              </div>
            </EditorSection>}
            {visibleSections('about') && <EditorSection title="About me"><Field label="Introduction"><textarea rows={5} maxLength={1000} value={editData.aboutMe} onChange={(event) => changeField('aboutMe', event.target.value)} placeholder="Share a little about your academic interests, projects, or goals."/><small className="profile-character-count">{editData.aboutMe.length}/1000</small></Field></EditorSection>}
            {visibleSections('skills') && <EditorSection title="Technical skills">
              <Field label="Search and add technologies"><div className="profile-skill-search"><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill(suggestions[0] || null); } }} placeholder="Try Java, Python, PostgreSQL…" autoComplete="off"/><button type="button" onClick={() => addSkill(null)} aria-label="Add skill"><Plus size={18}/></button></div></Field>
              {suggestions.length > 0 && <div className="profile-skill-suggestions" role="listbox" aria-label="Skill suggestions">{suggestions.map((item) => <button key={item.name} type="button" role="option" onClick={() => addSkill(item)}><TechnologyLogo name={item.name} size={20}/><span>{item.name}</span><small>{item.category}</small><Plus size={15}/></button>)}</div>}
              <div className="profile-selected-skills">{editData.skills.map((item) => <span className="profile-selected-skill" key={item.name}><TechnologyLogo name={item.name} size={20}/>{item.name}<button type="button" onClick={() => removeSkill(item.name)} aria-label={`Remove ${item.name}`}><X size={14}/></button></span>)}{!editData.skills.length && <p className="profile-empty-state">Selected skills will appear here.</p>}</div>
            </EditorSection>}
            {visibleSections('interests') && <EditorSection title="Academic interests">
              <Field label="Add an interest"><div className="profile-skill-search"><input value={interestInput} maxLength={60} onChange={(event) => setInterestInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addInterest(); } }} placeholder="For example, Cloud Computing"/><button type="button" onClick={addInterest} aria-label="Add interest"><Plus size={18}/></button></div></Field>
              <div className="profile-selected-skills">{editData.interests.map((item) => <span className="profile-selected-skill interest" key={item}>{item}<button type="button" onClick={() => changeField('interests', editData.interests.filter((value) => value !== item))} aria-label={`Remove ${item}`}><X size={14}/></button></span>)}{!editData.interests.length && <p className="profile-empty-state">Add the subjects you would like to explore.</p>}</div>
            </EditorSection>}
            {visibleSections('additional') && <EditorSection title="Additional information">
              <div className="profile-form-grid">
                <Field label="CGPA (out of 10)"><input type="number" min="0" max="10" step="0.01" value={editData.cgpa} onChange={(event) => changeField('cgpa', event.target.value)}/></Field>
                <Field label="Number of projects completed"><input type="number" min="0" step="1" value={editData.projectsCompleted} onChange={(event) => changeField('projectsCompleted', event.target.value)}/></Field>
              </div>
              <Field label="Hobbies"><div className="profile-skill-search"><input value={hobbyInput} maxLength={60} onChange={(event) => setHobbyInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addListItem('hobbies', hobbyInput); setHobbyInput(''); } }} placeholder="Add a hobby"/><button type="button" onClick={() => { addListItem('hobbies', hobbyInput); setHobbyInput(''); }} aria-label="Add hobby"><Plus size={18}/></button></div></Field>
              <div className="profile-selected-skills">{editData.hobbies.map((item, index) => <span className="profile-selected-skill interest" key={`${item}-${index}`}>{item}<button type="button" onClick={() => removeEntry('hobbies', index)} aria-label={`Remove ${item}`}><X size={14}/></button></span>)}{!editData.hobbies.length && <p className="profile-empty-state">Add hobbies you would like to share.</p>}</div>
              <Field label="Languages known"><div className="profile-skill-search"><input value={languageInput} maxLength={60} onChange={(event) => setLanguageInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addListItem('languagesKnown', languageInput); setLanguageInput(''); } }} placeholder="Add a language"/><button type="button" onClick={() => { addListItem('languagesKnown', languageInput); setLanguageInput(''); }} aria-label="Add language"><Plus size={18}/></button></div></Field>
              <div className="profile-selected-skills">{editData.languagesKnown.map((item, index) => <span className="profile-selected-skill interest" key={`${item}-${index}`}>{item}<button type="button" onClick={() => removeEntry('languagesKnown', index)} aria-label={`Remove ${item}`}><X size={14}/></button></span>)}{!editData.languagesKnown.length && <p className="profile-empty-state">Add languages you know.</p>}</div>
            </EditorSection>}
            {visibleSections('experience') && <EditorSection title="Experience and achievements">
              <div className="profile-repeatable-heading"><h4>Internships</h4><button type="button" onClick={() => changeField('internships', [...editData.internships, { companyName: '', role: '', duration: '', description: '' }])}><Plus size={15}/> Add internship</button></div>
              {editData.internships.map((item, index) => <div className="profile-repeatable-editor" key={`internship-${index}`}>
                <div className="profile-repeatable-editor-heading"><strong>Internship {index + 1}</strong><button type="button" onClick={() => removeEntry('internships', index)} aria-label={`Remove internship ${index + 1}`}><X size={15}/></button></div>
                <div className="profile-form-grid">
                  <Field label="Company name"><input maxLength={140} value={item.companyName} onChange={(event) => changeEntry('internships', index, 'companyName', event.target.value)}/></Field>
                  <Field label="Role"><input maxLength={100} value={item.role} onChange={(event) => changeEntry('internships', index, 'role', event.target.value)}/></Field>
                  <Field label="Duration"><input maxLength={80} value={item.duration} onChange={(event) => changeEntry('internships', index, 'duration', event.target.value)} placeholder="e.g. 3 months"/></Field>
                </div>
                <Field label="Description"><textarea rows={2} maxLength={1000} value={item.description} onChange={(event) => changeEntry('internships', index, 'description', event.target.value)}/></Field>
              </div>)}

              <div className="profile-repeatable-heading"><h4>Achievements</h4></div>
              <Field label="Add an award, hackathon, or competition"><div className="profile-skill-search"><input value={achievementInput} maxLength={300} onChange={(event) => setAchievementInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addListItem('academicAchievements', achievementInput); setAchievementInput(''); } }} placeholder="Add an achievement"/><button type="button" onClick={() => { addListItem('academicAchievements', achievementInput); setAchievementInput(''); }} aria-label="Add achievement"><Plus size={18}/></button></div></Field>
              <div className="profile-selected-skills">{editData.academicAchievements.map((item, index) => <span className="profile-selected-skill interest" key={`${item}-${index}`}>{item}<button type="button" onClick={() => removeEntry('academicAchievements', index)} aria-label={`Remove ${item}`}><X size={14}/></button></span>)}{!editData.academicAchievements.length && <p className="profile-empty-state">Add awards, hackathons, or competitions.</p>}</div>

              <div className="profile-repeatable-heading"><h4>Certifications</h4><button type="button" onClick={() => changeField('certifications', [...editData.certifications, { name: '', issuingOrganization: '', year: '' }])}><Plus size={15}/> Add certification</button></div>
              {editData.certifications.map((item, index) => <div className="profile-repeatable-editor" key={`certification-${index}`}>
                <div className="profile-repeatable-editor-heading"><strong>Certification {index + 1}</strong><button type="button" onClick={() => removeEntry('certifications', index)} aria-label={`Remove certification ${index + 1}`}><X size={15}/></button></div>
                <div className="profile-form-grid">
                  <Field label="Certification name"><input maxLength={140} value={item.name} onChange={(event) => changeEntry('certifications', index, 'name', event.target.value)}/></Field>
                  <Field label="Issuing organisation"><input maxLength={140} value={item.issuingOrganization} onChange={(event) => changeEntry('certifications', index, 'issuingOrganization', event.target.value)}/></Field>
                  <Field label="Year"><input inputMode="numeric" maxLength={4} value={item.year} onChange={(event) => changeEntry('certifications', index, 'year', event.target.value.replace(/\D/g, ''))}/></Field>
                </div>
              </div>)}
            </EditorSection>}
            {visibleSections('social') && <EditorSection title="Social and portfolio links">
              <Field label="GitHub"><input type="url" value={editData.github} onChange={(event) => changeField('github', event.target.value)} placeholder="https://github.com/username"/></Field>
              <Field label="LinkedIn"><input type="url" value={editData.linkedin} onChange={(event) => changeField('linkedin', event.target.value)} placeholder="https://linkedin.com/in/username"/></Field>
              <Field label="Portfolio"><input type="url" value={editData.portfolio} onChange={(event) => changeField('portfolio', event.target.value)} placeholder="https://your-portfolio.example"/></Field>
            </EditorSection>}
            {formError && <div className="profile-form-error" role="alert"><AlertCircle size={17}/>{formError}</div>}
          </div>
          <footer className="profile-modal-footer"><button type="button" className="profile-cancel-button" onClick={closeEditor} disabled={saving}>Cancel</button><button type="submit" className="profile-save-button" disabled={saving}>{saving ? <><span className="profile-spinner"/>Saving…</> : <><Save size={16}/>Save changes</>}</button></footer>
        </form>
      </section>
    </div>}

    {avatarOpen && <div className="profile-modal-backdrop" onClick={closeAvatarEditor}>
      <section className="profile-edit-modal avatar-editor-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title" onClick={(event) => event.stopPropagation()}>
        <header className="profile-modal-header"><div><span className="profile-modal-eyebrow">YOUR PROFILE PHOTO</span><h2 id="avatar-editor-title">Change profile photo</h2><p>Upload a photo or choose a professional avatar.</p></div><button type="button" className="profile-modal-close" onClick={closeAvatarEditor} aria-label="Close"><X size={21}/></button></header>
        <div className="profile-avatar-modal-body">
          <div className="profile-avatar-preview-wrap"><div className="profile-avatar-preview">{avatarFile && cropImageUrl ? <img src={cropImageUrl} alt="Selected photo preview" style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}/> : <img src={selectedDefault || avatar} alt="Profile photo preview"/>}</div><span>Preview</span></div>
          <div className="profile-avatar-options">
            <button type="button" className="profile-upload-button" onClick={() => fileInputRef.current?.click()}><Camera size={17}/>{avatarFile ? 'Choose a different photo' : 'Upload from device'}</button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectAvatarFile(event.target.files?.[0])} hidden/>
            {avatarFile && <div className="profile-crop-controls"><strong>Crop and reposition</strong><label>Horizontal position<input type="range" min="0" max="100" value={avatarPosition.x} onChange={(event) => setAvatarPosition((current) => ({ ...current, x: Number(event.target.value) }))}/></label><label>Vertical position<input type="range" min="0" max="100" value={avatarPosition.y} onChange={(event) => setAvatarPosition((current) => ({ ...current, y: Number(event.target.value) }))}/></label></div>}
            {!avatarFile && <><strong className="profile-avatar-choice-label">Choose a default professional avatar</strong><div className="profile-avatar-choices">{DEFAULT_AVATARS.map((item) => <button type="button" key={item.src} className={selectedDefault === item.src ? 'selected' : ''} onClick={() => { setSelectedDefault(item.src); setAvatarFile(null); }} aria-pressed={selectedDefault === item.src}><img src={item.src} alt=""/><span>{item.label}</span>{selectedDefault === item.src && <Check size={14}/>}</button>)}</div></>}
            {profileData?.avatar && <button type="button" className="profile-remove-avatar" onClick={removeAvatar} disabled={avatarSaving}>Remove current photo</button>}
          </div>
        </div>
        {avatarError && <div className="profile-avatar-error" role="alert"><AlertCircle size={16}/>{avatarError}</div>}
        <footer className="profile-modal-footer"><button type="button" className="profile-cancel-button" onClick={closeAvatarEditor} disabled={avatarSaving}>Cancel</button><button type="button" className="profile-save-button" onClick={saveAvatar} disabled={avatarSaving}>{avatarSaving ? <><span className="profile-spinner"/>Saving…</> : <><Save size={16}/>Save photo</>}</button></footer>
      </section>
    </div>}
  </div>;
}

function isValidWebUrl(value) {
  try { const url = new URL(value.startsWith('http') ? value : `https://${value}`); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname.includes('.'); } catch { return false; }
}
function sectionTitle(section) { return ({ basic: 'Student Details', education: 'Education', about: 'About Me', skills: 'Technical Skills', interests: 'Academic Interests', additional: 'Additional Information', experience: 'Experience & Achievements', social: 'Social & Portfolios' })[section] || 'Profile'; }
function SectionHeading({ icon, title, onEdit, extra }) { return <div className="profile-section-header"><h2 className="profile-section-title"><span className="profile-section-icon">{icon}</span>{title}</h2><div className="profile-section-actions">{extra && <span className="profile-section-count">{extra}</span>}<PencilButton label={title} onClick={onEdit}/></div></div>; }
function SocialLink({ icon, label, value }) { return value ? <a href={profileUrl(value)} target="_blank" rel="noreferrer" className="social-link-item"><span className="social-icon-wrapper">{icon}</span><strong>{label}</strong><span className="social-url-text">{value}</span><ExternalLink size={15}/></a> : <div className="social-link-item unlinked"><span className="social-icon-wrapper">{icon}</span><strong>{label}</strong><span className="social-url-text">Not linked</span></div>; }
function ProfileInfoItem({ icon, label, value }) { return <div className="profile-info-item"><span className="profile-info-icon">{icon}</span><strong>{label}</strong><span className={value ? '' : 'profile-info-empty'}>{value || 'Not added yet'}</span></div>; }
function ExperienceGroup({ icon, title, children }) { return <div className="profile-experience-group"><h3><span>{icon}</span>{title}</h3><div className="profile-experience-content">{children}</div></div>; }
function EmptyValue() { return <span className="profile-empty-value">Not added yet</span>; }
function EditorSection({ title, children }) { return <section className="profile-editor-section"><h3>{title}</h3>{children}</section>; }
function Field({ label, children }) { return <label className="profile-edit-field"><span>{label}</span>{children}</label>; }
