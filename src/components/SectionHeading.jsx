/**
 * Shared section heading so every section on the page looks consistent.
 * `id` doubles as the anchor target and the aria-labelledby reference.
 */
export default function SectionHeading({ id, title, lede }) {
  return (
    <div className="mb-10 text-center sm:mb-12">
      <h2 id={id} className="text-3xl font-bold text-naos-green sm:text-4xl">
        {title}
      </h2>
      {lede && <p className="mx-auto mt-3 max-w-2xl text-naos-text/80">{lede}</p>}
      <div
        aria-hidden="true"
        className="mx-auto mt-5 h-1 w-16 rounded-full bg-naos-gold"
      />
    </div>
  );
}
