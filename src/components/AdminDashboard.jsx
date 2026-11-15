import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import ConfirmModal from './ConfirmModal.jsx';
import { formatEventDate, formatEventTime } from '../data/events.js';

const EVENT_KIND_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'social', label: 'Social' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic' },
];

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member', isExec: false },
  { value: 'president', label: 'President', isExec: true },
  { value: 'vp', label: 'Vice President', isExec: true },
  { value: 'gen_sec', label: 'General Secretary', isExec: true },
  { value: 'fin_sec', label: 'Financial Secretary', isExec: true },
  { value: 'pro1', label: 'PRO I', isExec: true },
  { value: 'pro2', label: 'PRO II', isExec: true },
  { value: 'treasurer', label: 'Treasurer', isExec: true },
  { value: 'welfare', label: 'Welfare Secretary', isExec: true },
  { value: 'social_sec', label: 'Social Secretary', isExec: true },
];

const EXCLUSIVE_ROLES = ROLE_OPTIONS.filter((r) => r.isExec).map((r) => r.value);

export default function AdminDashboard({ userProfile }) {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'users' | 'events'

  // Post form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  // User management state
  const [users, setUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  // Event Manager state
  const [events, setEvents] = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', date: '', time: '', location: '', description: '', kind: 'general',
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null); // event object to delete

  const role = userProfile?.role || 'pro1';
  const roleLabel =
    role.toLowerCase() === 'pro1'
      ? 'PRO I'
      : role.toLowerCase() === 'pro2'
      ? 'PRO II'
      : role.toUpperCase();

  const formatRoleName = (val) => {
    const found = ROLE_OPTIONS.find((r) => r.value === val);
    return found ? found.label : (val || 'Member');
  };

  const fetchRecentPosts = async () => {
    if (!db) return;
    setFetchingPosts(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(items);
    } catch (err) {
      console.warn('Could not fetch posts:', err);
    } finally {
      setFetchingPosts(false);
    }
  };

  const fetchUsers = async () => {
    if (!db) return;
    setFetchingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(items);
    } catch (err) {
      console.error('Could not fetch users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  // Live events listener
  useEffect(() => {
    if (!db) return;
    setFetchingEvents(true);
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFetchingEvents(false);
      },
      (err) => {
        console.warn('[AdminDashboard] Events listener error:', err.message);
        setFetchingEvents(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    fetchRecentPosts();
    fetchUsers();
  }, []);

  const handleEventFormChange = (field, value) => {
    setEventForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!db) {
      setMessage({ type: 'error', text: 'Firestore is not configured.' });
      return;
    }
    if (!eventForm.title.trim() || !eventForm.date) {
      setMessage({ type: 'error', text: 'Event title and date are required.' });
      return;
    }

    setSavingEvent(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: eventForm.title.trim(),
        date: eventForm.date,
        time: eventForm.time || null,
        location: eventForm.location.trim() || null,
        description: eventForm.description.trim() || null,
        kind: eventForm.kind || 'general',
        createdAt: new Date().toISOString(),
        createdBy: auth?.currentUser?.uid || null,
      });
      setMessage({ type: 'success', text: `Event "${eventForm.title.trim()}" created and is now live on the homepage.` });
      setEventForm({ title: '', date: '', time: '', location: '', description: '', kind: 'general' });
    } catch (err) {
      console.error('Failed to save event:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save event.' });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirmDeleteEvent || !db) return;
    setDeletingEventId(confirmDeleteEvent.id);
    setConfirmDeleteEvent(null);
    try {
      await deleteDoc(doc(db, 'events', confirmDeleteEvent.id));
      setMessage({ type: 'success', text: `Event "${confirmDeleteEvent.title}" deleted.` });
    } catch (err) {
      console.error('Failed to delete event:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete event.' });
    } finally {
      setDeletingEventId(null);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!db) {
      setMessage({ type: 'error', text: 'Firebase Firestore is not configured.' });
      return;
    }

    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Title and Body are required fields.' });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        authorUid: auth?.currentUser?.uid || null,
        authorEmail: auth?.currentUser?.email || null,
        authorName: userProfile?.name || auth?.currentUser?.email || 'PRO Officer',
        authorRole: role,
        createdAt: new Date().toISOString(),
      });

      setMessage({ type: 'success', text: 'Broadcast published successfully to the posts collection!' });
      setTitle('');
      setBody('');
      setImageUrl('');
      fetchRecentPosts();
    } catch (err) {
      console.error('Failed to create post:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to create post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!db || targetUser.role === newRole) return;
    setUpdatingRoleId(targetUser.id);
    setMessage(null);

    try {
      const isExclusive = EXCLUSIVE_ROLES.includes(newRole);

      if (isExclusive) {
        // Query to check if anyone else currently holds this executive role
        const q = query(collection(db, 'users'), where('role', '==', newRole));
        const querySnap = await getDocs(q);
        const previousHolderDoc = querySnap.docs.find((d) => d.id !== targetUser.id);

        if (previousHolderDoc) {
          const prevData = previousHolderDoc.data();
          const batch = writeBatch(db);

          // Atomically demote previous holder to 'member'
          batch.update(doc(db, 'users', previousHolderDoc.id), { role: 'member' });
          // Atomically promote target user to new exclusive role
          batch.update(doc(db, 'users', targetUser.id), { role: newRole });

          await batch.commit();

          setMessage({
            type: 'success',
            text: `Promoted "${targetUser.name || targetUser.email}" to ${formatRoleName(newRole)}. Previous holder ("${
              prevData.name || prevData.email || 'Previous User'
            }") was automatically demoted to Member.`,
          });
        } else {
          // No current holder, single update
          await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
          setMessage({
            type: 'success',
            text: `Assigned role "${formatRoleName(newRole)}" to ${targetUser.name || targetUser.email}.`,
          });
        }
      } else {
        // Demote to member
        await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
        setMessage({
          type: 'success',
          text: `Updated role for ${targetUser.name || targetUser.email} to ${formatRoleName(newRole)}.`,
        });
      }

      await fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update user role.',
      });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.matric && u.matric.toLowerCase().includes(term)) ||
      (u.dept && u.dept.toLowerCase().includes(term))
    );
  });

  return (
    <section className="py-12 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Admin Header Bar */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-naos-gray/40 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-naos-dark">
                Admin Console
              </h1>
              <span className="inline-flex items-center rounded-full bg-naos-gold px-3 py-1 text-xs font-bold text-naos-dark shadow-xs">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-naos-text">
              Public Relations Officer (PRO) Portal — Manage association broadcasts and executive roles.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-white border border-naos-gray px-4 py-2 text-sm font-semibold text-naos-dark transition hover:bg-naos-gray/30 shadow-xs sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-naos-gray/40 mb-6 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('posts');
              setMessage(null);
            }}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'border-naos-green text-naos-green'
                : 'border-transparent text-naos-text hover:text-naos-dark'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Broadcast Announcements
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setMessage(null);
            }}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-naos-green text-naos-green'
                : 'border-transparent text-naos-text hover:text-naos-dark'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            User Management ({users.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('events');
              setMessage(null);
            }}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'events'
                ? 'border-naos-green text-naos-green'
                : 'border-transparent text-naos-text hover:text-naos-dark'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Event Manager ({events.length})
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm border flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-red-100 text-red-800 border-red-200'
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700 ml-4 font-bold"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Posts Management */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Post Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-naos-dark mb-1 flex items-center gap-2">
                  <svg className="h-5 w-5 text-naos-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Publish New Post
                </h2>
                <p className="text-xs text-naos-text mb-6">
                  Post official notices, press releases, or event updates to the member feed.
                </p>

                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="post-title" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                      Post Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="post-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. Official Communiqué: NAOS General Congress 2026"
                      className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="post-image" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                      Image URL <span className="text-naos-text/60 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="post-image"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                    />
                    {imageUrl && (
                      <div className="mt-2 relative rounded-md border border-naos-gray overflow-hidden max-h-48 bg-gray-50 flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="object-cover max-h-48 w-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="post-body" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                      Post Body / Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="post-body"
                      rows="6"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                      placeholder="Write the full broadcast message here..."
                      className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition resize-y"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle('');
                        setBody('');
                        setImageUrl('');
                      }}
                      className="px-4 py-2 text-sm text-naos-text hover:text-naos-dark transition"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-md bg-naos-green px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Publish Post
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Published Posts Feed Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-naos-gray/30 pb-3">
                  <h3 className="font-bold text-naos-dark text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-naos-green" />
                    Recent Broadcasts
                  </h3>
                  <button
                    type="button"
                    onClick={fetchRecentPosts}
                    disabled={fetchingPosts}
                    className="text-xs text-naos-green font-medium hover:underline cursor-pointer"
                  >
                    {fetchingPosts ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {posts.length > 0 ? (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {posts.map((post) => (
                      <article
                        key={post.id}
                        className="rounded-lg border border-naos-gray/40 p-3 hover:border-naos-green/60 transition bg-naos-gray/10"
                      >
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full h-24 object-cover rounded mb-2 bg-gray-100"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <h4 className="font-bold text-sm text-naos-dark line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="mt-1 text-xs text-naos-text line-clamp-3 leading-relaxed">
                          {post.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-naos-text/70">
                          <span className="uppercase font-semibold text-naos-green">
                            {post.authorRole || 'PRO'}
                          </span>
                          <span>
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-naos-text">
                    {fetchingPosts ? 'Loading posts...' : 'No posts in collection yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Role Management */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-naos-gray/30 pb-4">
              <div>
                <h2 className="text-xl font-bold text-naos-dark flex items-center gap-2">
                  <svg className="h-5 w-5 text-naos-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  User Role Assignment
                </h2>
                <p className="text-xs text-naos-text mt-0.5">
                  Assign executive posts. Executive posts are strictly exclusive (only 1 holder per post).
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, matric..."
                  className="w-full border border-naos-gray rounded-md pl-9 pr-3 py-2 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                />
                <svg
                  className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {fetchingUsers ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
                <p className="text-xs text-naos-text">Loading registered users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-naos-gray/40 bg-naos-gray/20 text-naos-text font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3">Matric / Dept</th>
                      <th className="py-3 px-3">Current Role</th>
                      <th className="py-3 px-3 text-right">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-naos-gray/20">
                    {filteredUsers.map((u) => {
                      const userRole = (u.role || 'member').toLowerCase();
                      const isUpdating = updatingRoleId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-naos-gray/10 transition">
                          <td className="py-3 px-3">
                            <span className="font-bold text-naos-dark block">{u.name || 'Unnamed Member'}</span>
                            <span className="text-naos-text/70 text-[11px] block">{u.email || u.id}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-naos-dark block">{u.matric || 'N/A'}</span>
                            <span className="text-naos-text/70 text-[11px] block truncate max-w-[140px]" title={u.dept}>
                              {u.dept || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                userRole !== 'member'
                                  ? 'bg-naos-gold text-naos-dark border border-yellow-600/20'
                                  : 'bg-naos-gray/40 text-naos-text'
                              }`}
                            >
                              {formatRoleName(userRole)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <select
                              value={userRole}
                              disabled={isUpdating}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="border border-naos-gray rounded-md px-2.5 py-1.5 text-xs text-naos-dark bg-white focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition disabled:opacity-50 cursor-pointer"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} {opt.isExec ? '(Executive)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-naos-text">
                {searchQuery ? `No users matching "${searchQuery}".` : 'No registered users found.'}
              </div>
            )}
          </div>
        )}
        {/* Tab 3: Event Manager */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Create Event Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-naos-dark mb-1 flex items-center gap-2">
                  <svg className="h-5 w-5 text-naos-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Create New Event
                </h2>
                <p className="text-xs text-naos-text mb-6">
                  Events you create here appear immediately in the Upcoming Events section on the homepage.
                </p>

                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="ev-title" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ev-title"
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => handleEventFormChange('title', e.target.value)}
                      required
                      placeholder="e.g. NAOS Social Evening 2027"
                      className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ev-date" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ev-date"
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => handleEventFormChange('date', e.target.value)}
                        required
                        className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-time" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                        Time <span className="text-naos-text/60 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        id="ev-time"
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => handleEventFormChange('time', e.target.value)}
                        className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ev-location" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                        Location <span className="text-naos-text/60 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        id="ev-location"
                        type="text"
                        value={eventForm.location}
                        onChange={(e) => handleEventFormChange('location', e.target.value)}
                        placeholder="e.g. Main Auditorium, Unilorin"
                        className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-kind" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                        Event Type
                      </label>
                      <select
                        id="ev-kind"
                        value={eventForm.kind}
                        onChange={(e) => handleEventFormChange('kind', e.target.value)}
                        className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark bg-white focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                      >
                        {EVENT_KIND_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ev-description" className="block text-xs font-semibold uppercase text-naos-text mb-1">
                      Description <span className="text-naos-text/60 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      id="ev-description"
                      rows="4"
                      value={eventForm.description}
                      onChange={(e) => handleEventFormChange('description', e.target.value)}
                      placeholder="Brief summary of the event..."
                      className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition resize-y"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEventForm({ title: '', date: '', time: '', location: '', description: '', kind: 'general' })}
                      className="px-4 py-2 text-sm text-naos-text hover:text-naos-dark transition"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={savingEvent}
                      className="inline-flex items-center gap-2 rounded-md bg-naos-green px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer"
                    >
                      {savingEvent ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Create Event
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing Events List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-naos-gray/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-naos-gray/30 pb-3">
                  <h3 className="font-bold text-naos-dark text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-naos-green" />
                    All Events
                  </h3>
                  <span className="text-xs text-naos-text">{events.length} total</span>
                </div>

                {fetchingEvents ? (
                  <div className="py-8 flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
                  </div>
                ) : events.length === 0 ? (
                  <p className="py-8 text-center text-xs text-naos-text">
                    No events yet. Create one using the form.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {events.map((ev) => (
                      <li
                        key={ev.id}
                        className="rounded-lg border border-naos-gray/40 p-3 bg-naos-gray/10 hover:border-naos-green/40 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-naos-dark truncate">{ev.title}</p>
                            <p className="text-[11px] text-naos-text mt-0.5">
                              {formatEventDate(ev.date)}{ev.time ? ` · ${formatEventTime(ev.time)}` : ''}
                            </p>
                            {ev.location && (
                              <p className="text-[11px] text-naos-text/70 truncate">{ev.location}</p>
                            )}
                            <span className="inline-flex mt-1.5 rounded-full bg-naos-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-naos-green">
                              {ev.kind || 'general'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteEvent(ev)}
                            disabled={deletingEventId === ev.id}
                            aria-label={`Delete event: ${ev.title}`}
                            className="shrink-0 rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 cursor-pointer"
                          >
                            {deletingEventId === ev.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
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
      </div>

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteEvent}
        title="Delete Event"
        message={`Delete "${confirmDeleteEvent?.title}"? This will remove it from the homepage immediately.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteEvent}
        onCancel={() => setConfirmDeleteEvent(null)}
      />
    </section>
  );
}
