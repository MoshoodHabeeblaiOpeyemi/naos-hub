import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Helper to format role names into displayable badges.
 * Returns null for standard 'member' role.
 */
export const formatRoleBadge = (role) => {
  if (!role || role.toLowerCase() === 'member') return null;
  const lower = role.toLowerCase();
  if (lower === 'pro1') return 'PRO I';
  if (lower === 'pro2') return 'PRO II';
  if (lower === 'president') return 'PRESIDENT';
  if (lower === 'vp') return 'VICE PRESIDENT';
  if (lower === 'gen_sec') return 'GEN. SEC.';
  if (lower === 'fin_sec') return 'FIN. SEC.';
  if (lower === 'treasurer') return 'TREASURER';
  if (lower === 'welfare') return 'WELFARE SEC.';
  if (lower === 'social_sec') return 'SOCIAL SEC.';
  return role.toUpperCase();
};

function RoleBadge({ role }) {
  const label = formatRoleBadge(role);
  if (!label) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-naos-gold px-2 py-0.5 text-[10px] font-bold text-naos-dark shadow-xs border border-yellow-600/20">
      {label}
    </span>
  );
}

function PostCard({ post, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const currentUserId = auth?.currentUser?.uid;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const hasLiked = currentUserId ? likes.includes(currentUserId) : false;

  // Listen to comments sub-collection for this post
  useEffect(() => {
    if (!db || !post.id || !showComments) return;

    const commentsRef = collection(db, 'posts', post.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComments(items);
    }, (err) => {
      console.warn('Failed to load comments:', err);
    });

    return () => unsubscribe();
  }, [post.id, showComments]);

  const handleToggleLike = async () => {
    if (!auth?.currentUser || !db || isLiking) return;

    setIsLiking(true);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId),
        });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !auth?.currentUser || !db || submittingComment) return;

    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        authorUid: auth.currentUser.uid,
        authorName: userProfile?.name || auth.currentUser.email?.split('@')[0] || 'Member',
        authorRole: userProfile?.role || 'member',
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <article className="rounded-xl border border-naos-gray/50 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
      {/* Header: Author & Role Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-naos-gray/30 pb-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 w-9 rounded-full bg-naos-green/10 text-naos-green flex items-center justify-center font-bold text-sm">
            {(post.authorName || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-naos-dark">
                {post.authorName || 'NAOS Member'}
              </span>
              <RoleBadge role={post.authorRole} />
            </div>
            <span className="text-[11px] text-naos-text/60">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-naos-dark mb-2">
        {post.title}
      </h3>

      {/* Body */}
      <p className="text-sm text-naos-text leading-relaxed whitespace-pre-line mb-4">
        {post.body}
      </p>

      {/* Optional Image */}
      {post.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border border-naos-gray/40 bg-gray-50 max-h-96 flex items-center justify-center">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-auto object-cover max-h-96"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Interactivity Bar: Like and Comment Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-naos-gray/30 text-sm">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking || !auth?.currentUser}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
              hasLiked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'text-naos-text hover:bg-naos-gray/20 hover:text-naos-dark'
            }`}
            aria-label={hasLiked ? 'Unlike post' : 'Like post'}
          >
            <svg
              className={`h-4 w-4 ${hasLiked ? 'fill-red-600 text-red-600' : 'fill-none'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likes.length}</span>
            <span className="hidden sm:inline">{likes.length === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-naos-text hover:bg-naos-gray/20 hover:text-naos-dark transition cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{showComments ? 'Hide Comments' : 'Comments'}</span>
          </button>
        </div>
      </div>

      {/* Comments Section Drawer */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-naos-gray/30 bg-naos-gray/10 rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-naos-dark mb-3">
            Comments ({comments.length})
          </h4>

          {/* Comment List */}
          {comments.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md bg-white p-3 border border-naos-gray/30 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-naos-dark">
                        {comment.authorName || 'Member'}
                      </span>
                      <RoleBadge role={comment.authorRole} />
                    </div>
                    <span className="text-[10px] text-naos-text/60">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-naos-text leading-relaxed whitespace-pre-line">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-naos-text/70 mb-4 italic">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              required
              className="flex-1 rounded-md border border-naos-gray bg-white px-3 py-2 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="rounded-md bg-naos-green px-4 py-2 text-xs font-bold text-white transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submittingComment ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Feed({ userProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to all posts ordered by createdAt descending
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPosts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching feed posts:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-10 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Feed Header */}
        <div className="mb-8 border-b border-naos-gray/40 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-naos-gold" />
            <h1 className="text-2xl sm:text-3xl font-bold text-naos-dark">
              Community Feed
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-naos-text">
            Official announcements, press releases, and discussions for NAOS Unilorin members.
          </p>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
            <p className="text-xs text-naos-text">Loading community posts...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} userProfile={userProfile} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-naos-gray/40 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-naos-green/10 text-naos-green flex items-center justify-center text-xl">
              📢
            </div>
            <h2 className="text-base font-bold text-naos-dark">
              No Community Posts Yet
            </h2>
            <p className="mt-1 text-xs text-naos-text max-w-sm mx-auto">
              Announcements and updates will appear here once the Public Relations Officers publish them.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
