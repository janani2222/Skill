import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  UsersRound,
  Search,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  getAdminCommunities,
  createAdminCommunity,
  deleteAdminCommunity
} from '../services/adminService';

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Technology',
    rules: 'Respect peer contributions and share knowledge actively.'
  });

  const loadCommunities = async () => {
    try {
      const res = await getAdminCommunities();
      setCommunities(res.communities || []);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load communities.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await createAdminCommunity(form);
      showNotice('Community created successfully.');
      setIsModalOpen(false);
      setForm({
        name: '',
        description: '',
        category: 'Technology',
        rules: 'Respect peer contributions and share knowledge actively.'
      });
      loadCommunities();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to create community.', 'error');
    }
  };

  const handleDelete = async (comm) => {
    if (!window.confirm(`Delete community "${comm.name}"?`)) return;
    try {
      await deleteAdminCommunity(comm._id);
      showNotice('Community removed.');
      loadCommunities();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to delete community.', 'error');
    }
  };

  const filtered = communities.filter((c) => {
    const matchSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <AdminLayout
      pageTitle="Communities Management"
      pageSubtitle="Create and manage student communities."
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

      {/* Top Filter & Action Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filters-right">
          <select
            className="admin-select-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">Category: All</option>
            <option value="Web Development">Web Development</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="Hardware & IoT">Hardware &amp; IoT</option>
          </select>

          <button className="btn-admin-gold" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} /> Create Community
          </button>
        </div>
      </div>

      {/* Communities Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Community Name</th>
              <th>Category</th>
              <th>Members</th>
              <th>Creator</th>
              <th>Status</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((comm) => (
                <tr key={comm._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <UsersRound size={18} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#10243E' }}>
                          {comm.name}
                        </strong>
                        <small style={{ display: 'block', fontSize: '11px', color: '#65758A' }}>
                          {comm.description}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{comm.category || 'Technology'}</td>
                  <td style={{ fontWeight: 600 }}>{comm.membersCount || 1} members</td>
                  <td>{comm.creator || 'Admin'}</td>
                  <td>
                    <span className="admin-badge active">{comm.status || 'Active'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="admin-action-btn"
                      onClick={() => handleDelete(comm)}
                      title="Delete Community"
                    >
                      <Trash2 size={14} color="#B91C1C" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#65758A' }}>
                  No communities found. Click "+ Create Community" to start one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Community Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create Student Community</h3>
              <button
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Community Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI & Data Science Hub"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Brief description of the community's purpose..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Hardware & IoT">Hardware &amp; IoT</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Community Rules</label>
                  <input
                    type="text"
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-admin-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-admin-gold">
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

