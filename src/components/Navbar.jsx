import { useEffect, useState } from 'react';
import { site } from '../data/site.js';

/**
 * Sticky top navigation.
 * Mobile-first: the links collapse behind a toggle below the `md` breakpoint.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu whenever the viewport grows to desktop size,
  // otherwise it stays "open" and is invisible once the links return.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (event) => {
      if (event.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-naos-green/95 backdrop-blur transition-shadow ${
        scrolled ? 'shadow-lg shadow-black/20' : ''
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <a
          href="#"
          className="flex items-center gap-3 rounded-sm"
          aria-label={`${site.chapterLabel} — back to top`}
        >
          <img
            src={site.logo}
            alt={`${site.shortName} crest`}
            width="40"
            height="40"
            className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-wide text-naos-gold">
              {site.shortName}
            </span>
            <span className="hidden text-xs text-white/80 sm:block">
              {site.chapter}
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="primary-menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 md:hidden"
        >
          <span className="sr-only">
            {open ? 'Close main menu' : 'Open main menu'}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <ul
          id="primary-menu"
          className={`${
            open ? 'flex' : 'hidden'
          } absolute inset-x-0 top-full flex-col gap-1 border-t border-white/10 bg-naos-dark px-4 py-3 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:px-0 md:py-0`}
        >
          {site.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-naos-gold md:px-0 md:py-1"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
