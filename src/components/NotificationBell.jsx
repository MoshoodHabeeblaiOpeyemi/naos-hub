import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { showPushNotification } from '../utils/fcm';

/**
 * Format relative time (e.g. 5m ago, 2h ago, Yesterday)
 */
function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ currentUserId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const isInitialLoad = useRef(true);
  const navigate = useNavigate();

  // Listen to in-app notifications in real time
  useEffect(() => {
    if (!db || !currentUserId) return;

    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('recipientUid', '==', currentUserId),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Send a push notification when a new unread notification arrives (after initial load)
        if (!isInitialLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (!data.read) {
                showPushNotification(
                  data.senderName ? `${data.senderName} (NAOS Hub)` : 'NAOS Hub',
                  data.message || 'You have a new update in the community.'
                );
              }
            }
          });
        }

        isInitialLoad.current = false;
        setNotifications(items);
      },
      (err) => {
        console.warn('[NotificationBell] Listener error:', err.message);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notif) => {
    if (!notif.read && db) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }
    setIsOpen(false);
    navigate('/feed');
  };

  const handleMarkAllAsRead = async () => {
    if (!db || unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const renderIcon = (type) => {
    if (type === 'tag') {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0 font-bold text-xs">
          @
        </span>
      );
    }
    if (type === 'like') {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
      );
    }
    // Comment or default
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-naos-green/10 text-naos-green shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-naos-gray/40 bg-white shadow-2xl z-50 overflow-hidden text-naos-dark animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-naos-gray/30 px-4 py-3 bg-naos-gray/10">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-naos-dark">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-naos-green/10 px-2 py-0.5 text-[10px] font-bold text-naos-green">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-naos-green hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-naos-gray/20">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`flex items-start gap-3 p-3.5 transition cursor-pointer ${
                    !notif.read ? 'bg-naos-green/5 hover:bg-naos-green/10' : 'hover:bg-naos-gray/10'
                  }`}
                >
                  {renderIcon(notif.type)}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-snug ${!notif.read ? 'font-semibold text-naos-dark' : 'text-naos-text'}`}>
                      {notif.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-naos-text/60">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-naos-green shrink-0 mt-1" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center px-4">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-naos-gray/30 text-naos-text">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-naos-dark">No notifications yet</p>
                <p className="text-[11px] text-naos-text/60 mt-0.5">
                  You’ll be notified when members tag you, like your posts, or comment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
