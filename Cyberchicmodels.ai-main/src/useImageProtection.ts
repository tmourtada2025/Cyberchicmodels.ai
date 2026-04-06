import { useEffect } from 'react';

export function useImageProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' ||
        target.closest('[class*="modal"]') ||
        target.closest('[class*="card"]') ||
        target.closest('[class*="hero"]') ||
        target.closest('[class*="carousel"]') ||
        target.closest('[class*="style"]')
      ) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked =
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        e.key === 'F12' ||
        e.key === 'PrintScreen';
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const protectImages = () => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('draggable', 'false');
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
      });
    };

    const observer = new MutationObserver(() => protectImages());
    observer.observe(document.body, { childList: true, subtree: true });

    let devToolsOpen = false;
    const devToolsCheck = setInterval(() => {
      const threshold = 160;
      const detected =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;
      if (detected && !devToolsOpen) {
        devToolsOpen = true;
        document.querySelectorAll('img').forEach((img) => {
          (img as HTMLImageElement).style.filter = 'blur(12px)';
        });
      } else if (!detected && devToolsOpen) {
        devToolsOpen = false;
        document.querySelectorAll('img').forEach((img) => {
          (img as HTMLImageElement).style.filter = '';
        });
      }
    }, 500);

    let touchTimer: ReturnType<typeof setTimeout>;
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        touchTimer = setTimeout(() => e.preventDefault(), 500);
      }
    };
    const handleTouchEnd = () => clearTimeout(touchTimer);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    protectImages();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      clearInterval(devToolsCheck);
      observer.disconnect();
    };
  }, []);
}
