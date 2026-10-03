import { stats } from '../data/site.js';

/** Compact credibility strip directly under the hero. */
export default function Stats() {
  return (
    <section aria-label="Association at a glance" className="bg-naos-white">
      <dl className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {stats.map((stat) => (
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
