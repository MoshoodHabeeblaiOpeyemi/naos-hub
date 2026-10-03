import { site } from '../data/site.js';

/**
 * Site footer. Carries the Unilorin crest — its purple and gold clash with the
 * NAOS green, so it sits on a white circular container rather than the dark
 * background.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-naos-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <img
              src={site.logo}
              alt={`${site.shortName} crest`}
              width="48"
              height="48"
              className="h-12 w-12 rounded-full bg-white object-contain p-1"
            />
            <div>
              <p className="text-lg font-bold text-naos-gold">{site.shortName}</p>
              <p className="text-sm text-white/75">{site.chapter}</p>
            </div>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-naos-gold"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <img
              src={site.unilorinLogo}
              alt="University of Ilorin crest"
              width="56"
              height="56"
              loading="lazy"
              className="h-14 w-14 rounded-full bg-white object-contain p-1"
            />
            <p className="text-xs leading-snug text-white/60">
              A chapter of the
              <br />
              {site.name}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/60">
            © {year} {site.chapterLabel}. All rights reserved.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-naos-gold">
            {site.motto}
          </p>
        </div>
      </div>
    </footer>
  );
}
