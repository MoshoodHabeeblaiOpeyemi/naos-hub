import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import SectionHeading from './SectionHeading.jsx';
import { site } from '../data/site.js';

/** Render two initials from a full name string. */
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/**
 * Executives section.
 * Fetches the current executives from Firestore `executives` collection,
 * ordered by a numeric `order` field (lowest first).
 * Falls back gracefully when Firestore is unavailable or the collection
 * is empty — shows the placeholder message rather than a broken layout.
 */
export default function Executives() {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    const q = query(collection(db, 'executives'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setExecutives(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('[Executives] Firestore error:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <section
      id="executives"
      aria-labelledby="executives-heading"
      className="bg-naos-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="executives-heading"
          title="The Executives"
          lede={`The officers elected to serve ${site.chapter} this session.`}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
          </div>
        ) : executives.length === 0 ? (
          <p className="rounded-lg bg-naos-gray/60 p-8 text-center text-naos-text/70">
            Executive profiles will appear here once the PRO publishes them.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {executives.map((person) => (
              <li
                key={person.id}
                className="flex flex-col items-center rounded-lg border border-naos-green/10 bg-naos-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={`Portrait of ${person.name}, ${person.position}`}
                    loading="lazy"
                    width="96"
                    height="96"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-naos-green text-2xl font-bold text-naos-gold"
                  >
                    {getInitials(person.name)}
                  </span>
                )}
                <h3 className="mt-4 text-base font-bold text-naos-green">{person.position}</h3>
                <p className="mt-1 text-sm font-medium text-naos-text">{person.name}</p>
                {(person.department || person.level) && (
                  <p className="mt-2 text-xs uppercase tracking-wide text-naos-text/55">
                    {[person.department, person.level && `${person.level} Level`]
                      .filter(Boolean).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Past Executives link — only shown to logged-in verified users via route guard */}
        <div className="mt-10 text-center">
          <Link
            to="/past-executives"
            className="inline-flex items-center gap-2 rounded-md border border-naos-green/30 px-5 py-2.5 text-sm font-semibold text-naos-green transition hover:bg-naos-green hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Past Executives
          </Link>
        </div>
      </div>
    </section>
  );
}
