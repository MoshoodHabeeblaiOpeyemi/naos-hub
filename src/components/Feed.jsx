import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import MentionTextarea from "./MentionTextarea.jsx";
import MentionInput from "./MentionInput.jsx";
import {
  createNotification,
  notifyTaggedUsers,
} from "../utils/notifications.js";

// Roles allowed to delete ANY post (authors can always delete their own).
// Add 'president' here if you want them to moderate too.
const MODERATOR_ROLES = ["pro1", "pro2"];

const MAX_POLL_OPTIONS = 4;
const MIN_POLL_OPTIONS = 2;

/**
 * Helper to format role names into displayable badges.
 * Returns null for standard 'member' role.
 */
const formatRoleBadge = (role) => {
  if (!role || role.toLowerCase() === "member") return null;
  const lower = role.toLowerCase();
  if (lower === "pro1") return "PRO I";
  if (lower === "pro2") return "PRO II";
  if (lower === "president") return "PRESIDENT";
  if (lower === "vp") return "VICE PRESIDENT";
  if (lower === "gen_sec") return "GEN. SEC.";
  if (lower === "fin_sec") return "FIN. SEC.";
  if (lower === "treasurer") return "TREASURER";
  if (lower === "welfare") return "WELFARE SEC.";
  if (lower === "social_sec") return "SOCIAL SEC.";
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

/**
 * Parses text and highlights @mentions
 */
function formatMentions(text = "") {
  if (!text) return "";
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={idx}
          className="font-semibold text-naos-green hover:underline"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Tab button classes. Built with plain string concatenation
 * (no multi-line template literals) so it can't break again.
 */
const TAB_BASE =
  "flex-1 px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 ";
const TAB_ACTIVE = "border-naos-green text-naos-green font-semibold";
const TAB_INACTIVE = "border-transparent text-naos-text hover:text-naos-green";
const tabClass = (isActive) =>
  TAB_BASE + (isActive ? TAB_ACTIVE : TAB_INACTIVE);

/**
 * Create Post Card — Available to all verified members
 */
function CreatePostCard({ userProfile }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [taggedUids, setTaggedUids] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const currentUserId = auth?.currentUser?.uid;

  const cleanPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

  const canSubmit =
    !submitting &&
    (activeTab === "text"
      ? body.trim().length > 0
      : activeTab === "image"
        ? imageUrl.trim().length > 0
        : pollQuestion.trim().length > 0 &&
          cleanPollOptions.length >= MIN_POLL_OPTIONS);

  const updatePollOption = (idx, value) => {
    setPollOptions((prev) => prev.map((opt, i) => (i === idx ? value : opt)));
  };

  const addPollOption = () => {
    setPollOptions((prev) =>
      prev.length < MAX_POLL_OPTIONS ? [...prev, ""] : prev,
    );
  };

  const removePollOption = (idx) => {
    setPollOptions((prev) =>
      prev.length > MIN_POLL_OPTIONS ? prev.filter((_, i) => i !== idx) : prev,
    );
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setImageUrl("");
    setTaggedUids([]);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!db || !currentUserId) {
      setErrorMsg("Please sign in to publish a post.");
      return;
    }

    // Tab-specific validation
    if (activeTab === "text") {
      if (!body.trim()) {
        setErrorMsg("Please enter your post content.");
        return;
      }
    } else if (activeTab === "image") {
      if (!imageUrl.trim()) {
        setErrorMsg("Please add an image URL.");
        return;
      }
    } else if (activeTab === "poll") {
      if (!pollQuestion.trim()) {
        setErrorMsg("Please enter a poll question.");
        return;
      }
      if (cleanPollOptions.length < MIN_POLL_OPTIONS) {
        setErrorMsg("Please provide at least 2 options for the poll.");
        return;
      }
    }

    if (body.trim().length > 500) {
      setErrorMsg("Posts cannot exceed 500 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const postTitle =
        title.trim() ||
        (activeTab === "poll" ? pollQuestion.trim() : "Community Post");

      const postData = {
        title: postTitle,
        body: body.trim(),
        imageUrl: activeTab === "image" ? imageUrl.trim() : null,
        authorUid: currentUserId,
        authorName:
          userProfile?.name ||
          auth.currentUser.email?.split("@")[0] ||
          "Member",
        authorUsername: userProfile?.username || "",
        authorRole: userProfile?.role || "member",
        likes: [],
        taggedUserIds: taggedUids || [],
        createdAt: new Date().toISOString(),
      };

      if (activeTab === "poll") {
        postData.pollQuestion = pollQuestion.trim();
        postData.pollOptions = cleanPollOptions;
        postData.pollVotes = {}; // { [uid]: optionIndex }
      }

      const docRef = await addDoc(collection(db, "posts"), postData);

      // Notify all tagged users
      if (taggedUids && taggedUids.length > 0) {
        await notifyTaggedUsers({
          taggedUids,
          senderUid: currentUserId,
          senderName: userProfile?.name || "A member",
          senderUsername: userProfile?.username || "",
          postId: docRef.id,
          postTitle,
          snippet: body.trim(),
          isComment: false,
        });
      }

      resetForm();
      setSuccessMsg("Your post has been shared with the community!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to create post:", err);
      setErrorMsg(err.message || "Failed to publish post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-naos-gray/50 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-naos-green/10 text-naos-green flex items-center justify-center font-bold text-sm">
          {(userProfile?.name || "M").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-naos-dark">
              {userProfile?.name || "You"}
            </span>
            {userProfile?.username && (
              <span className="text-xs text-naos-green font-semibold">
                @{userProfile.username}
              </span>
            )}
            <RoleBadge role={userProfile?.role} />
          </div>
          <span className="text-[11px] text-naos-text/60">
            Share an update with verified members
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-naos-gray/30 mb-4">
        <button
          type="button"
          className={tabClass(activeTab === "text")}
          onClick={() => setActiveTab("text")}
        >
          Text
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "image")}
          onClick={() => setActiveTab("image")}
        >
          Image
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "poll")}
          onClick={() => setActiveTab("poll")}
        >
          Poll
        </button>
      </div>

      {errorMsg && (
        <div className="mb-3 rounded-md bg-red-100 p-2.5 text-xs text-red-800 border border-red-200">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-md bg-green-100 p-2.5 text-xs text-green-800 border border-green-200">
          {successMsg}
        </div>
      )}

      <form onSubmit={handlePostSubmit} className="space-y-3">
        {/* Optional Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post Title (optional)"
            className="w-full border border-naos-gray rounded-md px-3 py-2 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
          />
        </div>

        {/* Poll question (poll tab only) */}
        {activeTab === "poll" && (
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            maxLength={150}
            className="w-full border border-naos-gray rounded-md px-3 py-2 text-sm font-medium text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
          />
        )}

        {/* Post Body with Mentions Autocomplete & 500 Char limit */}
        <MentionTextarea
          id="feed-post-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onTaggedUsersChange={setTaggedUids}
          maxLength={500}
          rows={3}
          placeholder={
            activeTab === "poll"
              ? "Add some context (optional)... Type @ to tag someone!"
              : "Share news, ask questions, or update members... Type @ to tag someone!"
          }
          className="w-full border border-naos-gray rounded-md px-3.5 py-2.5 text-sm text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition resize-y"
        />

        {/* Image tab: URL + preview */}
        {activeTab === "image" && (
          <div className="space-y-2 pt-1">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (e.g. https://...)"
              className="w-full border border-naos-gray rounded-md px-3 py-1.5 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
            />
            {imageUrl && (
              <div className="rounded-md overflow-hidden border border-naos-gray/30 max-h-40 bg-gray-50 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-h-40 w-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = "";
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Poll tab: options */}
        {activeTab === "poll" && (
          <div className="space-y-2 pt-1">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updatePollOption(idx, e.target.value)}
                  placeholder={"Option " + (idx + 1)}
                  maxLength={80}
                  className="flex-1 border border-naos-gray rounded-md px-3 py-1.5 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
                />
                {pollOptions.length > MIN_POLL_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removePollOption(idx)}
                    className="text-xs text-naos-text/60 hover:text-red-600 transition px-2 py-1 cursor-pointer"
                    aria-label={"Remove option " + (idx + 1)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < MAX_POLL_OPTIONS && (
              <button
                type="button"
                onClick={addPollOption}
                className="text-xs font-medium text-naos-green hover:underline cursor-pointer"
              >
                + Add option
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-naos-gray/20">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-naos-green px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting…
              </>
            ) : (
              "Post Update"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentTaggedUids, setCommentTaggedUids] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserId = auth?.currentUser?.uid;
  const userRole = (userProfile?.role || "member").toLowerCase();
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const hasLiked = currentUserId ? likes.includes(currentUserId) : false;

  const canDelete =
    Boolean(currentUserId) &&
    (post.authorUid === currentUserId || MODERATOR_ROLES.includes(userRole));

  // Poll data
  const pollOptions = Array.isArray(post.pollOptions) ? post.pollOptions : [];
  const pollVotes =
    post.pollVotes && typeof post.pollVotes === "object" ? post.pollVotes : {};
  const hasPoll = pollOptions.length > 0;
  const myVote = currentUserId ? pollVotes[currentUserId] : undefined;
  const hasVoted = myVote !== undefined;
  const totalVotes = Object.keys(pollVotes).length;

  // Listen to comments sub-collection for this post
  useEffect(() => {
    if (!db || !post.id || !showComments) return;

    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setComments(items);
      },
      (err) => {
        console.warn("Failed to load comments:", err);
      },
    );

    return () => unsubscribe();
  }, [post.id, showComments]);

  const handleToggleLike = async () => {
    if (!currentUserId || !db || isLiking) return;

    setIsLiking(true);
    const postRef = doc(db, "posts", post.id);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId),
        });

        // Create in-app notification for the post author
        if (post.authorUid && post.authorUid !== currentUserId) {
          await createNotification({
            recipientUid: post.authorUid,
            senderUid: currentUserId,
            senderName: userProfile?.name || "A member",
            senderUsername: userProfile?.username || "",
            type: "like",
            postId: post.id,
            postTitle: post.title || "post",
            message:
              (userProfile?.name || "A member") +
              ' liked your post "' +
              (post.title || "post") +
              '".',
          });
        }
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleVote = async (optionIdx) => {
    if (!currentUserId || !db || isVoting || hasVoted) return;

    setIsVoting(true);
    try {
      await updateDoc(doc(db, "posts", post.id), {
        ["pollVotes." + currentUserId]: optionIdx,
      });
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!db || !canDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", post.id));
      // The onSnapshot listener in <Feed /> removes the card automatically.
    } catch (err) {
      console.error("Failed to delete post:", err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !currentUserId || !db || submittingComment) return;

    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, "posts", post.id, "comments");
      await addDoc(commentsRef, {
        text,
        authorUid: currentUserId,
        authorName:
          userProfile?.name ||
          auth.currentUser.email?.split("@")[0] ||
          "Member",
        authorUsername: userProfile?.username || "",
        authorRole: userProfile?.role || "member",
        taggedUserIds: commentTaggedUids || [],
        createdAt: new Date().toISOString(),
      });

      // 1. Notify post author if not the commenter
      if (post.authorUid && post.authorUid !== currentUserId) {
        const preview = text.length > 45 ? text.slice(0, 45) + "…" : text;
        await createNotification({
          recipientUid: post.authorUid,
          senderUid: currentUserId,
          senderName: userProfile?.name || "A member",
          senderUsername: userProfile?.username || "",
          type: "comment",
          postId: post.id,
          postTitle: post.title || "post",
          message:
            (userProfile?.name || "A member") +
            ' commented on your post: "' +
            preview +
            '"',
        });
      }

      // 2. Notify any users tagged in the comment
      if (commentTaggedUids && commentTaggedUids.length > 0) {
        await notifyTaggedUsers({
          taggedUids: commentTaggedUids,
          senderUid: currentUserId,
          senderName: userProfile?.name || "A member",
          senderUsername: userProfile?.username || "",
          postId: post.id,
          postTitle: post.title || "",
          snippet: text,
          isComment: true,
        });
      }

      setNewComment("");
      setCommentTaggedUids([]);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <article className="rounded-xl border border-naos-gray/50 bg-white p-5 sm:p-6 shadow-sm transition hover:shadow-md">
      {/* Header: Author & Role Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-naos-gray/30 pb-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 w-9 rounded-full bg-naos-green/10 text-naos-green flex items-center justify-center font-bold text-sm">
            {(post.authorName || "M").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-naos-dark">
                {post.authorName || "NAOS Member"}
              </span>
              {post.authorUsername && (
                <span className="text-xs text-naos-green font-medium">
                  @{post.authorUsername}
                </span>
              )}
              <RoleBadge role={post.authorRole} />
            </div>
            <span className="text-[11px] text-naos-text/60">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-lg font-bold text-naos-dark mb-2">{post.title}</h3>
      )}

      {/* Body with @mentions highlighting */}
      {post.body && (
        <p className="text-sm text-naos-text leading-relaxed whitespace-pre-line mb-4">
          {formatMentions(post.body)}
        </p>
      )}

      {/* Optional Image */}
      {post.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border border-naos-gray/40 bg-gray-50 max-h-96 flex items-center justify-center">
          <img
            src={post.imageUrl}
            alt={post.title || "Post image"}
            className="w-full h-auto object-cover max-h-96"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Optional Poll */}
      {hasPoll && (
        <div className="mb-4 rounded-lg border border-naos-gray/40 bg-naos-gray/10 p-4">
          {post.pollQuestion && (
            <p className="text-sm font-semibold text-naos-dark mb-3">
              {post.pollQuestion}
            </p>
          )}
          <div className="space-y-2">
            {pollOptions.map((option, idx) => {
              const count = Object.values(pollVotes).filter(
                (v) => v === idx,
              ).length;
              const pct =
                totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMine = myVote === idx;

              if (!hasVoted) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVote(idx)}
                    disabled={isVoting || !currentUserId}
                    className="w-full text-left rounded-md border border-naos-gray bg-white px-3 py-2 text-xs font-medium text-naos-dark hover:border-naos-green hover:text-naos-green transition cursor-pointer disabled:opacity-50"
                  >
                    {option}
                  </button>
                );
              }

              return (
                <div
                  key={idx}
                  className={
                    "relative overflow-hidden rounded-md border bg-white px-3 py-2 text-xs " +
                    (isMine ? "border-naos-green" : "border-naos-gray/40")
                  }
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-naos-green/15"
                    style={{ width: pct + "%" }}
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <span
                      className={
                        isMine
                          ? "font-bold text-naos-green"
                          : "font-medium text-naos-dark"
                      }
                    >
                      {option}
                      {isMine ? " ✓" : ""}
                    </span>
                    <span className="text-naos-text/70">
                      {pct}% ({count})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-naos-text/60">
            {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
            {!hasVoted && currentUserId ? " · Vote to see results" : ""}
          </p>
        </div>
      )}

      {/* Interactivity Bar: Like, Delete, and Comment Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-naos-gray/30 text-sm">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking || !currentUserId}
            className={
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer " +
              (hasLiked
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-naos-text hover:bg-naos-gray/20 hover:text-naos-dark")
            }
            aria-label={hasLiked ? "Unlike post" : "Like post"}
          >
            <svg
              className={
                "h-4 w-4 " +
                (hasLiked ? "fill-red-600 text-red-600" : "fill-none")
              }
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
            <span className="hidden sm:inline">
              {likes.length === 1 ? "Like" : "Likes"}
            </span>
          </button>

          {/* Comment Toggle Button */}
          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-naos-text hover:bg-naos-gray/20 hover:text-naos-dark transition cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{showComments ? "Hide Comments" : "Comments"}</span>
            {showComments && (
              <span className="text-[11px] opacity-75">
                ({comments.length})
              </span>
            )}
          </button>
        </div>

        {/* Delete Post Button — author or moderators */}
        {canDelete && !showDeleteConfirm && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
            aria-label="Delete post"
          >
            Delete
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {canDelete && showDeleteConfirm && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <span className="text-xs font-medium text-red-800">
            Delete this post permanently?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="rounded-md px-3 py-1 text-xs font-medium text-naos-text hover:bg-white transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      )}

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
                        {comment.authorName || "Member"}
                      </span>
                      {comment.authorUsername && (
                        <span className="text-[11px] text-naos-green font-medium">
                          @{comment.authorUsername}
                        </span>
                      )}
                      <RoleBadge role={comment.authorRole} />
                    </div>
                    <span className="text-[10px] text-naos-text/60">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-naos-text leading-relaxed whitespace-pre-line">
                    {formatMentions(comment.text)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-naos-text/70 mb-4 italic">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}

          {/* Add Comment Form with Mention Autocomplete */}
          <form onSubmit={handleAddComment} className="flex gap-2 items-start">
            <MentionInput
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onTaggedUsersChange={setCommentTaggedUids}
              placeholder="Write a comment (use @ to tag members)..."
              maxLength={280}
              className="w-full rounded-md border border-naos-gray bg-white px-3 py-2 text-xs text-naos-dark focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="rounded-md bg-naos-green px-4 py-2 text-xs font-bold text-white transition hover:bg-naos-dark disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
            >
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Feed({ userProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(db));

  // Subscribe to all posts ordered by createdAt descending
  useEffect(() => {
    if (!db) return;

    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

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
        console.error("Error fetching feed posts:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-10 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Feed Header */}
        <div className="mb-6 border-b border-naos-gray/40 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-naos-gold" />
            <h1 className="text-2xl sm:text-3xl font-bold text-naos-dark">
              Community Feed
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-naos-text">
            Official announcements, press releases, and discussions for NAOS
            Unilorin members.
          </p>
        </div>

        {/* Create Post Section — Available to all verified members */}
        <CreatePostCard userProfile={userProfile} />

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
              Be the first to share an update with the NAOS community!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
