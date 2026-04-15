import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Spurig — QR-Code-Tracking, DSGVO-konform, aus Deutschland.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const COLORS = {
  cream: '#F8F3EA',
  ink: '#1C1A24',
  primary: '#6B4EB4',
  primarySoft: 'rgba(107, 78, 180, 0.14)',
  border: '#E3DDD0',
  muted: '#6E6A77',
  foreground: '#15141A',
  emerald: '#10B981',
};

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `radial-gradient(ellipse 60% 50% at 30% 0%, rgba(107,78,180,0.28), transparent 70%), radial-gradient(ellipse 45% 40% at 100% 100%, rgba(107,78,180,0.14), transparent 70%), ${COLORS.cream}`,
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          color: COLORS.foreground,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
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
            Einführungspreis aktiv
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1020 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
              color: COLORS.foreground,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>QR-Code-Tracking,</span>
            <span
              style={{
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontWeight: 400,
                color: COLORS.primary,
                letterSpacing: '-0.02em',
              }}
            >
              das dir wirklich gehört.
            </span>
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              lineHeight: 1.4,
              color: COLORS.muted,
              maxWidth: 860,
            }}
          >
            DSGVO-konformes QR-Code-Tracking und Kampagnen-Analytics.
            Ohne Drittanbieter, ohne Cookies — Hosting in der EU.
          </div>
        </div>

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
            {['DSGVO · Art. 32', 'EU-Hosting', 'ab 4,99 € / Monat'].map((chip) => (
              <div
                key={chip}
                style={{
                  padding: '12px 20px',
                  borderRadius: 999,
                  background: COLORS.primarySoft,
                  color: COLORS.primary,
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.005em',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: COLORS.primary,
            opacity: 0.25,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
