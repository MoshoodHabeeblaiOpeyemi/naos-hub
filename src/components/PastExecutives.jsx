import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import SectionHeading from './SectionHeading.jsx';

/** Render two initials from a full name string. */
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/**
 * Past Executives page.
 * Protected route — only accessible to logged-in and verified members.
 * Fetches the `past_executives` Firestore collection, ordered by `archivedAt`
 * descending so the most recently archived set appears first.
 */
export default function PastExecutives() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    const q = query(collection(db, 'past_executives'), orderBy('archivedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.warn('[PastExecutives] Firestore error:', err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-naos-white min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="past-executives-heading"
          title="Past Executives"
          lede="A record of all those who have served the NAOS Unilorin Chapter."
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-naos-green border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <p className="rounded-lg bg-naos-gray/60 p-8 text-center text-naos-text/70">
            No past executive records yet.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((person) => (
              <li
                key={person.id}
                className="flex flex-col items-center rounded-lg border border-naos-green/10 bg-naos-white p-6 text-center shadow-sm"
              >
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={`Portrait of ${person.name}`}
                    loading="lazy"
                    width="80"
                    height="80"
                    className="h-20 w-20 rounded-full object-cover opacity-80"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-naos-green/60 text-xl font-bold text-naos-gold"
                  >
                    {getInitials(person.name)}
                  </span>
                )}
                <h3 className="mt-4 text-sm font-bold text-naos-green">{person.position}</h3>
                <p className="mt-1 text-sm font-medium text-naos-text">{person.name}</p>
                {(person.department || person.level) && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-naos-text/50">
                    {[person.department, person.level && `${person.level} Level`]
                      .filter(Boolean).join(' · ')}
                  </p>
                )}
                {person.archivedAt && (
                  <p className="mt-2 text-[11px] text-naos-text/40 italic">
                    Archived {new Date(person.archivedAt).getFullYear()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
