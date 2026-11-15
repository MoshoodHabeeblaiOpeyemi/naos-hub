import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { site } from '../data/site.js';

/**
 * Contact section.
 * Fetches contact links from Firestore `settings/contact`.
 * Falls back to hardcoded site.js values if Firestore is unavailable or the
 * document hasn't been created yet by an admin.
 *
 * Firestore document shape (settings/contact):
 *   {
 *     proChatNumber:  "2347040717939",          // WhatsApp number (no +)
 *     proChatDisplay: "+234 704 071 7939",
 *     whatsappChannel: "https://whatsapp.com/channel/...",
 *     email:          "naos@example.com" | null,
 *     socials: [
 *       { key: "instagram", label: "Instagram", url: "https://..." },
 *       ...
 *     ]
 *   }
 */

const WA_ICON = (
  <path d="M20.5 3.5A10.4 10.4 0 0 0 3.2 16.1L2 22l6-1.6a10.5 10.5 0 0 0 12.5-17z" />
);
const EMAIL_ICON = (
  <>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="m3 6 9 7 9-7" />
  </>
);
const CHANNEL_ICON = (
  /* megaphone / broadcast */
  <path d="M18 8a6 6 0 0 1-7.743 5.743L10 14l-1 4H7l1-4a6 6 0 0 1-.243-10.14M18 8A6 6 0 1 1 6 8a6 6 0 0 1 12 0z" />
);

function SocialIcon() {
  return (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
    />
  );
}

function ContactCard({ href, label, value, iconPaths }) {
  return (
    <li>
      <a
        href={href}
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
            {iconPaths}
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold uppercase tracking-wide text-naos-text/60">
            {label}
          </span>
          <span className="mt-1 block break-words font-medium text-naos-green group-hover:underline">
            {value}
          </span>
        </span>
      </a>
    </li>
  );
}

export default function Contact() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      doc(db, 'settings', 'contact'),
      (snap) => { if (snap.exists()) setSettings(snap.data()); },
      (err) => console.warn('[Contact] Firestore error:', err.message)
    );
    return () => unsub();
  }, []);

  // Resolved values: Firestore overrides site.js fallbacks
  const proChatNumber  = settings?.proChatNumber  || site.contact.whatsappNumber;
  const proChatDisplay = settings?.proChatDisplay  || site.contact.whatsappDisplay;
  const channelUrl     = settings?.whatsappChannel || 'https://whatsapp.com/channel/0029VbBUBc08kyyTIiWezH0l';
  const email          = settings?.email           ?? site.contact.email;
  const extraSocials   = Array.isArray(settings?.socials) ? settings.socials : [];

  const cards = [
    {
      key: 'pro-chat',
      label: 'Chat with PRO',
      value: proChatDisplay,
      href: `https://wa.me/${proChatNumber}`,
      icon: WA_ICON,
    },
    {
      key: 'wa-channel',
      label: 'WhatsApp Channel',
      value: 'Join our channel',
      href: channelUrl,
      icon: CHANNEL_ICON,
    },
    email && {
      key: 'email',
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      icon: EMAIL_ICON,
    },
    // Dynamic socials added from Admin Site Settings
    ...extraSocials.map((s) => ({
      key: s.key || s.label,
      label: s.label,
      value: s.label,
      href: s.url,
      icon: <SocialIcon />,
    })),
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
          {cards.map((item) => (
            <ContactCard
              key={item.key}
              href={item.href}
              label={item.label}
              value={item.value}
              iconPaths={item.icon}
            />
          ))}
        </ul>

        <address className="mt-10 text-center text-naos-text/80 not-italic">
          <p className="font-semibold text-naos-green">{site.university}</p>
          {site.contact.address.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </address>
      </div>
    </section>
  );
}
