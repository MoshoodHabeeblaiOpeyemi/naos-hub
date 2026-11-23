import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates an in-app notification doc in the `notifications` collection.
 * Does not notify the user if they performed the action themselves.
 */
export async function createNotification({
  recipientUid,
  senderUid,
  senderName,
  senderUsername = '',
  type, // 'tag' | 'like' | 'comment'
  postId = null,
  postTitle = '',
  message = '',
}) {
  if (!db || !recipientUid || recipientUid === senderUid) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      recipientUid,
      senderUid: senderUid || null,
      senderName: senderName || 'A member',
      senderUsername: senderUsername || '',
      type,
      postId,
      postTitle: postTitle || '',
      message: message || `${senderName} interacted with your post`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Notifications] Failed to create notification:', err.message);
  }
}

/**
 * Convenience helper to notify an array of tagged user UIDs.
 */
export async function notifyTaggedUsers({
  taggedUids = [],
  senderUid,
  senderName,
  senderUsername = '',
  postId = null,
  postTitle = '',
  snippet = '',
  isComment = false,
}) {
  if (!Array.isArray(taggedUids) || taggedUids.length === 0) return;

  const uniqueUids = [...new Set(taggedUids)].filter((uid) => uid && uid !== senderUid);
  const actionText = isComment ? 'mentioned you in a comment' : 'mentioned you in a post';
  const cleanSnippet = (postTitle || snippet || '').trim().slice(0, 60);
  const displayMsg = cleanSnippet
    ? `${senderName} ${actionText}: "${cleanSnippet}${cleanSnippet.length >= 60 ? '…' : ''}"`
    : `${senderName} ${actionText}`;

  for (const uid of uniqueUids) {
    await createNotification({
      recipientUid: uid,
      senderUid,
      senderName,
      senderUsername,
      type: 'tag',
      postId,
      postTitle,
      message: displayMsg,
    });
  }
}
