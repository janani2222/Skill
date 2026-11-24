import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChevronDown, ClipboardList, CodeXml, GraduationCap, Heart, Info, Languages, Layers3, Link2, Linkedin, MapPin, MessageCircle, Trophy, UserRound, Globe } from 'lucide-react';
import { siGithub, siMysql, siOpenjdk, siPython, siReact, siSpringboot } from 'simple-icons';
import { getPublicStudent, getProjects } from '../services/phase2Service';
import { useAuth } from '../context/AuthContext';

const iconMap = { java: siOpenjdk, python: siPython, 'spring boot': siSpringboot, mysql: siMysql, react: siReact };
const iconFor = (name) => iconMap[String(name || '').toLowerCase()] || null;
const safeUrl = (value = '') => value ? (value.startsWith('http') ? value : `https://${value}`) : '';
const valueOrEmpty = (value, empty = 'Not added yet') => value || empty;

function BrandLogo({ icon, size = 18 }) {
  if (!icon) return <Globe size={size} aria-hidden="true" />;
  return <svg className="student-profile-brand-logo" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={`#${icon.hex}`}><path d={icon.path} /></svg>;
}
function SectionTitle({ icon: Icon, children }) { return <div className="student-profile-section-title"><Icon size={22} strokeWidth={2} /><h2>{children}</h2></div>; }
function SocialRow({ icon, label, url, action, lucideIcon: LucideIcon }) { const target = safeUrl(url); return <div className="student-profile-social-row"><span className="student-profile-social-icon">{LucideIcon ? <LucideIcon size={18} color="#0a66c2" /> : <BrandLogo icon={icon} />}</span><strong>{label}</strong>{target ? <a href={target} target="_blank" rel="noopener noreferrer">{action}</a> : <span className="student-profile-not-added">Not added yet</span>}</div>; }

