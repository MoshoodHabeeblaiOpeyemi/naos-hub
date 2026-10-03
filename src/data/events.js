/**
 * NAOS Unilorin — events.
 * ---------------------------------------------------------------------------
 * ⚠️  PLACEHOLDER CONTENT — DO NOT PUBLISH AS-IS.
 * Titles, dates and venues below are invented samples. Replace them with
 * confirmed details from the Social / Sport Directors before launch.
 *
 * HOW TO ADD AN EVENT
 *   Copy one { ... } block, change the values, keep the commas.
 *
 *   date  — ISO format, 'YYYY-MM-DD'. This is REQUIRED to sort correctly and
 *           to display properly. Example: '2026-03-14'
 *   time  — 24-hour 'HH:MM'. Example: '14:00'  (shows as 2:00 PM)
 *   photo — null shows a gold "NAOS" placeholder tile instead of an image.
 *
 * KIND: 'social' | 'sports' | 'academic' | 'general'
 *   Used to colour-code the badge. Drives who can manage attendance later.
 *
 * KEEP THIS FILE PURE DATA (see the architecture note in site.js).
 */

/** @typedef {{ id: string, title: string, date: string, time: string | null, location: string, description: string, kind: 'social' | 'sports' | 'academic' | 'general', photo: string | null }} Event */

export const events = [
  {
    id: 'freshers-orientation',
    title: 'Freshers Orientation Programme',
    date: '2026-10-17',
    time: '14:00',
    location: 'Main Auditorium, University of Ilorin',
    description:
      'Welcome programme for newly admitted members. Briefing on the association, registration procedure and the year ahead.',
    kind: 'general',
    photo: null,
  },
  {
    id: 'inter-department-sports',
    title: 'Inter-Department Sports Competition',
    date: '2026-11-07',
    time: '09:00',
    location: 'Faculty Sports Ground',
    description:
      'Annual football and athletics contest between departments. Open to all registered members.',
    kind: 'sports',
    photo: null,
  },
  {
    id: 'social-evening',
    title: 'NAOS Social Evening',
    date: '2026-11-28',
    time: '18:30',
    location: 'Unilorin Central Event Centre',
    description:
      'An evening of music, food and fellowship for the NAOS family and invited guests.',
    kind: 'social',
    photo: null,
  },
];

/** Human-readable label for each event kind. */
export const eventKindLabels = {
  social: 'Social',
  sports: 'Sports',
  academic: 'Academic',
  general: 'General',
};

/**
 * Splits events into upcoming / past, both ordered newest-first for upcoming
 * and most-recent-first for past. Events with a date in the future count as
 * upcoming. Today counts as upcoming so an event happening now is not hidden.
 */
export function splitEvents(list = events, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = [];
  const past = [];

  for (const event of list) {
    // Compare on the date only, ignoring the time of day.
    const eventDate = new Date(`${event.date}T00:00:00`);
    if (eventDate >= today) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}

/**
 * Returns the events to show publicly.
 * Prefer upcoming events; once every event has passed, fall back to the most
 * recent past events so the section is never empty on the public site.
 */
export function getPublicEvents(list = events, now = new Date()) {
  const { upcoming, past } = splitEvents(list, now);
  return upcoming.length > 0 ? upcoming : past.slice(0, 3);
}

/**
 * Formats an ISO date for display, e.g. "Saturday, 14 March 2026".
 * Returns the fallback text if the date is missing or unparseable, so a typo
 * in the data file can never blank out the whole Events section.
 */
export function formatEventDate(isoDate, fallback = 'Date to be confirmed') {
  if (!isoDate) return fallback;

  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

/**
 * Formats 'HH:MM' (24-hour) as e.g. "2:00 PM".
 * Uses en-US purely for its uppercase meridiem; the date formatter above stays
 * en-GB for the British day-month order we use.
 */
export function formatEventTime(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(':');
  const parsedHours = Number(hours);
  if (Number.isNaN(parsedHours)) return null;

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(2026, 0, 1, parsedHours, Number(minutes) || 0))
    .toUpperCase();
}
