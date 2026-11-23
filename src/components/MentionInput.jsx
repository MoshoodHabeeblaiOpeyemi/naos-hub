import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Single-line input with @username mention autocomplete.
 */
export default function MentionInput({
  id,
  value = '',
  onChange,
  onTaggedUsersChange,
  placeholder = 'Write a comment (use @ to tag)...',
  maxLength = 280,
  className = '',
  disabled = false,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });

  const inputRef = useRef(null);

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
          })).filter((u) => u.username);
          setAllUsers(list);
        }
      } catch (err) {
        console.warn('[MentionInput] Failed to load users:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return allUsers
      .filter((u) => u.username.includes(q) || (u.name && u.name.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [allUsers, searchQuery]);

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

    const event = { target: { value: newText } };
    onChange(event);
    setDropdownOpen(false);

    if (inputRef.current) {
      inputRef.current.focus();
      const newCursor = before.length + mentionText.length;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursor, newCursor);
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />

      {dropdownOpen && filteredUsers.length > 0 && (
        <div className="absolute z-30 left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-naos-gray/50 bg-white p-1 shadow-lg">
          {filteredUsers.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(u);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs transition cursor-pointer ${
                idx === selectedIndex ? 'bg-naos-green text-white' : 'hover:bg-naos-gray/20 text-naos-dark'
              }`}
            >
              <span className="font-bold">@{u.username}</span>
              {u.name && <span className="text-[10px] opacity-75 truncate">({u.name})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
