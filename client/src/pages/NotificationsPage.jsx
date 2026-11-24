import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Phase2Layout from '../components/Phase2Layout';
import {
  getNotifications,
  markNotificationsRead,
  markNotificationRead,
  respondToTeamInvitation,
} from '../services/phase2Service';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [busyInvitationId, setBusyInvitationId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const response = await getNotifications();
      setItems(response.notifications || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.');
    }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      await markNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (requestError) {
      setError(requestError.message || 'Unable to mark notifications as read.');
    }
  };

  const markRead = async (item) => {
    if (item.isRead) return;
    try {
      await markNotificationRead(item._id);
      setItems((current) => current.map((notification) => notification._id === item._id
        ? { ...notification, isRead: true }
        : notification));
    } catch (requestError) {
      setError(requestError.message || 'Unable to mark notification as read.');
    }
  };

  const respondToInvitation = async (item, status) => {
    setBusyInvitationId(item.invitationId);
    setError('');
    setNotice('');
    try {
      await respondToTeamInvitation(item.invitationId, status);
      setItems((current) => current.map((notification) => notification._id === item._id
        ? { ...notification, invitationStatus: status, isRead: true }
        : notification));
      setNotice(status === 'Accepted' ? 'Team invitation accepted.' : 'Team invitation rejected.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to respond to this invitation.');
    } finally {
      setBusyInvitationId('');
    }
  };

  const destination = (item) => item.conversation
    ? `/messages?conversation=${item.conversation}`
    : item.project
      ? item.type === 'chat'
        ? `/messages?project=${item.project}`
        : `/projects/${item.project}${['task_assigned', 'task_status', 'task_completed', 'task_file', 'task_deadline', 'milestone', 'progress', 'status', 'membership_removed'].includes(item.type) ? '/team' : ''}${item.task ? `?task=${item.task}` : ''}`
      : '/notifications';

  return <Phase2Layout>
    <main className="dashboard-content phase2-page">
      <div className="page-heading">
        <div><span className="eyebrow">STAY UPDATED</span><h1>Notifications</h1><p>Collaboration activity from your projects.</p></div>
        <button className="btn-outline-gold" onClick={markAllRead}><CheckCheck size={16}/> Mark all as read</button>
      </div>
      {error && <div className="phase2-notice error" role="alert">{error}</div>}
      {notice && <div className="phase2-notice success" role="status">{notice}</div>}
      <section className="phase2-card notification-list">
        {items.length ? items.map((item) => {
          const isTeamInvitation = item.type === 'team_invitation' && item.invitationId;
          const invitationPending = isTeamInvitation && item.invitationStatus === 'Pending';
          return <article className={`notification-row ${item.isRead ? '' : 'unread'}`} key={item._id}>
            <Link to={destination(item)} onClick={() => markRead(item)} className="notification-content">
              <div className="notification-avatar">{item.sender?.avatar ? <img src={item.sender.avatar} alt=""/> : <Bell size={17}/>}</div>
              <div>
                <strong>{item.sender?.name && <>{item.sender.name} · </>}{item.projectTitle && <>{item.projectTitle}: </>}{item.message}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
            </Link>
            {invitationPending ? <div className="notification-actions">
              <button type="button" className="btn-gold" disabled={busyInvitationId === item.invitationId} onClick={() => respondToInvitation(item, 'Accepted')}>
                {busyInvitationId === item.invitationId ? 'Saving…' : 'Accept'}
              </button>
              <button type="button" className="btn-outline-danger" disabled={busyInvitationId === item.invitationId} onClick={() => respondToInvitation(item, 'Rejected')}>Reject</button>
            </div> : isTeamInvitation && item.invitationStatus && <span className="notification-invitation-status">{item.invitationStatus === 'Unavailable' ? 'Invitation unavailable' : `Invitation ${item.invitationStatus.toLowerCase()}`}</span>}
          </article>;
        }) : <div className="empty-state">No notifications yet.</div>}
      </section>
    </main>
  </Phase2Layout>;
}
