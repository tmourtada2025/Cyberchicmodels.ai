import { useEffect } from 'react';

function showSecurityNotice() {
  if (document.getElementById('ccm-security-notice')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ccm-security-notice';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.85);z-index:999999;
    display:flex;align-items:center;justify-content:center;
    font-family:'Poppins',sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <div style="font-size:40px;margin-bottom:16px;">🔒</div>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111;">Content Protected</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
        All images and content on <strong>CyberChicModels.ai</strong> are protected by copyright.
        Unauthorized copying, downloading, or distribution is strictly prohibited.
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#888;">
        To license our models for commercial use, please contact us.
      </p>
      <button id="ccm-notice-close" style="background:#e11d48;color:#fff;border:none;border-radius:8px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;">
        I Understand
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('ccm-notice-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 5000);
}

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
        showSecurityNotice();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        showSecurityNotice();
      }
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
        showSecurityNotice();
      }
    };

    const protectImages = () => {
      document.querySelectorAll('img').forEach((img) => {
        img.setAttribute('draggable', 'false');
        img.addEventListener('contextmenu', (e) => { e.preventDefault(); showSecurityNotice(); });
        img.addEventListener('dragstart', (e) => { e.preventDefault(); showSecurityNotice(); });
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
        touchTimer = setTimeout(() => {
          e.preventDefault();
          showSecurityNotice();
        }, 500);
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
