import SectionHeading from './SectionHeading.jsx';
import {
  getPublicEvents,
  formatEventDate,
  formatEventTime,
  eventKindLabels,
} from '../data/events.js';

/** Events list. Falls back to recent past events when none are upcoming. */
export default function Events() {
  const list = getPublicEvents();

  return (
    <section
      id="events"
      aria-labelledby="events-heading"
      className="bg-naos-gray py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="events-heading"
          title="Upcoming Events"
          lede="Dates and venues are confirmed by the organising director."
        />

        {list.length === 0 ? (
          <p className="rounded-lg bg-naos-white p-8 text-center text-naos-text/70">
            No events scheduled yet. Check back soon or follow our WhatsApp for
            updates.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((event) => {
              const time = formatEventTime(event.time);

              return (
                <li
                  key={event.id}
                  className="flex flex-col overflow-hidden rounded-lg bg-naos-white shadow-sm"
                >
                  {event.photo ? (
                    <img
                      src={event.photo}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-40 w-full items-center justify-center bg-naos-green"
                    >
                      <span className="text-3xl font-bold tracking-[0.2em] text-naos-gold">
                        {eventKindLabels[event.kind]}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <span className="inline-flex w-fit rounded-full bg-naos-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-naos-green">
                      {eventKindLabels[event.kind]}
                    </span>

                    <h3 className="mt-3 text-lg font-bold text-naos-green">
                      {event.title}
                    </h3>

                    <dl className="mt-4 space-y-2 text-sm text-naos-text/80">
                      <div className="flex gap-2">
                        <dt className="sr-only-focusable">Date</dt>
                        <dd className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-naos-gold">
                            ◆
                          </span>
                          <span>{formatEventDate(event.date)}</span>
                        </dd>
                      </div>

                      {time && (
                        <div className="flex gap-2">
                          <dt className="sr-only-focusable">Time</dt>
                          <dd className="flex items-start gap-2">
                            <span aria-hidden="true" className="text-naos-gold">
                              ◆
                            </span>
                            <span>{time}</span>
                          </dd>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex gap-2">
                          <dt className="sr-only-focusable">Venue</dt>
                          <dd className="flex items-start gap-2">
                            <span aria-hidden="true" className="text-naos-gold">
                              ◆
                            </span>
                            <span>{event.location}</span>
                          </dd>
                        </div>
                      )}
                    </dl>

                    {event.description && (
                      <p className="mt-4 text-sm leading-relaxed text-naos-text/75">
                        {event.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
