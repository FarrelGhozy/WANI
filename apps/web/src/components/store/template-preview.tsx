'use client';

interface TemplatePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: {
    style: string;
    rounded: boolean;
    shadows: boolean;
  };
  heroText?: string;
  businessName?: string;
}

export function TemplatePreview({
  colors,
  layout,
  heroText,
  businessName,
}: TemplatePreviewProps) {
  const r = layout.rounded;
  const s = layout.shadows;

  return (
    <div
      className="overflow-hidden rounded-xl border text-xs leading-tight"
      style={{
        background: colors.background,
        color: colors.text,
        boxShadow: s ? '0 4px 24px rgba(0,0,0,0.10)' : 'none',
      }}
    >
      {/* Mini Navbar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          borderBottom: `1px solid ${colors.text}15`,
          background: colors.background,
        }}
      >
        <span className="font-bold" style={{ color: colors.primary, fontSize: '0.7rem' }}>
          {businessName || 'Toko Saya'}
        </span>
        <div
          className="rounded px-2 py-0.5 text-[0.6rem] font-medium text-white"
          style={{ background: colors.primary, borderRadius: r ? '999px' : '0' }}
        >
          Hubungi
        </div>
      </div>

      {/* Hero */}
      {heroText && (
        <div
          className="px-3 py-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}12, ${colors.secondary}12)`,
            borderRadius: r ? '0.5rem' : '0',
            margin: '0.5rem',
          }}
        >
          <div className="text-[0.65rem] font-semibold">{heroText}</div>
        </div>
      )}

      {/* Product grid mockup */}
      <div className="px-3 pb-3">
        <div className="mb-2 text-[0.6rem] font-semibold" style={{ color: colors.text }}>
          Produk
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-2"
              style={{
                background: colors.background,
                border: `1px solid ${colors.text}10`,
                borderRadius: r ? '0.4rem' : '0',
                boxShadow: s ? `0 1px 3px ${colors.text}10` : 'none',
              }}
            >
              <div
                className="mb-1 aspect-square rounded"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}25, ${colors.secondary}25)`,
                  borderRadius: r ? '0.25rem' : '0',
                }}
              />
              <div
                className="mb-0.5 h-1.5 rounded"
                style={{ background: `${colors.text}20`, borderRadius: r ? '2px' : '0' }}
              />
              <div
                className="h-1.5 w-2/3 rounded"
                style={{ background: `${colors.primary}30`, borderRadius: r ? '2px' : '0' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 text-center text-[0.55rem]"
        style={{
          borderTop: `1px solid ${colors.text}10`,
          color: `${colors.text}60`,
          background: `${colors.text}04`,
        }}
      >
        {businessName || 'Toko Saya'} &middot; Online Store
      </div>

      {/* Style indicator */}
      <div
        className="px-2 py-1 text-center text-[0.5rem] uppercase tracking-wider"
        style={{
          background: `${colors.primary}08`,
          color: `${colors.primary}60`,
        }}
      >
        {layout.style} &middot; {r ? 'Rounded' : 'Sharp'} &middot; {s ? 'Shadows' : 'Flat'}
      </div>
    </div>
  );
}
