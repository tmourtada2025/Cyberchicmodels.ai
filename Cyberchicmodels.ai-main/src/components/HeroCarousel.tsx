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
    <div className="relative w-full" style={{ height: '100vh', backgroundColor: '#080808' }}>
      {/* Background image */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url("https://iqoifrsavdreyiixuksd.supabase.co/storage/v1/object/public/hero/hero.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        onContextMenu={blockContextMenu}
        onDragStart={blockContextMenu}
      />
      {/* Fallback dark overlay — ensures text is always readable */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.15) 60%, rgba(8,8,8,0.6) 100%)' }} />

      {/* Content — right-aligned to mirror banner layout */}
      <div className="absolute inset-0 flex items-center justify-end px-16 z-20">
        <div className="text-right max-w-lg">
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
          <div className="flex flex-col items-end gap-3">
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
