import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 10 C 22 7.5, 19.5 6, 16 6 C 12.5 6, 10 7.5, 10 10 C 10 13, 13 14, 16 15 C 19 16, 22 17, 22 20 C 22 22.5, 19.5 24, 16 24 C 12.5 24, 10 22.5, 10 20"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="22" cy="10" r="2.8" fill="#7C3AED" />
          <circle cx="10" cy="22" r="2.8" fill="#22D3EE" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
