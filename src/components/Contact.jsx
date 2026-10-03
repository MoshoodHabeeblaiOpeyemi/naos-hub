import { site } from '../data/site.js';

/**
 * Contact section — WhatsApp is the primary channel for this audience, so it
 * is listed first. Links only render when the value exists in site.js, so a
 * missing email never renders a dead "mailto:".
 */
export default function Contact() {
  const { whatsappDisplay, whatsappNumber, email, linkedin, address } =
    site.contact;

  const whatsappHref = `https://wa.me/${whatsappNumber}`;
  const contacts = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      value: whatsappDisplay,
      href: whatsappHref,
      icon: (
        <path d="M20.5 3.5A10.4 10.4 0 0 0 3.2 16.1L2 22l6-1.6a10.5 10.5 0 0 0 12.5-17z" />
      ),
    },
    email && {
      key: 'email',
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      icon: (
        <>
          <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </>
      ),
    },
    linkedin && {
      key: 'linkedin',
      label: 'LinkedIn',
      value: 'Connect with us',
      href: linkedin,
      icon: (
        <>
          <rect x="2.5" y="2.5" width="19" height="19" rx="2" />
          <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4" />
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-naos-gray py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="contact-heading"
          className="text-center text-3xl font-bold text-naos-green sm:text-4xl"
        >
          Get in Touch
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-naos-text/80">
          Reach the association directly. We respond fastest on WhatsApp.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-start gap-4 rounded-lg bg-naos-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-naos-green text-naos-gold transition-colors group-hover:bg-naos-dark">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold uppercase tracking-wide text-naos-text/60">
                    {item.label}
                  </span>
                  <span className="mt-1 block break-words font-medium text-naos-green group-hover:underline">
                    {item.value}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <address className="mt-10 text-center text-naos-text/80 not-italic">
          <p className="font-semibold text-naos-green">{site.university}</p>
          {address.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </address>
      </div>
    </section>
  );
}
