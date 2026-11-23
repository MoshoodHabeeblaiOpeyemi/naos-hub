import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Textarea with @username mention autocomplete and character counting.
 * Tracks tagged user UIDs via both autocomplete selection and regex matching.
 */
export default function MentionTextarea({
  id,
  value = '',
  onChange,
  onTaggedUsersChange,
  placeholder = 'What’s on your mind? Use @ to tag members...',
  maxLength = 500,
  rows = 4,
  className = '',
  disabled = false,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all users with usernames on mount for fast autocomplete search
  useEffect(() => {
    if (!db) return;
    let isMounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (isMounted) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            uid: d.id,
            name: d.data().name || '',
            username: (d.data().username || '').toLowerCase(),
            role: d.data().role || 'member',
          })).filter((u) => u.username);
          setAllUsers(list);
        }
      } catch (err) {
        console.warn('[MentionTextarea] Failed to load users for mention autocomplete:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter matching users based on @query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return allUsers
      .filter((u) => u.username.includes(q) || (u.name && u.name.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [allUsers, searchQuery]);

  // Sync tagged UIDs whenever value changes (supports autocomplete + manual @typing)
  useEffect(() => {
    if (!onTaggedUsersChange) return;
    const matches = value.match(/@([a-z0-9_]+)/gi) || [];
    const usernamesInText = new Set(matches.map((m) => m.substring(1).toLowerCase()));

    const tagged = allUsers.filter((u) => usernamesInText.has(u.username));
    onTaggedUsersChange(tagged.map((u) => u.id));
  }, [value, allUsers, onTaggedUsersChange]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(e);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-z0-9_]*)$/i);

    if (match) {
      setSearchQuery(match[1]);
      setMentionPosition({
        start: cursorPos - match[0].length,
        end: cursorPos,
      });
      setSelectedIndex(0);
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  const insertMention = (user) => {
    if (!user || !user.username) return;
    const before = value.slice(0, mentionPosition.start);
    const after = value.slice(mentionPosition.end);
    const mentionText = `@${user.username} `;
    const newText = before + mentionText + after;

    if (newText.length > maxLength) return;

    // Trigger synthetic change event for parent
    const event = { target: { value: newText } };
    onChange(event);
    setDropdownOpen(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursor = before.length + mentionText.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (!dropdownOpen || filteredUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />

      {/* Autocomplete Dropdown */}
      {dropdownOpen && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border border-naos-gray/50 bg-white p-1.5 shadow-xl animate-in fade-in duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-naos-text/50">
            Mention Member
          </div>
          {filteredUsers.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                insertMention(u);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs transition cursor-pointer ${
                idx === selectedIndex
                  ? 'bg-naos-green text-white font-medium'
                  : 'hover:bg-naos-gray/20 text-naos-dark'
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                  idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-naos-green/10 text-naos-green'
                }`}
              >
                {(u.name || u.username).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold truncate block">@{u.username}</span>
                {u.name && (
                  <span
                    className={`text-[10px] truncate block ${
                      idx === selectedIndex ? 'text-white/80' : 'text-naos-text/60'
                    }`}
                  >
                    {u.name}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Character Count Bar */}
      <div className="mt-1 flex justify-between items-center text-[11px] text-naos-text/60 px-1">
        <span>Type <strong className="text-naos-green">@</strong> to mention a member</span>
        <span className={value.length >= maxLength ? 'text-red-500 font-bold' : ''}>
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
