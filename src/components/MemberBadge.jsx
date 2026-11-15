import { forwardRef } from 'react';

/**
 * MemberBadge
 * A premium dark/gold festival-pass style digital ID card.
 * Rendered off-screen (via a ref) so html2canvas can capture it as a PNG.
 *
 * Props:
 *   profile  — Firestore user document { name, matric, lga, passId }
 *   uid      — Firebase Auth UID (fallback for passId display)
 */
const MemberBadge = forwardRef(function MemberBadge({ profile, uid }, ref) {
  const name   = profile?.name   || 'NAOS Member';
  const matric = profile?.matric || '—';
  const lga    = profile?.lga    || '—';
  const passId = profile?.passId || `NAOS-${(uid || '????').substring(0, 4).toUpperCase()}`;

  return (
    /* Outer wrapper — fixed pixel size so html2canvas gets a stable canvas */
    <div
      ref={ref}
      style={{ width: 480, height: 270, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
      className="relative overflow-hidden bg-slate-900 rounded-2xl flex flex-col justify-between"
    >
      {/* ── Decorative gradient blobs ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: -60, right: -60,
          width: 220, height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Top bar ── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo + org name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logos/naos-logo.png"
            alt="NAOS"
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', padding: 3, objectFit: 'contain' }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#eab308', fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>NAOS</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>
              Unilorin Chapter
            </div>
          </div>
        </div>

        {/* Edition pill */}
        <div style={{
          background: 'rgba(234,179,8,0.15)',
          border: '1px solid rgba(234,179,8,0.35)',
          borderRadius: 20,
          padding: '4px 12px',
          color: '#eab308',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          Edition 2025 / 2026
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>

        {/* Row: Name + LGA side-by-side */}
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Attendee Name */}
          <div style={{ flex: 2 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
              Attendee Name
            </div>
            <div style={{
              color: '#ffffff',
              fontSize: name.length > 20 ? 15 : 18,
              fontWeight: 800,
              letterSpacing: 0.5,
              lineHeight: 1.15,
              wordBreak: 'break-word',
            }}>
              {name}
            </div>
          </div>

          {/* Local Govt */}
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
              Local Govt
            </div>
            <div style={{ color: '#eab308', fontSize: 13, fontWeight: 700 }}>
              {lga}
            </div>
          </div>
        </div>

        {/* Matric */}
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
            Matric No.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, letterSpacing: 1.5 }}>
            {matric}
          </div>
        </div>

      </div>

      {/* ── Pass ID bar ── */}
      <div style={{
        margin: '0 24px 16px',
        background: 'rgba(234,179,8,0.08)',
        border: '1px solid rgba(234,179,8,0.25)',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 7, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
            Pass ID
          </div>
          <div style={{ color: '#eab308', fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>
            {passId}
          </div>
        </div>

        {/* Verified tick */}
        <div style={{
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, letterSpacing: 0.5 }}>
          100% Verified Member
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, letterSpacing: 0.5 }}>
          naosunilorin.org
        </span>
      </div>
    </div>
  );
});

export default MemberBadge;
