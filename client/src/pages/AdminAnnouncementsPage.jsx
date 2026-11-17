import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Megaphone,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  deleteAdminAnnouncement
} from '../services/adminService';

export default function AdminAnnouncementsPage() {
  const [searchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    targetAudience: 'All Students',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'Published'
  });

  const loadAnnouncements = async () => {
    try {
      const res = await getAdminAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load announcements.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadAnnouncements();
    if (searchParams.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await createAdminAnnouncement(form);
      showNotice('Announcement published successfully.');
      setIsModalOpen(false);
      setForm({
        title: '',
        description: '',
        category: 'General',
        targetAudience: 'All Students',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'Published'
      });
      loadAnnouncements();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to post announcement.', 'error');
    }
  };

  const handleDelete = async (ann) => {
    if (!window.confirm(`Delete announcement "${ann.title}"?`)) return;
    try {
      await deleteAdminAnnouncement(ann._id);
      showNotice('Announcement deleted.');
      loadAnnouncements();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to delete announcement.', 'error');
    }
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
      pageTitle="Announcements"
      pageSubtitle="Create and manage platform announcements."
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

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn-admin-gold" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="admin-announcements-list">
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <div className="admin-announcement-card" key={ann._id}>
              <div className="admin-announcement-left">
                <div className="admin-announcement-icon">
                  <Megaphone size={18} />
                </div>
                <div className="admin-announcement-content">
                  <h3>{ann.title}</h3>
                  <p>{ann.description}</p>
                </div>
              </div>

              <div className="admin-announcement-right">
                <span className="admin-announcement-date">
                  {formatDate(ann.publishDate || ann.createdAt)}
                </span>
                <span
                  className={`admin-badge ${
                    (ann.status || '').toLowerCase() === 'published'
                      ? 'published'
                      : (ann.status || '').toLowerCase() === 'scheduled'
                      ? 'scheduled'
                      : 'draft'
                  }`}
                >
                  {ann.status || 'Published'}
                </span>
                <button
                  className="admin-action-btn"
                  onClick={() => handleDelete(ann)}
                  title="Delete Announcement"
                >
                  <Trash2 size={14} color="#B91C1C" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D5',
              borderRadius: '10px',
              padding: '28px',
              textAlign: 'center',
              color: '#65758A'
            }}
          >
            No announcements published yet. Click "+ New Announcement" to post one.
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create Announcement</h3>
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
                  <label>Announcement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Expo - Registrations"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details about the announcement..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Projects">Projects</option>
                      <option value="Competitions">Competitions</option>
                      <option value="Academic">Academic</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Target Audience</label>
                    <select
                      value={form.targetAudience}
                      onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    >
                      <option value="All Students">All Students</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Publish Date</label>
                    <input
                      type="date"
                      value={form.publishDate}
                      onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Published">Published</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
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
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

