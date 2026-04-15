import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Spurig — QR-Codes, die zeigen, was wirklich funktioniert.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Palette — mirrors monochrome tokens from globals.css.
// ImageResponse can't read CSS vars, so mirror the near-black/neutral scale inline.
const COLORS = {
  background: '#FFFFFF',
  foreground: '#111113', // near-black, matches oklch(0.145 0 0)
  muted: '#737373', // matches oklch(0.45 0 0)
  subtle: '#F5F5F5',
  border: '#E5E5E5',
  ink: '#1A1A1A',
  emerald: '#10B981',
  dot: '#D4D4D4',
};

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: COLORS.background,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${COLORS.dot} 1px, transparent 0)`,
          backgroundSize: '24px 24px',
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          color: COLORS.foreground,
          position: 'relative',
        }}
      >
        {/* Top bar: logo + status pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52,
                borderRadius: 14,
                background: COLORS.ink,
                color: '#fff',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3z" />
                <path d="M20 14v7" />
                <path d="M14 20h7" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: COLORS.foreground,
              }}
            >
              Spurig
            </div>
          </div>

          {/* Status pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              border: `1px solid ${COLORS.border}`,
              background: '#fff',
              fontSize: 18,
              color: COLORS.muted,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: COLORS.emerald,
              }}
            />
            DSGVO-konform · EU-Hosting
          </div>
        </div>

        {/* Middle: headline + subline — sans-only, mirrors new hero */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1060 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
              color: COLORS.foreground,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>QR-Codes, die zeigen,</span>
            <span style={{ color: COLORS.muted }}>was wirklich funktioniert.</span>
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              lineHeight: 1.4,
              color: COLORS.muted,
              maxWidth: 880,
            }}
          >
            Messe in Echtzeit, welches Plakat, welcher Flyer oder welche Visitenkarte
            Scans bringt — ohne Cookies, ohne Drittanbieter.
          </div>
        </div>

        {/* Bottom: URL + neutral chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: COLORS.foreground,
            }}
          >
            spurig.com
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {['DSGVO · Art. 32', 'Ohne Cookies', 'ab 4,99 € / Monat'].map((chip) => (
              <div
                key={chip}
                style={{
                  padding: '12px 20px',
                  borderRadius: 999,
                  background: COLORS.subtle,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.foreground,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom hairline */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: COLORS.border,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
