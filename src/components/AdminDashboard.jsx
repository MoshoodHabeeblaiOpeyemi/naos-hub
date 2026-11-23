import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection, addDoc, getDocs, getDoc, query, orderBy, limit,
  where, writeBatch, doc, updateDoc, deleteDoc, onSnapshot, setDoc,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import ConfirmModal from './ConfirmModal.jsx';
import MentionTextarea from './MentionTextarea.jsx';
import { formatEventDate, formatEventTime } from '../data/events.js';
import { notifyTaggedUsers } from '../utils/notifications.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_KIND_OPTIONS = [
  { value: 'general',  label: 'General'  },
  { value: 'social',   label: 'Social'   },
  { value: 'sports',   label: 'Sports'   },
  { value: 'academic', label: 'Academic' },
];

// Only pro1, pro2, and president are admins — gen_sec removed
const ROLE_OPTIONS = [
  { value: 'member',     label: 'Member',              isExec: false },
  { value: 'president',  label: 'President',           isExec: true  },
  { value: 'vp',         label: 'Vice President',      isExec: true  },
  { value: 'gen_sec',    label: 'General Secretary',   isExec: true  },
  { value: 'fin_sec',    label: 'Financial Secretary', isExec: true  },
  { value: 'pro1',       label: 'PRO I',               isExec: true  },
  { value: 'pro2',       label: 'PRO II',              isExec: true  },
  { value: 'treasurer',  label: 'Treasurer',           isExec: true  },
  { value: 'welfare',    label: 'Welfare Secretary',   isExec: true  },
  { value: 'social_sec', label: 'Social Secretary',    isExec: true  },
];
const EXCLUSIVE_ROLES = ROLE_OPTIONS.filter((r) => r.isExec).map((r) => r.value);

