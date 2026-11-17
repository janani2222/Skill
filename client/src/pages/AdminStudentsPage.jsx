import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  MoreHorizontal,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminStudents, toggleStudentActive, deleteStudent } from '../services/adminService';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const menuRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const loadStudents = async () => {
    try {
      const res = await getAdminStudents({
        search,
        department,
        year,
        page,
        limit: 8
      });
      setStudents(res.students || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load students.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, department, year, page]);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  const handleToggleActive = async (student) => {
    try {
      await toggleStudentActive(student._id, !student.active);
      showNotice(
        `Student account ${!student.active ? 'activated' : 'deactivated'} successfully.`
      );
      setActiveMenuId(null);
      loadStudents();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to update account.', 'error');
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${student.name}'s account?`)) {
      return;
    }
    try {
      await deleteStudent(student._id);
      showNotice(`Student ${student.name} deleted successfully.`);
      setActiveMenuId(null);
      loadStudents();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to delete student.', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = ['Name', 'Email', 'Department', 'Year', 'Projects', 'Status', 'Joined On'];
    const rows = students.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      `"${s.year}"`,
      s.projectsCount || 0,
      s.active ? 'Active' : 'Inactive',
      `"${new Date(s.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skillbridge_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Student list exported to CSV.');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(students.map((s) => s._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nov 12, 2026';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout
      pageTitle="Student Management"
      pageSubtitle="View, search and manage registered students."
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

      {/* Search & Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, department or email..."
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
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">Department: All</option>
            <option value="Computer Science and Engineering">CSE</option>
            <option value="Information Technology">IT</option>
            <option value="Electronics and Communication Engineering">ECE</option>
            <option value="Artificial Intelligence and Machine Learning">AIML</option>
            <option value="Mechanical Engineering">Mechanical</option>
          </select>

          <select
            className="admin-select-filter"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">Year: All</option>
            <option value="First">First</option>
            <option value="Second">Second</option>
            <option value="Third">Third</option>
            <option value="Fourth">Fourth</option>
          </select>

          <button className="btn-admin-gold" onClick={handleExportCSV}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Professional Students Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={students.length > 0 && selectedIds.size === students.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Student</th>
              <th>Department</th>
              <th>Year</th>
              <th>Projects</th>
              <th>Status</th>
              <th>Joined On</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => {
                const isMenuOpen = activeMenuId === student._id;

                return (
                  <tr key={student._id}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student._id)}
                        onChange={() => handleToggleSelect(student._id)}
                      />
                    </td>
                    <td>
                      <div className="admin-student-cell">
                        <div className="admin-student-avatar">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="admin-student-name-box">
                          <strong>{student.name}</strong>
                          <small>{student.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {student.department === 'Computer Science and Engineering'
                        ? 'CSE'
                        : student.department === 'Information Technology'
                        ? 'IT'
                        : student.department === 'Electronics and Communication Engineering'
                        ? 'ECE'
                        : student.department === 'Artificial Intelligence and Machine Learning'
                        ? 'AIML'
                        : student.department || 'CSE'}
                    </td>
                    <td>{student.year || 'Third'}</td>
                    <td style={{ fontWeight: 600 }}>{student.projectsCount || 0}</td>
                    <td>
                      <span className={`admin-badge ${student.active ? 'active' : 'inactive'}`}>
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(student.joinedAt)}</td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        className="admin-action-btn"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : student._id)
                        }
                        title="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="admin-action-menu" ref={menuRef}>
                          <Link to={`/students/${student._id}`} target="_blank">
                            <ExternalLink size={13} /> View Profile
                          </Link>
                          <button onClick={() => handleToggleActive(student)}>
                            {student.active ? (
                              <>
                                <ShieldAlert size={13} /> Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={13} /> Activate
                              </>
                            )}
                          </button>
                          <button
                            className="danger"
                            onClick={() => handleDelete(student)}
                          >
                            <Trash2 size={13} /> Delete Account
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '28px', color: '#65758A' }}>
                  No registered students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="admin-pagination-bar">
        <div>
          Showing {students.length ? (page - 1) * 8 + 1 : 0}-
          {Math.min(page * 8, total)} of {total} students
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

