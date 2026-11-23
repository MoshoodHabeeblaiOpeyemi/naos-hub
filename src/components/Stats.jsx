import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { stats as staticStats } from '../data/site.js';

/**
 * Stats strip.
 * The first stat (Enrolled Members) is fetched dynamically from Firestore by counting
 * users where isVerified == true. Falls back gracefully if Firestore is unavailable.
 */
export default function Stats() {
  const [verifiedCount, setVerifiedCount] = useState(null);

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const q = query(collection(db, 'users'), where('isVerified', '==', true));
        try {
          const snap = await getCountFromServer(q);
          setVerifiedCount(snap.data().count);
        } catch {
          const snap = await getDocs(q);
          setVerifiedCount(snap.size);
        }
      } catch (err) {
        console.warn('[Stats] Could not fetch member count:', err.message);
      }
    })();
  }, []);

  // Replace the first stat's value with the live count; leave others untouched
  const displayStats = staticStats.map((s, i) =>
    i === 0
      ? { ...s, value: verifiedCount !== null ? String(verifiedCount) : '—', note: 'Verified members' }
      : s
  );

  return (
    <section aria-label="Association at a glance" className="bg-naos-white">
      <dl className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-naos-green/10 bg-naos-gray/60 p-6 text-center"
          >
            <dd className="text-3xl font-bold text-naos-green sm:text-4xl">
              {stat.value}
            </dd>
            <dt className="mt-2 text-sm font-semibold uppercase tracking-wide text-naos-text/70">
              {stat.label}
            </dt>
            {stat.note && (
              <p className="mt-1 text-xs text-naos-text/50">{stat.note}</p>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
