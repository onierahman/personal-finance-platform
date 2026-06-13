import { ImageResponse } from 'next/og';

// Social share card (Open Graph / Twitter) — generated at build time.
// Next.js picks this up by file convention and injects the meta tags.
export const alt = 'FinanceOS — All your money. One clear picture.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BARS = [44, 30, 58, 40, 72, 50, 90];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(800px 400px at 20% 0%, rgba(37,99,235,0.35), transparent)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: '#2563EB',
              color: 'white',
              fontSize: 30,
            }}
          >
            {/* wallet glyph */}
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: 'white' }}>
            FinanceOS
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            <span style={{ color: 'white' }}>All your money.</span>
            <span style={{ color: '#60A5FA' }}>One clear picture.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#94A3B8' }}>
            Spending · Budgets · Goals · Investments · Net worth — with AI import
          </div>
        </div>

        {/* Chart footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 14,
            height: 96,
          }}
        >
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: 64,
                height: `${h}%`,
                borderRadius: 6,
                backgroundColor: i === BARS.length - 1 ? '#2563EB' : 'rgba(37,99,235,0.35)',
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
