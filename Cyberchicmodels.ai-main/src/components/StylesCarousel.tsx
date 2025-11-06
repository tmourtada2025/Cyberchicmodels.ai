import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Style {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface StylesCarouselProps {
  styles: Style[];
}

export function StylesCarousel({ styles }: StylesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // Pixels per frame
    const totalWidth = scrollContainer.scrollWidth;
    const containerWidth = scrollContainer.clientWidth;

    const animate = () => {
      if (!scrollContainer) return;

      scrollPosition += scrollSpeed;
      if (scrollPosition >= totalWidth - containerWidth) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleMouseEnter = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const handleMouseLeave = () => {
      animationFrameId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="overflow-x-hidden"
    >
      <div className="flex space-x-6" style={{ width: `${styles.length * 320}px` }}>
        {[...styles, ...styles].map((style, index) => (
          <Link
            key={`${style.id}-${index}`}
            to={`/style/${style.id}`}
            className="w-80 flex-shrink-0 group cursor-pointer transform transition-transform duration-300 hover:scale-105"
          >
            <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-50">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={style.image}
                  alt={style.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-lg font-serif">${style.price.toFixed(2)}</p>
                <p className="text-sm opacity-80">{style.description}</p>
              </div>
            </div>
            <h3 className="text-xl font-serif text-white mb-2">{style.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}