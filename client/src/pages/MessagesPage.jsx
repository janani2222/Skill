import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, CheckCheck, FileText, MessageCircle, Paperclip, Plus, Search, Send, Users, X } from 'lucide-react';
import Phase2Layout from '../components/Phase2Layout';
import { discoverStudents, getConversation, getConversations, sendConversationAttachment, sendConversationMessage, startDirectConversation } from '../services/phase2Service';
import { useAuth } from '../context/AuthContext';

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S';
const timeLabel = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const preview = (message) => message?.message || (message?.attachment ? '📎 Attachment' : 'Start a conversation');

function Avatar({ src, name, className = '' }) {
  return <span className={`messages-avatar ${className}`}>{src ? <img src={src} alt="" /> : initials(name)}</span>;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [thread, setThread] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [search, setSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const me = String(user?._id || user?.id || '');
  const selected = useMemo(() => conversations.find((item) => String(item._id) === String(selectedId)), [conversations, selectedId]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await getConversations();
      const items = response.conversations || [];
      setConversations(items);
      setConversationsLoaded(true);
      return items;
    } catch (err) { setError(err.message || 'Unable to load conversations.'); setConversationsLoaded(true); return []; }
  }, []);

  useEffect(() => { loadConversations(); const timer = setInterval(loadConversations, 12000); return () => clearInterval(timer); }, [loadConversations]);

  useEffect(() => {
    const projectId = searchParams.get('project');
    const conversationId = searchParams.get('conversation');
    const studentId = searchParams.get('to');
    if (!conversationsLoaded) return;
    if (conversationId && conversations.length) {
      const conversation = conversations.find((item) => String(item._id) === String(conversationId));
      if (conversation) setSelectedId(String(conversation._id));
      else setError('That conversation is no longer available.');
      setSearchParams({}, { replace: true });
    } else if (projectId && conversations.length) {
      const group = conversations.find((item) => item.type === 'group' && String(item.project?._id) === String(projectId));
      if (group) { setSelectedId(String(group._id)); setSearchParams({}, { replace: true }); }
    } else if (studentId) {
      const existing = conversations.find((item) => item.type === 'direct' && item.members?.some((member) => String(member._id) === String(studentId)));
      if (existing) { setSelectedId(String(existing._id)); setSearchParams({}, { replace: true }); }
      else if (!isStarting) { setIsStarting(true); setSearchParams({}, { replace: true }); startDirectConversation(studentId).then((result) => { setSelectedId(String(result.conversation._id)); return loadConversations(); }).catch((err) => setError(err.message)).finally(() => setIsStarting(false)); }
    }
  }, [searchParams, conversations, conversationsLoaded, isStarting, loadConversations, setSearchParams]);

  useEffect(() => {
    if (!selectedId) { setThread(null); return undefined; }
    let active = true;
    const refresh = async () => {
      try { const response = await getConversation(selectedId); if (active) setThread(response); }
      catch (err) { if (active) setError(err.message || 'Unable to open this conversation.'); }
    };
    refresh(); const timer = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [selectedId]);

  useEffect(() => {
    if (!isStarting) return undefined;
    const query = contactSearch.trim();
    if (!query) { setContacts([]); setContactsLoading(false); setContactsError(''); return undefined; }
    let active = true;
    setContactsLoading(true);
    setContactsError('');
    const timer = setTimeout(() => discoverStudents({ search: query })
      .then((response) => {
        if (active) setContacts((response.students || []).filter((item) => item.user?._id));
      })
      .catch((err) => {
        if (active) { setContacts([]); setContactsError(err.message || 'Could not search students.'); }
      })
      .finally(() => { if (active) setContactsLoading(false); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [contactSearch, isStarting, me]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [thread?.messages?.length, selectedId]);

  const startConversation = async (studentId) => {
    setBusy(true); setError('');
    try { const response = await startDirectConversation(studentId); setIsStarting(false); setContactSearch(''); setSelectedId(String(response.conversation._id)); await loadConversations(); }
    catch (err) { setError(err.message || 'Unable to start conversation.'); }
    finally { setBusy(false); }
  };

  const send = async (event) => {
    event.preventDefault(); if ((!message.trim() && !file) || !selectedId || busy) return;
    setBusy(true); setError('');
    try {
      if (file) { const form = new FormData(); form.append('message', message.trim()); form.append('file', file); await sendConversationAttachment(selectedId, form); }
      else await sendConversationMessage(selectedId, message.trim());
      setMessage(''); setFile(null);
      const fresh = await getConversation(selectedId); setThread(fresh); await loadConversations();
    } catch (err) { setError(err.message || 'Message could not be sent.'); }
    finally { setBusy(false); }
  };

  const visibleConversations = conversations.filter((item) => `${item.title} ${item.project?.title || ''} ${item.members?.map((member) => member.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const recipient = selected?.type === 'direct' ? selected.members?.find((member) => String(member._id) !== me) : null;

  return <Phase2Layout><main className="dashboard-content messages-page">
    <div className="messages-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>Messages</h1><p>Keep in touch with classmates and your project teams.</p></div><button className="btn-gold messages-new-button" onClick={() => { setIsStarting((value) => !value); setSelectedId(''); setError(''); }}><Plus size={17}/>{isStarting ? 'Close new chat' : 'New chat'}</button></div>
    {error && <div className="phase2-notice messages-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={15}/></button></div>}
    <section className={`messages-workspace ${selectedId ? 'has-selection' : ''}`}>
      <aside className={`messages-inbox ${selectedId ? 'mobile-hidden' : ''}`}>
        <div className="messages-inbox-title"><div><h2>Chats</h2><span>{conversations.length} conversations</span></div><MessageCircle size={21}/></div>
        <label className="messages-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" /></label>
        {isStarting && <div className="messages-contact-picker"><strong>Start a conversation</strong><label className="messages-search"><Search size={16}/><input autoFocus value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Find a student by name" /></label>{contactsLoading && <p className="messages-empty-small" role="status">Searching students…</p>}{!contactsLoading && contactsError && <p className="messages-empty-small" role="alert">{contactsError}</p>}{!contactsLoading && !contactsError && contactSearch.trim() && contacts.length === 0 && <p className="messages-empty-small">No students found.</p>}{contacts.map((item) => { const isSelf = String(item.user._id) === me; return <button className="messages-contact" key={item.user._id} onClick={() => !isSelf && startConversation(item.user._id)} disabled={busy || isSelf} title={isSelf ? 'This is your account' : `Message ${item.user.name}`}><Avatar src={item.profile?.avatar} name={item.user.name}/><span><strong>{item.user.name}{isSelf ? ' (You)' : ''}</strong><small>{[item.user.department, item.user.year].filter(Boolean).join(' · ') || (isSelf ? 'Your account' : 'SkillBridge student')}</small></span>{!isSelf && <ArrowUpRight size={16}/>}</button>; })}</div>}
        <div className="messages-conversation-list">{visibleConversations.map((item) => <button key={item._id} onClick={() => setSelectedId(String(item._id))} className={`messages-conversation ${String(item._id) === String(selectedId) ? 'active' : ''}`}>
          <Avatar src={item.avatar} name={item.title} className={item.type === 'group' ? 'group' : ''}/><span className="messages-conversation-copy"><span className="messages-conversation-line"><strong>{item.title}</strong><time>{timeLabel(item.updatedAt)}</time></span><span className="messages-conversation-line"><small>{item.type === 'group' ? <><Users size={12}/> {preview(item.lastMessage)}</> : preview(item.lastMessage)}</small>{item.unreadCount > 0 && <b className="messages-unread-count">{item.unreadCount}</b>}</span></span>
        </button>)}{visibleConversations.length === 0 && !isStarting && <div className="messages-empty"><MessageCircle size={28}/><strong>No chats yet</strong><span>Start a conversation or open a project group.</span></div>}</div>
      </aside>

      <section className={`messages-thread ${selectedId ? 'mobile-visible' : ''}`}>
        {selected ? <>
          <header className="messages-thread-header"><button className="messages-back" onClick={() => setSelectedId('')} aria-label="Back to chats"><ArrowLeft size={19}/></button><Avatar src={recipient?.avatar || selected.avatar} name={recipient?.name || selected.title} className={selected.type === 'group' ? 'group' : ''}/><div className="messages-thread-identity"><strong>{recipient?.name || selected.title}</strong><small>{selected.type === 'group' ? `${selected.members?.length || 0} members · Project group` : [recipient?.department, recipient?.year].filter(Boolean).join(' · ') || 'SkillBridge student'}</small></div>{selected.type === 'group' && selected.project && <Link className="messages-project-link" to={`/projects/${selected.project._id}/team`}>Team dashboard <ArrowUpRight size={15}/></Link>}</header>
          <div className="messages-thread-body">{thread?.messages?.length ? thread.messages.map((item) => {
            const mine = String(item.sender?._id) === me;
            return <div className={`messages-message-row ${mine ? 'mine' : ''}`} key={item._id}>{!mine && selected.type === 'group' && <Avatar src={item.sender?.avatar} name={item.sender?.name} className="messages-small-avatar"/>}<article className={`messages-bubble ${mine ? 'mine' : ''}`}>{!mine && selected.type === 'group' && <strong className="messages-sender-name">{item.sender?.name || 'Student'}</strong>}{item.message && <p>{item.message}</p>}{item.attachment && (item.attachment.mimeType?.startsWith('image/') ? <a href={item.attachment.filePath} target="_blank" rel="noreferrer"><img className="messages-image-attachment" src={item.attachment.filePath} alt={item.attachment.fileName}/></a> : <a className="messages-file-attachment" href={item.attachment.filePath} download><FileText size={17}/><span>{item.attachment.fileName}</span></a>)}<small>{timeLabel(item.createdAt)} {mine && <span title={item.readBy?.length > 1 ? 'Read' : 'Sent'}>{item.readBy?.length > 1 ? <CheckCheck size={14}/> : <Check size={14}/>}</span>}</small></article></div>;
          }) : <div className="messages-thread-empty"><Avatar src={recipient?.avatar || selected.avatar} name={recipient?.name || selected.title} className={selected.type === 'group' ? 'group' : ''}/><strong>{recipient?.name || selected.title}</strong><span>{selected.type === 'group' ? 'This is the beginning of your project group conversation.' : 'This is the beginning of your conversation.'}</span></div>}<div ref={bottomRef}/></div>
          <form className="messages-composer" onSubmit={send}>{file && <div className="messages-file-chip"><Paperclip size={14}/>{file.name}<button type="button" onClick={() => setFile(null)} aria-label="Remove attachment"><X size={14}/></button></div>}<label className="messages-attach" title="Attach a file"><Paperclip size={20}/><input type="file" accept="image/*,.pdf,.doc,.docx,.zip,.txt,.csv" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Message ${selected.type === 'group' ? 'the group' : recipient?.name || ''}`} aria-label="Message"/><button className="messages-send" disabled={busy || (!message.trim() && !file)} aria-label="Send message"><Send size={18}/></button></form>
        </> : <div className="messages-welcome"><div className="messages-welcome-icon"><MessageCircle size={35}/></div><h2>Your conversations, all in one place</h2><p>Choose a chat from your inbox, start a message with a student, or open a project group chat.</p><button className="btn-gold" onClick={() => setIsStarting(true)}><Plus size={16}/> Start a conversation</button></div>}
      </section>
    </section>
  </main></Phase2Layout>;
}
