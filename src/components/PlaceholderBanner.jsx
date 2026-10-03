import { site } from '../data/site.js';

/**
 * Development-only reminder that the site is running on placeholder content.
 *
 * Rendered ONLY when `npm run dev` is running. The `import.meta.env.DEV`
 * guard is replaced with `false` at build time, so this component and its
 * text are stripped out of the production bundle entirely — a visitor can
 * never see it, and it costs nothing on the live site.
 *
 * The point: it is easy to forget that names and dates are still samples.
 * This makes that impossible to miss while working, and impossible to ship.
 */
export default function PlaceholderBanner() {
  if (!import.meta.env.DEV || site.contentStatus !== 'placeholder') {
    return null;
  }

  return (
    <div className="bg-yellow-400 px-4 py-2 text-center text-xs font-semibold text-neutral-900">
      Dev build — placeholder content. Executive names and event dates are
      samples and must not be published. Set{' '}
      <code className="font-mono">contentStatus: &apos;verified&apos;</code> in
      src/data/site.js once real content is loaded.
    </div>
  );
}
