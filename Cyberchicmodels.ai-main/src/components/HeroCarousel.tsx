import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function HeroCarousel() {
  const navigate = useNavigate();

  const blockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div
      className="relative w-full h-[72vh] min-h-[520px] max-h-[680px] md:h-[58vh] md:min-h-[440px] md:max-h-[620px]"
      style={{ backgroundColor: '#080808' }}
    >
      {/* Background image */}
      <img
        src="https://iqoifrsavdreyiixuksd.supabase.co/storage/v1/object/public/hero/hero.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[50%_35%] md:object-[50%_38%]"
        onContextMenu={blockContextMenu}
        onDragStart={blockContextMenu}
      />
      {/* Fallback dark overlay — ensures text is always readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.1) 60%), linear-gradient(to right, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0.05) 55%, rgba(8,8,8,0.55) 100%)',
        }}
      />

      {/* Content — right-aligned to mirror banner layout */}
      <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-10 md:items-center md:justify-end md:px-16 md:pb-0">
        <div className="max-w-lg text-center md:text-right">
          <p
            className="mb-2 tracking-widest uppercase"
            style={{ fontSize: '11px', color: '#c8a96e', letterSpacing: '0.2em' }}
          >
            AI Model Agency
          </p>
          <h1
            className="font-serif mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#f5f0e8', lineHeight: 1.1, fontWeight: 400 }}
          >
            Not a stock library.
          </h1>
          <h2
            className="font-serif mb-8"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#c8a96e', lineHeight: 1.1, fontWeight: 400, fontStyle: 'italic' }}
          >
            A licensable roster.
          </h2>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <button
              onClick={() => navigate('/models')}
              className="flex items-center gap-2 transition-all"
              style={{
                background: 'transparent',
                border: '1px solid #c8a96e',
                color: '#c8a96e',
                padding: '12px 28px',
                fontSize: '13px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#c8a96e';
                (e.currentTarget as HTMLButtonElement).style.color = '#080808';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#c8a96e';
              }}
            >
              Browse the roster <ChevronRight size={14} />
            </button>
            <p style={{ fontSize: '11px', color: 'rgba(200,169,110,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              cyberchicmodels.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
