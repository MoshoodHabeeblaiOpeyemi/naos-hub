import SectionHeading from './SectionHeading.jsx';
import { site } from '../data/site.js';

/**
 * About / mission section.
 *
 * The objectives below are drafted from the association's stated purpose. They
 * MUST be checked against the official constitution PDF before launch — the Exec
 * should confirm this wording, not inherit the developer's paraphrase.
 */
const objectives = [
  {
    title: 'Unity',
    text: 'Unite Oyo students studying at the University of Ilorin under one association, so that no member stands alone.',
  },
  {
    title: 'Welfare',
    text: 'Look after the welfare and academic interest of every member, and support those facing difficulty.',
  },
  {
    title: 'Representation',
    text: 'Represent Oyo students credibly in all matters affecting them within the university.',
  },
  {
    title: 'Development',
    text: 'Organise programmes that build members academically, socially and professionally.',
  },
];

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="bg-naos-gray py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="about-heading"
          title="About NAOS"
          lede={`${site.name}, ${site.chapter}.`}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {objectives.map((item) => (
            <article
              key={item.title}
              className="rounded-lg bg-naos-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-naos-green">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-naos-text/80">
                {item.text}
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-naos-text/70">
          Our guiding principle is{' '}
          <span className="font-semibold text-naos-green">{site.motto}</span> —
          be proactive. The full governing document is available in the{' '}
          <a
            href="#constitution"
            className="font-semibold text-naos-green underline decoration-naos-gold decoration-2 underline-offset-2"
          >
            constitution section
          </a>
          .
        </p>
      </div>
    </section>
  );
}