const BLANK_EXEC = { name: '', position: '', level: '', dept: '', photo: '', order: 99 };
const BLANK_CONTACT = { proChatNumber: '', proChatDisplay: '', whatsappChannel: '', email: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TabButton({ id, label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
        active ? 'border-naos-green text-naos-green' : 'border-transparent text-naos-text hover:text-naos-dark'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard({ userProfile }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [message, setMessage]     = useState(null);

  // ── Post state ──
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [taggedUids, setTaggedUids] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [posts, setPosts]       = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  // ── User state ──
  const [users, setUsers]             = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  // ── Event state ──
  const [events, setEvents]         = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [eventForm, setEventForm]   = useState({ title: '', date: '', time: '', location: '', description: '', kind: 'general' });
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);

  // ── Executive state ──
  const [executives, setExecutives]   = useState([]);
  const [fetchingExecs, setFetchingExecs] = useState(false);
  const [execForm, setExecForm]       = useState(BLANK_EXEC);
  const [editingExecId, setEditingExecId] = useState(null); // null = create mode
  const [savingExec, setSavingExec]   = useState(false);
  const [archivingExecId, setArchivingExecId] = useState(null);
  const [confirmArchiveExec, setConfirmArchiveExec] = useState(null);

  // ── Site Settings state ──
  const [contactSettings, setContactSettings] = useState(BLANK_CONTACT);
  const [socials, setSocials]           = useState([]); // [{ key, label, url }]
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const role = (userProfile?.role || 'pro1').toLowerCase();
  const roleLabel = role === 'pro1' ? 'PRO I' : role === 'pro2' ? 'PRO II' : role === 'president' ? 'PRESIDENT' : role.toUpperCase();

  const formatRoleName = (val) => {
    const found = ROLE_OPTIONS.find((r) => r.value === val);
    return found ? found.label : (val || 'Member');
  };

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchRecentPosts = async () => {
    if (!db) return;
    setFetchingPosts(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.warn('Could not fetch posts:', err); }
    finally { setFetchingPosts(false); }
  };

  const fetchUsers = async () => {
    if (!db) return;
    setFetchingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error('Could not fetch users:', err); }
    finally { setFetchingUsers(false); }
  };

  // Live events listener
  useEffect(() => {
    if (!db) return;
    setFetchingEvents(true);
    const unsub = onSnapshot(
      query(collection(db, 'events'), orderBy('date', 'asc')),
      (snap) => { setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setFetchingEvents(false); },
      (err) => { console.warn('[AdminDashboard] Events error:', err.message); setFetchingEvents(false); }
    );
    return () => unsub();
  }, []);

  // Live executives listener
  useEffect(() => {
    if (!db) return;
    setFetchingExecs(true);
    const unsub = onSnapshot(
      query(collection(db, 'executives'), orderBy('order', 'asc')),
      (snap) => { setExecutives(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setFetchingExecs(false); },
      (err) => { console.warn('[AdminDashboard] Executives error:', err.message); setFetchingExecs(false); }
    );
    return () => unsub();
  }, []);

  // Load site settings once
  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'contact')).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setContactSettings({
          proChatNumber:   d.proChatNumber   || '',
          proChatDisplay:  d.proChatDisplay  || '',
          whatsappChannel: d.whatsappChannel || '',
          email:           d.email           || '',
        });
        setSocials(Array.isArray(d.socials) ? d.socials : []);
      }
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => { fetchRecentPosts(); fetchUsers(); }, []);

  // ── Post handlers ───────────────────────────────────────────────────────────

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!db) { setMessage({ type: 'error', text: 'Firestore not configured.' }); return; }
    if (!title.trim() || !body.trim()) { setMessage({ type: 'error', text: 'Title and Body are required.' }); return; }
    if (body.trim().length > 500) { setMessage({ type: 'error', text: 'Post cannot exceed 500 characters.' }); return; }
    setLoading(true);
    try {
      const postTitle = title.trim();
      const docRef = await addDoc(collection(db, 'posts'), {
        title: postTitle,
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        authorUid: auth?.currentUser?.uid || null,
        authorEmail: auth?.currentUser?.email || null,
        authorName: userProfile?.name || auth?.currentUser?.email || 'Executive Officer',
        authorUsername: userProfile?.username || '',
        authorRole: role,
        likes: [],
        taggedUserIds: taggedUids || [],
        createdAt: new Date().toISOString(),
      });

      // Notify tagged users if any
      if (taggedUids && taggedUids.length > 0) {
        await notifyTaggedUsers({
          taggedUids,
          senderUid: auth?.currentUser?.uid,
          senderName: userProfile?.name || 'Executive Officer',
          senderUsername: userProfile?.username || '',
          postId: docRef.id,
          postTitle,
          snippet: body.trim(),
          isComment: false,
        });
      }

      setMessage({ type: 'success', text: 'Broadcast published!' });
      setTitle(''); setBody(''); setImageUrl(''); setTaggedUids([]);
      fetchRecentPosts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish.' });
    } finally { setLoading(false); }
  };

  // ── User role handler ───────────────────────────────────────────────────────

  const handleRoleChange = async (targetUser, newRole) => {
    if (!db || targetUser.role === newRole) return;
    setUpdatingRoleId(targetUser.id);
    setMessage(null);
    try {
      const isExclusive = EXCLUSIVE_ROLES.includes(newRole);
      if (isExclusive) {
        const q = query(collection(db, 'users'), where('role', '==', newRole));
        const qSnap = await getDocs(q);
        const prevDoc = qSnap.docs.find((d) => d.id !== targetUser.id);
        if (prevDoc) {
          const batch = writeBatch(db);
          batch.update(doc(db, 'users', prevDoc.id), { role: 'member' });
          batch.update(doc(db, 'users', targetUser.id), { role: newRole });
          await batch.commit();
          setMessage({ type: 'success', text: `Promoted ${targetUser.name || targetUser.email} to ${formatRoleName(newRole)}. Previous holder demoted to Member.` });
        } else {
          await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
          setMessage({ type: 'success', text: `Assigned ${formatRoleName(newRole)} to ${targetUser.name || targetUser.email}.` });
        }
      } else {
        await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
        setMessage({ type: 'success', text: `Updated role for ${targetUser.name || targetUser.email}.` });
      }
      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role.' });
    } finally { setUpdatingRoleId(null); }
  };

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!db) { setMessage({ type: 'error', text: 'Firestore not configured.' }); return; }
    if (!eventForm.title.trim() || !eventForm.date) { setMessage({ type: 'error', text: 'Title and date are required.' }); return; }
    setSavingEvent(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: eventForm.title.trim(), date: eventForm.date,
        time: eventForm.time || null, location: eventForm.location.trim() || null,
        description: eventForm.description.trim() || null, kind: eventForm.kind || 'general',
        createdAt: new Date().toISOString(), createdBy: auth?.currentUser?.uid || null,
      });
      setMessage({ type: 'success', text: `Event "${eventForm.title.trim()}" published to homepage.` });
      setEventForm({ title: '', date: '', time: '', location: '', description: '', kind: 'general' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save event.' });
    } finally { setSavingEvent(false); }
  };

  const handleDeleteEvent = async () => {
    if (!confirmDeleteEvent || !db) return;
    setDeletingEventId(confirmDeleteEvent.id);
    setConfirmDeleteEvent(null);
    try {
      await deleteDoc(doc(db, 'events', confirmDeleteEvent.id));
      setMessage({ type: 'success', text: `Event "${confirmDeleteEvent.title}" deleted.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete event.' });
    } finally { setDeletingEventId(null); }
  };

  // ── Executive handlers ──────────────────────────────────────────────────────

  const handleExecSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!db) { setMessage({ type: 'error', text: 'Firestore not configured.' }); return; }
    if (!execForm.name.trim() || !execForm.position.trim()) {
      setMessage({ type: 'error', text: 'Name and Position are required.' }); return;
    }
    setSavingExec(true);
    try {
      const payload = {
        name:     execForm.name.trim(),
        position: execForm.position.trim(),
        level:    execForm.level.trim() || null,
        dept:     execForm.dept.trim()  || null,
        photo:    execForm.photo.trim() || null,
        order:    Number(execForm.order) || 99,
        updatedAt: new Date().toISOString(),
      };
      if (editingExecId) {
        await updateDoc(doc(db, 'executives', editingExecId), payload);
        setMessage({ type: 'success', text: `Updated "${execForm.name}".` });
      } else {
        await addDoc(collection(db, 'executives'), { ...payload, createdAt: new Date().toISOString() });
        setMessage({ type: 'success', text: `Added "${execForm.name}" to the executives.` });
      }
      setExecForm(BLANK_EXEC);
      setEditingExecId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save executive.' });
    } finally { setSavingExec(false); }
  };

  const handleArchiveExec = async () => {
    if (!confirmArchiveExec || !db) return;
    setArchivingExecId(confirmArchiveExec.id);
    setConfirmArchiveExec(null);
    try {
      // Copy to past_executives, then delete from executives
      const { id, ...rest } = confirmArchiveExec;
      await addDoc(collection(db, 'past_executives'), { ...rest, archivedAt: new Date().toISOString() });
      await deleteDoc(doc(db, 'executives', id));
      setMessage({ type: 'success', text: `"${confirmArchiveExec.name}" archived to Past Executives.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to archive executive.' });
    } finally { setArchivingExecId(null); }
  };

  // ── Site Settings handlers ──────────────────────────────────────────────────

  const handleAddSocial = () =>
    setSocials((prev) => [...prev, { key: `social_${Date.now()}`, label: '', url: '' }]);

  const handleSocialChange = (idx, field, value) =>
    setSocials((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const handleRemoveSocial = (idx) =>
    setSocials((prev) => prev.filter((_, i) => i !== idx));

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!db) { setMessage({ type: 'error', text: 'Firestore not configured.' }); return; }
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'contact'), {
        proChatNumber:   contactSettings.proChatNumber.trim(),
        proChatDisplay:  contactSettings.proChatDisplay.trim(),
        whatsappChannel: contactSettings.whatsappChannel.trim(),
        email:           contactSettings.email.trim() || null,
        socials: socials.filter((s) => s.label.trim() && s.url.trim()).map((s) => ({
          key:   s.key || s.label.toLowerCase().replace(/\s+/g, '_'),
          label: s.label.trim(),
          url:   s.url.trim(),
        })),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setMessage({ type: 'success', text: 'Contact settings saved. The home page will update immediately.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally { setSavingSettings(false); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (u.name   && u.name.toLowerCase().includes(term))   ||
      (u.email  && u.email.toLowerCase().includes(term))  ||
      (u.matric && u.matric.toLowerCase().includes(term)) ||
      (u.dept   && u.dept.toLowerCase().includes(term))
    );
  });

  const switchTab = (id) => { setActiveTab(id); setMessage(null); };

  // ── Tab definitions ─────────────────────────────────────────────────────────

  const TABS = [
    { id: 'posts',    label: 'Broadcasts',       count: null,          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { id: 'users',    label: `Users (${users.length})`, count: null,  icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'events',   label: `Events (${events.length})`, count: null, icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'execs',    label: `Executives (${executives.length})`, count: null, icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'settings', label: 'Site Settings',     count: null,         icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  // ── Shared field class ───────────────────────────────────────────────────────
  const field = 'w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="py-12 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-naos-gray/40 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-naos-dark">Admin Console</h1>
              <span className="inline-flex items-center rounded-full bg-naos-gold px-3 py-1 text-xs font-bold text-naos-dark shadow-xs">{roleLabel}</span>
            </div>
            <p className="mt-1 text-sm text-naos-text">Executive Console — Manage broadcasts, executives, events, and site settings.</p>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-white border border-naos-gray px-4 py-2 text-sm font-semibold text-naos-dark transition hover:bg-naos-gray/30 shadow-xs sm:w-auto">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-naos-gray/40 mb-6 gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <TabButton key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={switchTab} />
          ))}
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm border flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
          }`}>
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700 ml-4 font-bold" aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* ── Tab 1: Posts ─────────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-naos-dark mb-1">Publish New Post</h2>
                <p className="text-xs text-naos-text mb-6">Post official notices, press releases, or event updates to the member feed.</p>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="post-title" className="block text-xs font-semibold uppercase text-naos-text mb-1">Post Title <span className="text-red-500">*</span></label>
                    <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Official Communiqué" className={field} />
                  </div>
                  <div>
                    <label htmlFor="post-image" className="block text-xs font-semibold uppercase text-naos-text mb-1">Image URL <span className="text-naos-text/50 font-normal lowercase">(optional)</span></label>
                    <input id="post-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={field} />
                  </div>
                  <div>
                    <label htmlFor="post-body" className="block text-xs font-semibold uppercase text-naos-text mb-1">Post Body <span className="text-red-500">*</span></label>
                    <MentionTextarea
                      id="post-body"
                      rows={5}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onTaggedUsersChange={setTaggedUids}
                      maxLength={500}
                      placeholder="Write the broadcast message here... Type @ to tag a member"
                      className={`${field} resize-y`}
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={() => { setTitle(''); setBody(''); setImageUrl(''); }} className="px-4 py-2 text-sm text-naos-text hover:text-naos-dark transition">Clear</button>
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-naos-green px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer">
                      {loading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Publishing…</> : 'Publish Post'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-naos-gray/30 pb-3">
                  <h3 className="font-bold text-naos-dark text-base">Recent Broadcasts</h3>
                  <button type="button" onClick={fetchRecentPosts} disabled={fetchingPosts} className="text-xs text-naos-green font-medium hover:underline cursor-pointer">{fetchingPosts ? 'Refreshing…' : 'Refresh'}</button>
                </div>
                {posts.length > 0 ? (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {posts.map((p) => (
                      <article key={p.id} className="rounded-lg border border-naos-gray/40 p-3 bg-naos-gray/10">
                        <h4 className="font-bold text-sm text-naos-dark line-clamp-2">{p.title}</h4>
                        <p className="mt-1 text-xs text-naos-text line-clamp-3">{p.body}</p>
                        <div className="mt-2 flex justify-between text-[10px] text-naos-text/70">
                          <span className="uppercase font-semibold text-naos-green">{p.authorRole || 'PRO'}</span>
                          <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-naos-text">{fetchingPosts ? 'Loading…' : 'No posts yet.'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Users ─────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 border-b border-naos-gray/30 pb-4">
              <div>
                <h2 className="text-xl font-bold text-naos-dark">User Role Assignment</h2>
                <p className="text-xs text-naos-text mt-0.5">Executive roles are strictly exclusive — only 1 holder per post.</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, matric…" className="w-full border border-naos-gray rounded-md pl-9 pr-3 py-2 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition" />
                <svg className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            {fetchingUsers ? (
              <div className="py-12 flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" /><p className="text-xs text-naos-text">Loading users…</p></div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead><tr className="border-b border-naos-gray/40 bg-naos-gray/20 text-naos-text font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Member</th><th className="py-3 px-3">Matric / Dept</th><th className="py-3 px-3">Current Role</th><th className="py-3 px-3 text-right">Assign Role</th>
                  </tr></thead>
                  <tbody className="divide-y divide-naos-gray/20">
                    {filteredUsers.map((u) => {
                      const userRole = (u.role || 'member').toLowerCase();
                      return (
                        <tr key={u.id} className="hover:bg-naos-gray/10 transition">
                          <td className="py-3 px-3"><span className="font-bold text-naos-dark block">{u.name || 'Unnamed'}</span><span className="text-naos-text/70 text-[11px]">{u.email || u.id}</span></td>
                          <td className="py-3 px-3"><span className="font-semibold text-naos-dark block">{u.matric || 'N/A'}</span><span className="text-naos-text/70 text-[11px] truncate max-w-[140px] block">{u.dept || 'N/A'}</span></td>
                          <td className="py-3 px-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${userRole !== 'member' ? 'bg-naos-gold text-naos-dark border border-yellow-600/20' : 'bg-naos-gray/40 text-naos-text'}`}>{formatRoleName(userRole)}</span></td>
                          <td className="py-3 px-3 text-right">
                            <select value={userRole} disabled={updatingRoleId === u.id} onChange={(e) => handleRoleChange(u, e.target.value)} className="border border-naos-gray rounded-md px-2.5 py-1.5 text-xs text-naos-dark bg-white focus:outline-none focus:ring-2 focus:ring-naos-green disabled:opacity-50 cursor-pointer">
                              {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}{opt.isExec ? ' (Exec)' : ''}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-12 text-center text-xs text-naos-text">{searchQuery ? `No users matching "${searchQuery}".` : 'No users found.'}</p>
            )}
          </div>
        )}

        {/* ── Tab 3: Events ────────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-naos-dark mb-1">Create New Event</h2>
                <p className="text-xs text-naos-text mb-6">Events appear immediately in the Upcoming Events section on the homepage.</p>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="ev-title" className="block text-xs font-semibold uppercase text-naos-text mb-1">Event Title <span className="text-red-500">*</span></label>
                    <input id="ev-title" type="text" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} required placeholder="e.g. NAOS Social Evening" className={field} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ev-date" className="block text-xs font-semibold uppercase text-naos-text mb-1">Date <span className="text-red-500">*</span></label>
                      <input id="ev-date" type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} required className={field} />
                    </div>
                    <div>
                      <label htmlFor="ev-time" className="block text-xs font-semibold uppercase text-naos-text mb-1">Time</label>
                      <input id="ev-time" type="time" value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} className={field} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ev-location" className="block text-xs font-semibold uppercase text-naos-text mb-1">Location</label>
                      <input id="ev-location" type="text" value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Main Auditorium" className={field} />
                    </div>
                    <div>
                      <label htmlFor="ev-kind" className="block text-xs font-semibold uppercase text-naos-text mb-1">Type</label>
                      <select id="ev-kind" value={eventForm.kind} onChange={(e) => setEventForm((p) => ({ ...p, kind: e.target.value }))} className={`${field} bg-white`}>
                        {EVENT_KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ev-desc" className="block text-xs font-semibold uppercase text-naos-text mb-1">Description</label>
                    <textarea id="ev-desc" rows="3" value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief summary…" className={`${field} resize-y`} />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={() => setEventForm({ title: '', date: '', time: '', location: '', description: '', kind: 'general' })} className="px-4 py-2 text-sm text-naos-text hover:text-naos-dark">Clear</button>
                    <button type="submit" disabled={savingEvent} className="inline-flex items-center gap-2 rounded-md bg-naos-green px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer">
                      {savingEvent ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</> : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-naos-gray/30 pb-3">
                  <h3 className="font-bold text-naos-dark text-base">All Events</h3>
                  <span className="text-xs text-naos-text">{events.length} total</span>
                </div>
                {fetchingEvents ? (
                  <div className="py-8 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-naos-green border-t-transparent" /></div>
                ) : events.length === 0 ? (
                  <p className="py-8 text-center text-xs text-naos-text">No events yet.</p>
                ) : (
                  <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {events.map((ev) => (
                      <li key={ev.id} className="rounded-lg border border-naos-gray/40 p-3 bg-naos-gray/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-naos-dark truncate">{ev.title}</p>
                            <p className="text-[11px] text-naos-text mt-0.5">{formatEventDate(ev.date)}{ev.time ? ` · ${formatEventTime(ev.time)}` : ''}</p>
                            {ev.location && <p className="text-[11px] text-naos-text/70 truncate">{ev.location}</p>}
                            <span className="inline-flex mt-1 rounded-full bg-naos-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-naos-green">{ev.kind || 'general'}</span>
                          </div>
                          <button type="button" onClick={() => setConfirmDeleteEvent(ev)} disabled={deletingEventId === ev.id} className="shrink-0 rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 cursor-pointer" aria-label={`Delete ${ev.title}`}>
                            {deletingEventId === ev.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" /> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Executives ────────────────────────────────────────────── */}
        {activeTab === 'execs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-naos-dark mb-1">{editingExecId ? 'Edit Executive' : 'Add Executive'}</h2>
                <p className="text-xs text-naos-text mb-6">Executives appear on the public home page immediately.</p>
                <form onSubmit={handleExecSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={execForm.name} onChange={(e) => setExecForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Adebayo Olumide" className={field} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Position <span className="text-red-500">*</span></label>
                      <input type="text" value={execForm.position} onChange={(e) => setExecForm((p) => ({ ...p, position: e.target.value }))} required placeholder="e.g. President" className={field} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Level</label>
                      <input type="text" value={execForm.level} onChange={(e) => setExecForm((p) => ({ ...p, level: e.target.value }))} placeholder="e.g. 400" className={field} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Department</label>
                      <input type="text" value={execForm.dept} onChange={(e) => setExecForm((p) => ({ ...p, dept: e.target.value }))} placeholder="e.g. Computer Science" className={field} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Photo URL</label>
                      <input type="url" value={execForm.photo} onChange={(e) => setExecForm((p) => ({ ...p, photo: e.target.value }))} placeholder="https://..." className={field} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Display Order</label>
                      <input type="number" value={execForm.order} onChange={(e) => setExecForm((p) => ({ ...p, order: e.target.value }))} min="1" placeholder="1 = first" className={field} />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-3">
                    {editingExecId && (
                      <button type="button" onClick={() => { setExecForm(BLANK_EXEC); setEditingExecId(null); }} className="px-4 py-2 text-sm text-naos-text hover:text-naos-dark transition">Cancel Edit</button>
                    )}
                    <button type="submit" disabled={savingExec} className="inline-flex items-center gap-2 rounded-md bg-naos-green px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer">
                      {savingExec ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</> : editingExecId ? 'Save Changes' : 'Add Executive'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-naos-gray/30 pb-3">
                  <h3 className="font-bold text-naos-dark text-base">Current Executives</h3>
                  <span className="text-xs text-naos-text">{executives.length}</span>
                </div>
                {fetchingExecs ? (
                  <div className="py-8 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-naos-green border-t-transparent" /></div>
                ) : executives.length === 0 ? (
                  <p className="py-8 text-center text-xs text-naos-text">No executives yet.</p>
                ) : (
                  <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {executives.map((ex) => (
                      <li key={ex.id} className="rounded-lg border border-naos-gray/40 p-3 bg-naos-gray/10">
                        <p className="font-bold text-sm text-naos-dark">{ex.name}</p>
                        <p className="text-[11px] text-naos-green font-semibold">{ex.position}</p>
                        {(ex.dept || ex.level) && <p className="text-[11px] text-naos-text/60 truncate">{[ex.dept, ex.level && `${ex.level}L`].filter(Boolean).join(' · ')}</p>}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setExecForm({ name: ex.name, position: ex.position, level: ex.level || '', dept: ex.dept || '', photo: ex.photo || '', order: ex.order ?? 99 }); setEditingExecId(ex.id); setActiveTab('execs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="text-[11px] font-semibold text-naos-green hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-naos-text/30">·</span>
                          <button
                            type="button"
                            onClick={() => setConfirmArchiveExec(ex)}
                            disabled={archivingExecId === ex.id}
                            className="text-[11px] font-semibold text-amber-600 hover:underline cursor-pointer disabled:opacity-40"
                          >
                            Archive
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 5: Site Settings ─────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-naos-dark mb-1">Site Settings — Contact</h2>
            <p className="text-xs text-naos-text mb-6">
              Changes save to Firestore and update the Contact section on the home page immediately.
              Add extra social channels using the "Add Social Link" button below.
            </p>
            {!settingsLoaded ? (
              <div className="py-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" /></div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Core contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-naos-text mb-1">PRO WhatsApp Number (no +)</label>
                    <input type="text" value={contactSettings.proChatNumber} onChange={(e) => setContactSettings((p) => ({ ...p, proChatNumber: e.target.value }))} placeholder="e.g. 2347040717939" className={field} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-naos-text mb-1">PRO Number Display Text</label>
                    <input type="text" value={contactSettings.proChatDisplay} onChange={(e) => setContactSettings((p) => ({ ...p, proChatDisplay: e.target.value }))} placeholder="e.g. +234 704 071 7939" className={field} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-naos-text mb-1">WhatsApp Channel URL</label>
                    <input type="url" value={contactSettings.whatsappChannel} onChange={(e) => setContactSettings((p) => ({ ...p, whatsappChannel: e.target.value }))} placeholder="https://whatsapp.com/channel/..." className={field} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Email Address (optional)</label>
                    <input type="email" value={contactSettings.email} onChange={(e) => setContactSettings((p) => ({ ...p, email: e.target.value }))} placeholder="naos@example.com" className={field} />
                  </div>
                </div>

                {/* Dynamic socials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-naos-dark">Additional Social Links</h3>
                    <button type="button" onClick={handleAddSocial} className="inline-flex items-center gap-1.5 rounded-md bg-naos-green/10 border border-naos-green/30 px-3 py-1.5 text-xs font-semibold text-naos-green hover:bg-naos-green/20 transition cursor-pointer">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Add Social Link
                    </button>
                  </div>
                  {socials.length === 0 ? (
                    <p className="text-xs text-naos-text/60 py-2">No extra social links yet. Click "Add Social Link" to add one — it will appear on the home page contact section.</p>
                  ) : (
                    <div className="space-y-3">
                      {socials.map((s, i) => (
                        <div key={s.key || i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                          <div>
                            {i === 0 && <label className="block text-xs font-semibold uppercase text-naos-text mb-1">Label</label>}
                            <input type="text" value={s.label} onChange={(e) => handleSocialChange(i, 'label', e.target.value)} placeholder="e.g. Instagram" className={field} />
                          </div>
                          <div>
                            {i === 0 && <label className="block text-xs font-semibold uppercase text-naos-text mb-1">URL</label>}
                            <input type="url" value={s.url} onChange={(e) => handleSocialChange(i, 'url', e.target.value)} placeholder="https://..." className={field} />
                          </div>
                          <button type="button" onClick={() => handleRemoveSocial(i)} className="rounded-md p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer" aria-label="Remove">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={savingSettings} className="inline-flex items-center gap-2 rounded-md bg-naos-green px-8 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer">
                    {savingSettings ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</> : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!confirmDeleteEvent}
        title="Delete Event"
        message={`Delete "${confirmDeleteEvent?.title}"? It will be removed from the homepage immediately.`}
        confirmText="Yes, Delete" cancelText="Cancel" isDestructive
        onConfirm={handleDeleteEvent} onCancel={() => setConfirmDeleteEvent(null)}
      />
      <ConfirmModal
        isOpen={!!confirmArchiveExec}
        title="Archive Executive"
        message={`Move "${confirmArchiveExec?.name}" to Past Executives? This cannot be undone from here.`}
        confirmText="Yes, Archive" cancelText="Cancel" isDestructive={false}
        onConfirm={handleArchiveExec} onCancel={() => setConfirmArchiveExec(null)}
      />
    </section>
  );
}
