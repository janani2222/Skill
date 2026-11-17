import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminJoinRequests } from '../services/adminService';

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState({ text: '', type: '' });

  useEffect(() => {
    getAdminJoinRequests()
      .then((res) => setRequests(res.requests || []))
      .catch((err) =>
        setNotice({
          text: err.response?.data?.message || err.message || 'Unable to load join requests.',
          type: 'error'
        })
      );
  }, []);

  const filtered = requests.filter((r) => {
    const matchStatus = filter === 'All' || r.status === filter;
    const matchSearch =
      (r.applicant?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.project?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.projectOwner?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nov 12, 2026';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout
      pageTitle="Join Requests"
      pageSubtitle="Monitor student project collaboration requests."
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

      {/* Filter Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by student or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filters-right">
          <select
            className="admin-select-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Project</th>
              <th>Project Owner</th>
              <th>Requested Role</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((req) => (
                <tr key={req._id}>
                  <td>
                    <div className="admin-student-cell">
                      <div className="admin-student-avatar">
                        {req.applicant?.avatar ? (
                          <img src={req.applicant.avatar} alt={req.applicant.name} />
                        ) : (
                          (req.applicant?.name || 'S').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="admin-student-name-box">
                        <strong>{req.applicant?.name || 'Student'}</strong>
                        <small>{req.applicant?.department || 'CSE'}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px', color: '#10243E' }}>
                      {req.project?.title || 'Project'}
                    </strong>
                  </td>
                  <td>{req.projectOwner?.name || 'Owner'}</td>
                  <td>{req.requestedRole || 'Team Member'}</td>
                  <td>{formatDate(req.createdAt)}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        req.status === 'Accepted'
                          ? 'active'
                          : req.status === 'Rejected'
                          ? 'inactive'
                          : 'scheduled'
                      }`}
                    >
                      {req.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#65758A' }}>
                  No join requests found matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

