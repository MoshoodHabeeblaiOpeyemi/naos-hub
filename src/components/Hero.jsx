import { site } from '../data/site.js';

/**
 * Hero. The single strongest thing a screening officer or prospective member
 * sees, so it carries the motto, the slogan and the "Join NAOS" call to action.
 *
 * Note: the internal dev roadmap is deliberately NOT shown here. Public visitors
 * should see what NAOS is, not what NAOS has not finished building.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-naos-green"
    >
      {/* Optional background photo, set via site.heroImage. Decorative only. */}
      {site.heroImage && (
        <img
          src={site.heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
      )}

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <img
          src={site.logo}
          alt={`${site.shortName} crest`}
          width="112"
          height="112"
          className="mx-auto mb-8 h-24 w-24 rounded-full bg-white object-contain p-2 shadow-xl sm:h-28 sm:w-28"
        />

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-naos-gold">
          {site.chapter}
        </p>

        <h1
          id="hero-heading"
          className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          {site.name}
        </h1>

        <p className="mt-6 text-lg font-medium text-naos-gold sm:text-xl">
          {site.motto}
        </p>
        <p className="mt-2 text-base text-white/75 sm:text-lg">{site.slogan}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#contact"
            className="inline-flex w-full items-center justify-center rounded-md bg-naos-gold px-8 py-3 text-base font-bold text-naos-dark transition-colors hover:bg-yellow-400 sm:w-auto"
          >
            Join NAOS
          </a>
          <a
            href="#executives"
            className="inline-flex w-full items-center justify-center rounded-md border-2 border-white/40 px-8 py-3 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto"
          >
            Meet the Executives
          </a>
        </div>
      </div>
    </section>
  );
}
