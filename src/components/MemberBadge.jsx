import { forwardRef } from 'react';

/**
 * MemberBadge
 * NAOS-green background, gold accents.
 * Fixed 480×270 px so html2canvas always gets a stable canvas.
 * All styling is inline — Tailwind classes are NOT used here because
 * html2canvas cannot read them from the computed stylesheet reliably.
 *
 * Props:
 *   profile — Firestore user doc { name, matric, lga, passId }
 *   uid     — Firebase Auth UID (fallback when passId not yet set)
 */
const MemberBadge = forwardRef(function MemberBadge({ profile, uid }, ref) {
  const name   = profile?.name   || 'NAOS Member';
  const matric = profile?.matric || '—';
  const lga    = profile?.lga    || '—';
  // passId stored in Firestore; fall back to first 6 chars of UID
  const passId = profile?.passId || `NAOS-${(uid || 'XXXXXX').substring(0, 6).toUpperCase()}`;

  // NAOS brand colours as hex so html2canvas picks them up inline
  const GREEN  = '#1a5c38';   // naos-green
  const DGLASS = '#143d26';   // slightly darker green for bottom bar
  const GOLD   = '#c9a84c';   // naos-gold

  return (
    <div
      ref={ref}
      style={{
        width: 480,
        height: 270,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: GREEN,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* ── Decorative ring blobs ── */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -70, right: -70,
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: -50, left: -50,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Top bar: logo + org name ── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/logos/naos-logo.png"
          alt="NAOS"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: '#fff', padding: 3, objectFit: 'contain',
          }}
        />
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 15, letterSpacing: 2 }}>
            NAOS
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>
            Unilorin Chapter
          </div>
        </div>

        {/* Verified tick — top right */}
        <div style={{
          marginLeft: 'auto',
          background: 'rgba(201,168,76,0.15)',
          border: `1px solid rgba(201,168,76,0.4)`,
          borderRadius: '50%',
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>

        {/* Row: Name + LGA */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Name block */}
          <div style={{ flex: 2 }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
              Attendee Name
            </div>
            <div style={{
              color: '#ffffff',
              fontSize: name.length > 22 ? 14 : 17,
              fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.2, wordBreak: 'break-word',
            }}>
              {name}
            </div>
            {/* Matric under the name */}
            <div style={{ marginTop: 5 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 1 }}>
                Matric No
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, letterSpacing: 1.5 }}>
                {matric}
              </div>
            </div>
          </div>

          {/* LGA block */}
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
              Local Govt
            </div>
            <div style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>
              {lga}
            </div>
          </div>
        </div>

      </div>

      {/* ── Pass ID bar ── */}
      <div style={{
        margin: '0 24px 14px',
        background: 'rgba(201,168,76,0.1)',
        border: `1px solid rgba(201,168,76,0.3)`,
        borderRadius: 10,
        padding: '9px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 7, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
            Pass ID
          </div>
          <div style={{ color: GOLD, fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>
            {passId}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, letterSpacing: 0.5, textAlign: 'right', lineHeight: 1.5 }}>
          <div>100% Verified</div>
          <div>Member</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        backgroundColor: DGLASS,
        padding: '7px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: 0.5 }}>
          National Association of Oyo Students
        </span>
        <span style={{ color: GOLD, fontSize: 8, letterSpacing: 0.5 }}>
          naosunilorin.org
        </span>
      </div>
    </div>
  );
});

export default MemberBadge;
