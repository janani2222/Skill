import React, { useEffect, useState } from 'react';
import {
  Shield,
  KeyRound,
  History,
  Lock,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminAuditLogs, changeAdminPassword } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [notice, setNotice] = useState({ text: '', type: '' });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const loadLogs = async () => {
    try {
      const res = await getAdminAuditLogs();
      setLogs(res.logs || []);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const showNotice = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 4500);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showNotice('Password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      await changeAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showNotice('Administrator password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      loadLogs();
    } catch (err) {
      showNotice(
        err.response?.data?.message || err.message || 'Failed to change password.',
        'error'
      );
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
  };

  return (
    <AdminLayout
      pageTitle="Admin Settings"
      pageSubtitle="Manage administrator account, security sessions and audit trail."
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Account Profile Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#D5A32D" /> Administrator Profile
            </h2>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <strong style={{ color: '#65758A', fontSize: '11.5px', display: 'block' }}>Administrator Name</strong>
              <span style={{ fontWeight: 600, color: '#10243E' }}>{user?.name || 'SkillBridge Administrator'}</span>
            </div>
            <div>
              <strong style={{ color: '#65758A', fontSize: '11.5px', display: 'block' }}>Email Address</strong>
              <span style={{ fontWeight: 600, color: '#10243E' }}>{user?.email || 'admin@skillbridge.edu'}</span>
            </div>
            <div>
              <strong style={{ color: '#65758A', fontSize: '11.5px', display: 'block' }}>Assigned System Role</strong>
              <span className="admin-badge active" style={{ marginTop: '2px' }}>Super Administrator</span>
            </div>
            <div>
              <strong style={{ color: '#65758A', fontSize: '11.5px', display: 'block' }}>Session Security</strong>
              <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                <CheckCircle2 size={13} /> Active JWT Session (Authenticated)
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={18} color="#D5A32D" /> Change Password
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="admin-form-group">
              <label>Current Password *</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="admin-form-group">
              <label>New Password (min 8 chars) *</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn-admin-gold" style={{ marginTop: '6px' }}>
              <Lock size={13} /> Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#D5A32D" /> System Audit Logs
          </h2>
          <span style={{ fontSize: '12px', color: '#65758A' }}>
            Recorded administrative actions
          </span>
        </div>

        <div className="admin-table-container" style={{ margin: 0, boxShadow: 'none' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin Actor</th>
                <th>Action Performed</th>
                <th>Target Resource</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong style={{ color: '#10243E' }}>{log.actorName}</strong>
                    </td>
                    <td>{log.action}</td>
                    <td>{log.target || 'Platform'}</td>
                    <td>{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#65758A' }}>
                    No audit log records available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

