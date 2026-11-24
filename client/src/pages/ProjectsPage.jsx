import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRight,
  FolderGit2,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Upload
} from 'lucide-react';
import SkillBridgeNavbar from '../components/SkillBridgeNavbar';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getJoinRequests,
  updateJoinRequest
} from '../services/phase2Service';
import { useAuth } from '../context/AuthContext';
import '../styles/my-projects-redesign.css';

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'Web Development',
  technologies: '',
  role: 'Full Stack Developer',
  status: 'Planning',
  startDate: '',
  completionDate: '',
  githubUrl: '',
  liveDemoUrl: '',
  thumbnail: ''
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ text: '', type: '' });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // 3-dot dropdown active state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuContainerRef = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [modalError, setModalError] = useState('');
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  // Close card menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch projects and requests
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects({ mine: true });
      setProjects(data.projects || []);
    } catch (err) {
      setNotice({ text: err.response?.data?.message || err.message || 'Failed to load projects', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await getJoinRequests();
      setRequests(data.requests || []);
    } catch (_) {}
  };

  useEffect(() => {
    loadProjects();
    loadRequests();
  }, []);

  const showNotification = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 5000);
  };

  // Resolve cover image
  const getCoverImage = (project) => {
    return project.thumbnail?.trim() || '';
  };

  // Primary tech label
  const getTechLabel = (technologies) => {
    if (!technologies || technologies.length === 0) return 'MERN';
    const joined = Array.isArray(technologies) ? technologies.join(' ').toUpperCase() : String(technologies).toUpperCase();
    if (joined.includes('MONGO') && joined.includes('EXPRESS') && joined.includes('REACT') && joined.includes('NODE')) {
      return 'MERN STACK';
    }
    if (joined.includes('MERN')) return 'MERN';
    return (Array.isArray(technologies) ? technologies[0] : technologies).toUpperCase();
  };

  // Status dot CSS class
  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '-');
    if (s === 'completed') return 'completed';
    if (s === 'in-progress') return 'in-progress';
    if (s === 'planning') return 'planning';
    return 'on-hold';
  };

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setCoverFile(null);
    setModalError('');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (project) => {
    setActiveMenuId(null);
    setEditingId(project._id);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      category: project.category || 'Web Development',
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : (project.technologies || ''),
      role: project.role || 'Full Stack Developer',
      status: project.status || 'Planning',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      completionDate: project.completionDate ? project.completionDate.split('T')[0] : '',
      githubUrl: project.githubUrl || '',
      liveDemoUrl: project.liveDemoUrl || '',
      thumbnail: project.thumbnail || ''
    });
    setCoverFile(null);
    setModalError('');
    setIsModalOpen(true);
  };

  // Handle delete project
  const handleDelete = async (projectId) => {
    setActiveMenuId(null);
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await deleteProject(projectId);
      showNotification('Project deleted successfully.');
      loadProjects();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to delete project', 'error');
    }
  };

  // Handle submit form (create or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const techArray = formData.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!formData.title.trim()) {
      setModalError('Project title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setModalError('Project description is required.');
      return;
    }
    if (techArray.length === 0) {
      setModalError('At least one technology is required.');
      return;
    }

    const payload = {
      ...formData,
      technologies: techArray
    };

    try {
      if (editingId) {
        await updateProject(editingId, payload, coverFile);
        showNotification('Project updated successfully.');
      } else {
        await createProject(payload, coverFile);
        showNotification('Project created successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setCoverFile(null);
      loadProjects();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save project');
    }
  };

  // Handle join requests
  const handleRequestAction = async (requestId, newStatus) => {
    try {
      await updateJoinRequest(requestId, newStatus);
      showNotification(`Join request ${newStatus.toLowerCase()}.`);
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      loadProjects();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update request', 'error');
    }
  };

  // Filter & sort projects
  const filteredProjects = projects.filter((p) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchTech = (p.technologies || []).some((t) => t.toLowerCase().includes(q));
      const matchCat = (p.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTech && !matchCat) return false;
    }
    // Status
    if (statusFilter !== 'All') {
      if ((p.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || a.startDate || 0) - new Date(b.createdAt || b.startDate || 0);
    }
    // default: newest
    return new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0);
  });

  return (
    <div className="projects-shell" ref={menuContainerRef}>
      {/* 1. SkillBridge Top Navigation Bar */}
      <SkillBridgeNavbar />

      <main className="my-projects-page">
        {/* Notice alert */}
        {notice.text && (
          <div className={`project-alert-banner ${notice.type === 'error' ? 'error' : 'success'}`}>
            <span>{notice.text}</span>
            <button
              onClick={() => setNotice({ text: '', type: '' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 2. Page Heading & Create Project Button */}
        <div className="my-projects-header">
          <div>
            <span className="my-projects-eyebrow">YOUR PORTFOLIO</span>
            <h1 className="my-projects-title">My Projects</h1>
            <p className="my-projects-subtitle">Manage and collaborate on your projects.</p>
          </div>
          <button type="button" className="btn-create-project" onClick={handleOpenCreate}>
            <Plus size={16} /> CREATE PROJECT
          </button>
        </div>

        {/* 3. Single Horizontal Toolbar (Search & Filters) */}
        <div className="my-projects-toolbar">
          <div className="my-projects-search-wrap">
            <Search size={16} className="my-projects-search-icon" />
            <input
              type="text"
              className="my-projects-search-input"
              placeholder="Search my projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="my-projects-filter-wrap">
            <select
              className="my-projects-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Projects</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
            <ChevronDown size={14} className="my-projects-filter-chevron" />
          </div>

          <div className="my-projects-filter-wrap">
            <select
              className="my-projects-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Recently Added</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Title A-Z</option>
            </select>
            <ChevronDown size={14} className="my-projects-filter-chevron" />
          </div>
        </div>

        {/* 4. Pending Join Requests Notice (if any) */}
        {requests.length > 0 && (
          <section className="project-detail-card" style={{ marginBottom: '24px' }}>
            <div className="detail-card-header">
              <h3 className="detail-card-title">Pending Join Requests ({requests.length})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#FDFBF8',
                    border: '1px solid #F0ECE4'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#10243E' }}>
                      {req.applicant?.name || 'Student'}{' '}
                      <span style={{ fontWeight: '400', color: '#53677F' }}>
                        wants to join <strong>{req.project?.title}</strong>
                      </span>
                    </div>
                    {req.message && (
                      <div style={{ fontSize: '12.5px', color: '#53677F', marginTop: '2px' }}>
                        "{req.message}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-modal-submit"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleRequestAction(req._id, 'Accepted')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      style={{ padding: '6px 14px', fontSize: '12px', color: '#B42318' }}
                      onClick={() => handleRequestAction(req._id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Project Cards Grid (3 cards per row on desktop) */}
        {loading ? (
          <div className="my-projects-empty">
            <p>Loading your projects...</p>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="my-projects-empty">
            <FolderGit2 size={44} style={{ color: '#C99A32', marginBottom: '12px' }} />
            <h3>No projects found</h3>
            <p>
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search query or filter options.'
                : 'Start showcasing your academic portfolio by creating your first project.'}
            </p>
            <button type="button" className="btn-create-project" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Your First Project
            </button>
          </div>
        ) : (
          <div className="my-projects-grid">
            {sortedProjects.map((project) => {
              const coverUrl = getCoverImage(project);
              const techLabel = getTechLabel(project.technologies);
              const statusClass = getStatusClass(project.status);
              const isMenuOpen = activeMenuId === project._id;

              return (
                <article className="project-card-exact" key={project._id}>
                  {/* Card Cover Image */}
                  <div className="project-card-image-box">
                    <div className="project-card-fallback-cover" aria-hidden="true">
                      <FolderGit2 size={30} />
                      <span>Project cover</span>
                    </div>
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt={`${project.title} cover`}
                        onError={(e) => e.currentTarget.remove()}
                      />
                    )}

                    {/* 3-dot circular action menu */}
                    <button
                      type="button"
                      className="project-card-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : project._id);
                      }}
                      aria-label="Project actions"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="project-card-menu-dropdown">
                        <button type="button" onClick={() => handleOpenEdit(project)}>
                          <Pencil size={13} /> Edit Project
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(project._id)}
                        >
                          <Trash2 size={13} /> Delete Project
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Information Body */}
                  <div className="project-card-content">
                    <Link to={`/projects/${project._id}`} className="project-card-title-link">
                      <h3 className="project-card-title">{project.title}</h3>
                    </Link>

                    <p className="project-card-desc">{project.description}</p>

                    <div className="project-card-badge-row">
                      <span className="project-tech-pill">{techLabel}</span>
                    </div>

                    {/* Bottom Row */}
                    <div className="project-card-bottom-row">
                      <div className="project-card-status-indicator">
                        <span className={`project-status-dot ${statusClass}`} />
                        <span>{project.status || 'Planning'}</span>
                      </div>

                      <Link to={`/projects/${project._id}`} className="project-card-view-link">
                        View Project <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="project-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="project-modal-header">
              <h2 className="project-modal-title">
                {editingId ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                type="button"
                className="project-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="project-modal-body">
                {modalError && (
                  <div className="project-alert-banner error" style={{ marginBottom: '16px' }}>
                    {modalError}
                  </div>
                )}

                <div className="project-form-grid">
                  <div className="project-form-group full-width">
                    <label className="project-form-label">Project Title *</label>
                    <input
                      type="text"
                      className="project-form-input"
                      required
                      placeholder="e.g. Job Portal"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group full-width">
                    <label className="project-form-label">Short Description *</label>
                    <textarea
                      rows={3}
                      className="project-form-textarea"
                      required
                      placeholder="e.g. A modern job portal to connect talent with opportunities."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Category</label>
                    <select
                      className="project-form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option>Web Development</option>
                      <option>Mobile Applications</option>
                      <option>Artificial Intelligence</option>
                      <option>Cloud & DevOps</option>
                      <option>Data Science</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Status</label>
                    <select
                      className="project-form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option>Planning</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>On Hold</option>
                    </select>
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Technologies (comma separated) *</label>
                    <input
                      type="text"
                      className="project-form-input"
                      required
                      placeholder="React, Node.js, MongoDB, Express"
                      value={formData.technologies}
                      onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">My Role</label>
                    <input
                      type="text"
                      className="project-form-input"
                      placeholder="Full Stack Developer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Start Date *</label>
                    <input
                      type="date"
                      className="project-form-input"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Completion Date</label>
                    <input
                      type="date"
                      className="project-form-input"
                      value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group full-width">
                    <label className="project-form-label">Project Cover Image</label>
                    <div className="project-cover-upload">
                      {(coverPreview || formData.thumbnail) ? (
                        <img
                          className="project-cover-preview"
                          src={coverPreview || formData.thumbnail}
                          alt="Project cover preview"
                        />
                      ) : (
                        <div className="project-cover-empty">
                          <FolderGit2 size={24} />
                          <span>No cover image selected</span>
                        </div>
                      )}
                      <div className="project-cover-controls">
                        <label className="project-cover-choose">
                          <Upload size={15} />
                          {coverFile ? 'Choose another image' : 'Upload cover image'}
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                              if (!allowedTypes.includes(file.type)) {
                                setModalError('Choose a JPG, PNG, WEBP, or GIF image for the project cover.');
                                e.target.value = '';
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setModalError('The cover image must be 5 MB or smaller.');
                                e.target.value = '';
                                return;
                              }
                              setModalError('');
                              setCoverFile(file);
                            }}
                          />
                        </label>
                        {(coverFile || formData.thumbnail) && (
                          <button
                            type="button"
                            className="project-cover-remove"
                            onClick={() => {
                              setCoverFile(null);
                              setFormData({ ...formData, thumbnail: '' });
                              if (coverInputRef.current) coverInputRef.current.value = '';
                            }}
                          >
                            Remove cover
                          </button>
                        )}
                      </div>
                      <p className="project-cover-hint">Optional. JPG, PNG, WEBP, or GIF, up to 5 MB.</p>
                    </div>
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">GitHub Repository URL</label>
                    <input
                      type="url"
                      className="project-form-input"
                      placeholder="https://github.com/..."
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="project-form-group">
                    <label className="project-form-label">Live Demo URL</label>
                    <input
                      type="url"
                      className="project-form-input"
                      placeholder="https://myproject.com"
                      value={formData.liveDemoUrl}
                      onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="project-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
