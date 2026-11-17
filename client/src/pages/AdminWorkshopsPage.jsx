import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  getAdminWorkshops,
  createAdminWorkshop,
  updateAdminWorkshop,
  deleteAdminWorkshop
} from '../services/adminService';

export default function AdminWorkshopsPage() {
  const [searchParams] = useSearchParams();
  const [workshops, setWorkshops] = useState([]);
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Technical',
    date: '2026-11-20',
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    mode: 'Offline',
    venue: 'Seminar Hall',
    capacity: 150
  });

  const loadWorkshops = async () => {
    try {
      const res = await getAdminWorkshops();
      setWorkshops(res.workshops || []);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || err.message || 'Unable to load workshops.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadWorkshops();
    if (searchParams.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4000);
  };

  const handleOpenCreate = () => {
    setEditingWorkshop(null);
    setForm({
      title: '',
      subtitle: '',
      description: '',
      category: 'Technical',
      date: '2026-11-20',
      startTime: '10:00 AM',
      endTime: '1:00 PM',
      mode: 'Offline',
      venue: 'Seminar Hall',
      capacity: 150
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ws) => {
    setEditingWorkshop(ws);
    setForm({
      title: ws.title || '',
      subtitle: ws.subtitle || '',
      description: ws.description || '',
      category: ws.category || 'Technical',
      date: ws.date || '',
      startTime: ws.startTime || '10:00 AM',
      endTime: ws.endTime || '1:00 PM',
      mode: ws.mode || 'Offline',
      venue: ws.venue || '',
      capacity: ws.capacity || 100
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorkshop) {
        await updateAdminWorkshop(editingWorkshop._id, form);
        showNotice('Workshop updated successfully.');
      } else {
        await createAdminWorkshop(form);
        showNotice('Workshop created successfully.');
      }
      setIsModalOpen(false);
      loadWorkshops();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to save workshop.', 'error');
    }
  };

  const handleDelete = async (ws) => {
    if (!window.confirm(`Delete workshop "${ws.title}"?`)) return;
    try {
      await deleteAdminWorkshop(ws._id);
      showNotice('Workshop removed.');
      loadWorkshops();
    } catch (err) {
      showNotice(err.response?.data?.message || err.message || 'Failed to delete workshop.', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nov 20, 2026';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout
      pageTitle="Workshops Management"
      pageSubtitle="Create, schedule and manage student workshops."
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
        <button className="btn-admin-gold" onClick={handleOpenCreate}>
          <Plus size={15} /> Create Workshop
        </button>
      </div>

      {/* Workshops Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Workshop Title</th>
              <th>Date &amp; Time</th>
              <th>Mode / Venue</th>
              <th>Registrations</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workshops.length > 0 ? (
              workshops.map((ws) => (
                <tr key={ws._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#EDE9FE',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={ws.coverImage || '/college-building.png'}
                          alt={ws.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#10243E' }}>
                          {ws.title}
                        </strong>
                        <small style={{ display: 'block', fontSize: '11px', color: '#65758A' }}>
                          {ws.subtitle || ws.category || 'Hands-on session'}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{formatDate(ws.date)}</div>
                    <small style={{ fontSize: '11px', color: '#65758A' }}>
                      {ws.startTime} - {ws.endTime}
                    </small>
                  </td>
                  <td>{ws.venue || (ws.mode === 'Online' ? 'Online' : 'Seminar Hall')}</td>
                  <td style={{ fontWeight: 600 }}>
                    {ws.registeredCount || 0} / {ws.capacity || 100}
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${
                        (ws.status || '').toLowerCase() === 'closed' ? 'closed' : 'open'
                      }`}
                    >
                      {ws.status || 'Open'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="admin-action-btn"
                        onClick={() => handleOpenEdit(ws)}
                        title="Edit Workshop"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="admin-action-btn"
                        onClick={() => handleDelete(ws)}
                        title="Delete Workshop"
                      >
                        <Trash2 size={14} color="#B91C1C" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: '#65758A' }}>
                  No workshops scheduled yet. Click "+ Create Workshop" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Workshop Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingWorkshop ? 'Edit Workshop' : 'Create Workshop'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Workshop Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI in Real World"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Subtitle / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Hands-on AI applications"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Cloud & DevOps">Cloud &amp; DevOps</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Start Time</label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>End Time</label>
                    <input
                      type="text"
                      placeholder="1:00 PM"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Mode</label>
                    <select
                      value={form.mode}
                      onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    >
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Capacity</label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Venue / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. Seminar Hall or Google Meet Link"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
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
                  {editingWorkshop ? 'Save Changes' : 'Create Workshop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

