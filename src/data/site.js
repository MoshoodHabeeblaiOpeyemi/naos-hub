/**
 * NAOS Unilorin — global site content.
 * ---------------------------------------------------------------------------
 * EDITING GUIDE (for PRO I / PRO II — no coding knowledge needed)
 *   • These files are plain text. Change the text between the quotes, keep the
 *     quotes and commas, save, and the site updates.
 *   • DO NOT delete a line that ends with a comma. A missing comma or quote
 *     will break the whole site.
 *   • To remove an executive or event, delete the entire { ... } block.
 *
 * ARCHITECTURE NOTE (for the next tech lead)
 *   Everything here is plain data — no React, no imports, no browser APIs.
 *   That is deliberate: it keeps the Stage 3 Vite -> Astro/Next.js migration a
 *   mechanical swap of this data loader, rather than a rewrite of components.
 *   Please keep it that way. Do not add JSX, components or fetch() calls here.
 */

export const site = {
  name: 'National Association of Oyo Students',
  shortName: 'NAOS',
  chapter: 'University of Ilorin Chapter',
  chapterLabel: 'NAOS Unilorin Chapter',
  university: 'University of Ilorin',

  /** Taken verbatim from the official NAOS crest. Pending Exec confirmation. */
  motto: 'AJISE BI OYO LAARI',
  slogan: 'OYO KII SE BI BABA ENIKOOKAN',

  /**
   * 'placeholder' -> the site is running on unreviewed sample content.
   * Change to 'verified' ONLY when real names, dates and documents are in.
   *
   * While this is 'placeholder', a yellow warning strip is rendered at the top
   * of the page in DEVELOPMENT builds only. It is stripped from production
   * bundles, so it can never be seen by a visitor — but you cannot miss it
   * while you are working. See docs/DEVELOPER-HANDOVER.md §9.
   */
  contentStatus: 'placeholder',

  /** Set to a path in /public/images to use a photo hero. null = gradient hero. */
  heroImage: null,

  logo: '/logos/naos-logo.png',
  unilorinLogo: '/logos/unilorin-logo.png',

  /**
   * Constitution.
   *   pdf — the real document, exported from the official .docx.
   *   To swap in a revised version, drop the new file in /public/docs/
   *   (same filename) and it updates site-wide. Keep the filename stable so
   *   links already shared on WhatsApp keep working.
   */
  constitution: {
    pdf: '/docs/naos-unilorin-constitution.pdf',
    fileName: 'naos-unilorin-constitution.pdf',
  },

  contact: {
    /**
     * TEMPORARY — holds the outgoing Vice-President's details until the
     * Executive hands over the official NAOS contact. Swap before launch.
     */
    whatsappDisplay: '+234 704 071 7939',
    whatsappNumber: '2347040717939',
    email: null,
    linkedin: 'https://linkedin.com/in/moshood-habeeblai-967b14294',
    linkedinHandle: 'linkedin.com/in/moshood-habeeblai',
    address: ['University of Ilorin', 'Ilorin, Kwara State', 'Nigeria'],
  },

  /** Used for <title>, meta description and WhatsApp link previews. */
  seo: {
    title: 'NAOS Unilorin Chapter — National Association of Oyo Students',
    description:
      'Official digital hub for the National Association of Oyo Students (NAOS), University of Ilorin Chapter. Events, executives, constitution and membership information.',
    url: 'https://naosunilorin.org',
    ogImage: '/images/og-image.jpg',
  },

  /**
   * Nav targets. Keep ids in sync with the section ids in App.jsx.
   * 'href: "#"' means "scroll to top" (used by the logo).
   */
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Executives', href: '#executives' },
    { label: 'Events', href: '#events' },
    { label: 'Constitution', href: '#constitution' },
    { label: 'Contact', href: '#contact' },
  ],
};

/** Headline numbers on the stats strip. All figures are placeholders. */
export const stats = [
  { label: 'Members enrolled', value: '—', note: 'Awaiting Gen Sec figure' },
  { label: 'University chapter', value: '1', note: 'University of Ilorin' },
  { label: 'Motto', value: 'Ajíṣẹ̀', note: 'Be proactive' },
];
