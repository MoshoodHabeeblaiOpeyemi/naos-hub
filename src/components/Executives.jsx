import SectionHeading from './SectionHeading.jsx';
import { executives, getInitials } from '../data/executives.js';
import { site } from '../data/site.js';

/**
 * Executive grid.
 *
 * Renders an initials avatar whenever `photo` is null, so a missing portrait
 * degrades gracefully instead of showing a broken image icon.
 */
export default function Executives() {
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

              <h3 className="mt-4 text-base font-bold text-naos-green">
                {person.position}
              </h3>
              <p className="mt-1 text-sm font-medium text-naos-text">
                {person.name}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-naos-text/55">
                {person.department} &middot; {person.level} Level
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
