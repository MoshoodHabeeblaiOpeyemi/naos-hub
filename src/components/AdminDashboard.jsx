import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function AdminDashboard({ userProfile }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const role = userProfile?.role || 'pro1';
  const roleLabel = role.toLowerCase() === 'pro1' ? 'PRO I' : role.toLowerCase() === 'pro2' ? 'PRO II' : role.toUpperCase();

  const fetchRecentPosts = async () => {
    if (!db) return;
    setFetchingPosts(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(items);
    } catch (err) {
      console.warn('Could not fetch posts (collection may be empty):', err);
    } finally {
      setFetchingPosts(false);
    }
  };

  useEffect(() => {
    fetchRecentPosts();
  }, []);

  const handleSubmit = async (e) => {
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

  return (
    <section className="py-12 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Admin Header Bar */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-naos-gray/40 pb-6 sm:flex-row sm:items-center">
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
              Public Relations Officer (PRO) Portal — Create announcements and association releases.
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
              className="text-gray-500 hover:text-gray-700 ml-4"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

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
                Post official notices, press releases, or event updates for NAOS members.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  Recent Posts
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
                  {fetchingPosts ? 'Loading posts...' : 'No posts in collection yet. Use the form to publish your first announcement.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