export default function PublicProfilePageFixed() {
  const { id } = useParams(); const { profile: viewerProfile } = useAuth();
  const [student, setStudent] = useState(null); const [projects, setProjects] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let active = true; setLoading(true); setError(''); Promise.all([getPublicStudent(id), getProjects({ studentId: id })]).then(([profileResponse, projectResponse]) => { if (active) { setStudent(profileResponse.profile); setProjects(projectResponse.projects || []); } }).catch((requestError) => { if (active) setError(requestError.message || 'Student profile could not be loaded.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  if (loading) return <div className="student-profile-loading">Loading profile…</div>;
  if (error || !student) return <main className="student-profile-error"><p>{error || 'Student profile not found.'}</p><Link to="/discover">Back to Students</Link></main>;
  const person = student.user || {}; const socials = student.socialLinks || {};
  const achievementItems = Array.isArray(student.academicAchievements) ? student.academicAchievements.filter(Boolean) : student.academicAchievements ? [student.academicAchievements] : [];
  const internshipItems = Array.isArray(student.internships) ? student.internships : student.internships ? [{ companyName: student.internships, role: '', duration: '', description: '' }] : [];
  const certificationItems = Array.isArray(student.certifications) ? student.certifications : [];
  const hobbies = Array.isArray(student.hobbies) ? student.hobbies.filter(Boolean).join(', ') : student.hobbies;
  const languages = Array.isArray(student.languagesKnown) ? student.languagesKnown.filter(Boolean).join(', ') : student.languagesKnown;
  const projectsCompleted = student.projectsCompleted !== null && student.projectsCompleted !== undefined && student.projectsCompleted !== '' ? `${student.projectsCompleted} ${Number(student.projectsCompleted) === 1 ? 'project' : 'projects'}` : '';
  return <div className="student-profile-shell">
    <header className="student-profile-navbar"><Link to="/" className="student-profile-logo"><span>Skill</span><b>Bridge</b></Link><nav><Link to="/">Home</Link><Link to="/explore">Explore</Link><Link to="/explore">Workshops</Link><Link to="/discover">Communities</Link></nav><div className="student-profile-nav-actions"><Link to="/notifications" aria-label="Notifications"><Bell size={21} /></Link><Link to="/profile" className="student-profile-nav-avatar"><img src={viewerProfile?.avatar || '/avatars/professional-neutral.svg'} alt="My profile" /></Link><ChevronDown size={16} /></div></header>
    <main className="student-profile-page"><Link to="/discover" className="student-profile-back"><ArrowLeft size={17} /> Back to Students</Link>
      <section className="student-profile-hero"><div className="student-profile-hero-content"><div className="student-profile-avatar"><img src={student.avatar || '/avatars/professional-neutral.svg'} alt={person.name || 'Student'} onError={(event) => { event.currentTarget.src = '/avatars/professional-neutral.svg'; }} /></div><div className="student-profile-hero-details"><span className="student-profile-eyebrow">STUDENT PROFILE</span><h1>{person.name || 'Student'}</h1><p className="student-profile-department"><GraduationCap size={16} /> {person.department || 'Department not added'} · {person.year || 'Year not added'}</p><p className="student-profile-location"><MapPin size={16} /> {student.location || 'Location not added'} · {student.collegeName || 'College not added'}</p><Link className="student-profile-message" to={`/messages?to=${person._id || id}`}><MessageCircle size={18} /> Message</Link></div></div></section>
      <div className="student-profile-columns"><div className="student-profile-main-column">
        <section className="student-profile-card"><SectionTitle icon={UserRound}>About Me</SectionTitle><p className="student-profile-about">{valueOrEmpty(student.aboutMe, 'No information added yet.')}</p></section>
        <section className="student-profile-card"><SectionTitle icon={GraduationCap}>Education</SectionTitle><div className="student-profile-education"><strong>{student.degree || 'Degree not added'}</strong><span>{student.collegeName || 'College not added'}</span><span><CalendarDays size={16} /> Graduation: {student.graduationYear || 'Not added yet'}</span></div></section>
        <section className="student-profile-card"><SectionTitle icon={CodeXml}>Technical Skills</SectionTitle><div className="student-profile-skills">{student.skills?.length ? student.skills.map((skill) => { const name = skill.name || skill; return <span className="student-profile-skill" key={skill._id || name}><BrandLogo icon={iconFor(name)} size={20} />{name}</span>; }) : <span className="student-profile-empty">No skills added yet.</span>}</div></section>
        <section className="student-profile-card"><SectionTitle icon={Layers3}>Projects</SectionTitle><div className="student-profile-projects">{projects.length ? projects.map((project) => <Link to={`/projects/${project._id}`} className="student-profile-project" key={project._id}><div className="student-profile-project-thumb">{project.thumbnail ? <img src={project.thumbnail} alt="" /> : <Layers3 size={25} />}</div><div><strong>{project.title}</strong><p>{project.description || 'No description added yet.'}</p><div className="student-profile-project-tags">{(project.technologies || []).slice(0, 4).map((technology) => <span key={technology}>{technology}</span>)}</div></div></Link>) : <span className="student-profile-empty">No projects added yet.</span>}</div></section>
      </div><aside className="student-profile-side-column">
        <section className="student-profile-card"><SectionTitle icon={BookOpen}>Academic Interests</SectionTitle><div className="student-profile-interest-tags">{student.interests?.length ? student.interests.map((interest) => <span key={interest}>{interest}</span>) : <span className="student-profile-empty">No academic interests added yet.</span>}</div></section>
        <section className="student-profile-card"><SectionTitle icon={Link2}>Social &amp; Portfolio</SectionTitle><div className="student-profile-social"><SocialRow lucideIcon={Linkedin} label="LinkedIn" url={socials.linkedin} action="View Profile" /><SocialRow icon={siGithub} label="GitHub" url={socials.github} action="View Profile" /><SocialRow icon={null} label="Portfolio" url={socials.portfolio} action="Visit Portfolio" /></div></section>
        <section className="student-profile-card"><SectionTitle icon={Info}>Additional Information</SectionTitle><div className="student-profile-additional">
          <div><ClipboardList size={18} /><strong>CGPA</strong><span>{student.cgpa !== null && student.cgpa !== undefined && student.cgpa !== '' ? `${student.cgpa} / 10` : 'Not added yet'}</span></div>
          <div><Heart size={18} /><strong>Hobbies</strong><span>{valueOrEmpty(hobbies)}</span></div>
          <div><Languages size={18} /><strong>Languages Known</strong><span>{valueOrEmpty(languages)}</span></div>
          <div><Layers3 size={18} /><strong>Projects Completed</strong><span>{valueOrEmpty(projectsCompleted)}</span></div>
        </div></section>
        <section className="student-profile-card"><SectionTitle icon={BriefcaseBusiness}>Experience &amp; Achievements</SectionTitle>
          <div className="student-profile-experience">
            <section><h3><BriefcaseBusiness size={16}/> Internships</h3>{internshipItems.length ? internshipItems.map((item, index) => <article className="student-profile-experience-record" key={`${item.companyName || item.role}-${index}`}><strong>{item.companyName || 'Not added yet'}</strong><span>Role: {item.role || 'Not added yet'}</span><span>Duration: {item.duration || 'Not added yet'}</span><p>{valueOrEmpty(item.description)}</p></article>) : <span className="student-profile-empty">Not added yet</span>}</section>
            <section><h3><Trophy size={16}/> Achievements</h3>{achievementItems.length ? achievementItems.map((item, index) => <article className="student-profile-experience-record compact" key={`${item}-${index}`}><span>{item}</span></article>) : <span className="student-profile-empty">Not added yet</span>}</section>
            <section><h3><Award size={16}/> Certifications</h3>{certificationItems.length ? certificationItems.map((item, index) => <article className="student-profile-experience-record" key={`${item.name}-${index}`}><strong>{item.name || 'Not added yet'}</strong><span>Issuing organisation: {item.issuingOrganization || 'Not added yet'}</span><span>Year: {item.year || 'Not added yet'}</span></article>) : <span className="student-profile-empty">Not added yet</span>}</section>
          </div>
        </section>
      </aside></div>
    </main></div>;
}
