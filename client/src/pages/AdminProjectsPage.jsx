import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  MoreHorizontal,
  ExternalLink,
  UsersRound,
  Trash2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminProjects, deleteAdminProject } from '../services/adminService';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const loadProjects = async () => {
    try {
      const res = await getAdminProjects({
        search,
        status,
        category,
        page,
        limit: 8
      });
      setProjects(res.projects || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load projects.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadProjects();
  }, [search, status, category, page]);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Are you sure you want to delete the project "${project.title}"?`)) {
      return;
    }
    try {
      await deleteAdminProject(project._id);
      showNotice(`Project "${project.title}" removed successfully.`);
      setActiveMenuId(null);
      loadProjects();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to remove project.', 'error');
    }
  };

  const getStatusClass = (st) => {
    const s = (st || '').toLowerCase();
    if (s === 'planning') return 'planning';
    if (s === 'in progress') return 'in-progress';
    if (s === 'completed') return 'completed';
    return 'on-hold';
  };

  return (
    <AdminLayout
      pageTitle="Projects Management"
      pageSubtitle="View all student projects, their teams and current status."
    >
      {notice.text && (
        <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>
          <span>{notice.text}</span>
          <button
            className="admin-notice-close"
            onClick={() => setNotice({ text: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search project by title, owner or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-filters-right">
          <select
            className="admin-select-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">Status: All</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            className="admin-select-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">Category: All</option>
            <option value="Web Development">Web Development</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="Robotics & IoT">Robotics &amp; IoT</option>
            <option value="Mobile Development">Mobile Development</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Team</th>
              <th>Status</th>
              <th style={{ width: '180px' }}>Progress</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((project) => {
                const isMenuOpen = activeMenuId === project._id;
                const statusClass = getStatusClass(project.status);

                return (
                  <tr key={project._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '36px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#EAE3D5',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={project.thumbnail || '/college-building.png'}
                            alt={project.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#10243E' }}>
                            {project.title}
                          </strong>
                          <small
                            style={{
                              display: 'block',
                              fontSize: '11px',
                              color: '#65758A',
                              maxWidth: '240px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {project.description || 'Student collaboration project.'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#D1C8B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {project.owner?.avatar ? (
                            <img
                              src={project.owner.avatar}
                              alt={project.owner.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            (project.owner?.name || 'O').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 500 }}>
                          {project.owner?.name || 'Student'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="#65758A" />
                        <span>
                          {project.currentMembers} / {project.maxMembers}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${statusClass}`}>
                        {project.status || 'Planning'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#EFECE6',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${project.progress || 0}%`,
                              height: '100%',
                              backgroundColor:
                                project.status === 'Completed'
                                  ? '#10B981'
                                  : project.status === 'In Progress'
                                  ? '#D5A32D'
                                  : '#3B82F6',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#10243E',
                            minWidth: '30px'
                          }}
                        >
                          {project.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        className="admin-action-btn"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : project._id)
                        }
                        title="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="admin-action-menu" ref={menuRef}>
                          <Link to={`/projects/${project._id}`} target="_blank">
                            <ExternalLink size={13} /> View Details
                          </Link>
                          <Link to={`/projects/${project._id}/team`} target="_blank">
                            <UsersRound size={13} /> View Team
                          </Link>
                          <button
                            className="danger"
                            onClick={() => handleDelete(project)}
                          >
                            <Trash2 size={13} /> Remove Project
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#65758A' }}>
                  No projects found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="admin-pagination-bar">
        <div>
          Showing {projects.length ? (page - 1) * 8 + 1 : 0}-
          {Math.min(page * 8, total)} of {total} projects
        </div>

        <div className="admin-pagination-btns">
          <button
            className="admin-page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => (
            <button
              key={i + 1}
              className={`admin-page-btn ${page === i + 1 ? 'active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          {totalPages > 5 && <span style={{ padding: '0 4px' }}>…</span>}
          {totalPages > 5 && (
            <button
              className={`admin-page-btn ${page === totalPages ? 'active' : ''}`}
              onClick={() => setPage(totalPages)}
            >
              {totalPages}
            </button>
          )}
          <button
            className="admin-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

