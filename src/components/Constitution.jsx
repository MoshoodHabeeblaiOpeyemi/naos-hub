import SectionHeading from './SectionHeading.jsx';
import { site } from '../data/site.js';

/**
 * Constitution download section.
 *
 * The button opens the PDF in a new tab (download attribute is unreliable
 * across mobile browsers, which mostly ignore it). It degrades to a disabled
 * "coming soon" state if `constitution.pdf` is null, so the section is safe to
 * ship before the document is confirmed.
 */
export default function Constitution() {
  const { pdf } = site.constitution;

  return (
    <section
      id="constitution"
      aria-labelledby="constitution-heading"
      className="bg-naos-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="constitution-heading"
          title="Our Constitution"
          lede="The governing document of the association, available to every member and to the public."
        />

        <div className="mx-auto max-w-3xl rounded-lg border border-naos-green/10 bg-naos-gray/60 p-8 text-center sm:p-10">
          <img
            src={site.logo}
            alt=""
            aria-hidden="true"
            width="64"
            height="64"
            className="mx-auto mb-6 h-16 w-16 rounded-full bg-white object-contain p-1 shadow-sm"
          />

          <h3 className="text-xl font-bold text-naos-green">
            NAOS Constitution
          </h3>
          <p className="mt-2 text-sm text-naos-text/70">
            {site.chapterLabel}
          </p>

          {pdf ? (
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-naos-green px-8 py-3 text-base font-bold text-white transition-colors hover:bg-naos-dark"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              Download PDF
            </a>
          ) : (
            <p className="mt-8 inline-block rounded-md bg-naos-white px-6 py-3 text-sm font-semibold text-naos-text/50">
              PDF coming soon
            </p>
          )}

          <p className="mt-4 text-xs text-naos-text/55">
            Having trouble? Message us on WhatsApp and we will send a copy.
          </p>
        </div>
      </div>
    </section>
  );
}
