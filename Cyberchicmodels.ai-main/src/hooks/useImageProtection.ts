import { useEffect } from 'react';

function showSecurityNotice() {
  if (document.getElementById('ccm-security-notice')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ccm-security-notice';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);"><div style="font-size:40px;margin-bottom:16px;">&#128274;</div><h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111;">Content Protected</h2><p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">All images and content on <strong>CyberChicModels.ai</strong> are protected by copyright. Unauthorized copying, downloading, or distribution is strictly prohibited.</p><p style="margin:0 0 24px;font-size:13px;color:#888;">To license our models for commercial use, please contact us.</p><button id="ccm-notice-close" style="background:#e11d48;color:#fff;border:none;border-radius:8px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;">I Understand</button></div>';
  document.body.appendChild(overlay);
  const closeBtn = document.getElementById('ccm-notice-close');
  if (closeBtn) closeBtn.onclick = function() { overlay.remove(); };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 6000);
}

function addShield(img: HTMLImageElement) {
  if (img.dataset.ccmProtected) return;
  img.dataset.ccmProtected = 'true';
  img.setAttribute('draggable', 'false');
  const parent = img.parentElement;
  if (!parent) return;
  const pos = getComputedStyle(parent).position;
  if (pos === 'static') parent.style.position = 'relative';
  const shield = document.createElement('div');
  shield.className = 'ccm-shield';
  shield.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;cursor:default;-webkit-user-select:none;user-select:none;';
  shield.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    showSecurityNotice();
  });
  shield.addEventListener('dragstart', function(e) {
    e.preventDefault();
    e.stopPropagation();
    showSecurityNotice();
  });
  let touchTimer: ReturnType<typeof setTimeout>;
  shield.addEventListener('touchstart', function(e) {
    touchTimer = setTimeout(function() {
      e.preventDefault();
      showSecurityNotice();
    }, 500);
  }, { passive: false });
  shield.addEventListener('touchend', function() { clearTimeout(touchTimer); });
  shield.addEventListener('touchmove', function() { clearTimeout(touchTimer); });
  parent.appendChild(shield);
}

export function useImageProtection() {
  useEffect(() => {
    const handleKeyDown = function(e: KeyboardEvent) {
      const blocked =
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
   0    (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        e.key === 'F12' ||
        e.key === 'PrintScreen';
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice();
      }
    };

    const handleContextMenu = function(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const blocked =
        target.tagName === 'IMG' ||
        target.classList.contains('ccm-shield') ||
        !!target.closest('[class*="hero"]') ||
        !!target.closest('[class*="carousel"]') ||
        !!target.closest('[class*="card"]') ||
        !!target.closest('[class*="modal"]') ||
        !!target.closest('[class*="collection"]') ||
        !!target.closest('[class*="style"]');
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice();
      }
    };

    const protectImages = function() {
      const images = document.querySelectorAll('img');
      images.forEach(function(img) {
        img.setAttribute('draggable', 'false');
        if (!img.dataset.ccmProtected) addShield(img as HTMLImageElement);
      });
    };

    let devToolsOpen = false;
    const devToolsCheck = setInterval(function() {
      const threshold = 160;
      const detected =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;
      if (detected && !devToolsOpen) {
        devToolsOpen = true;
        document.querySelectorAll('img').forEach(function(img) {
          (img as HTMLImageElement).style.filter = 'blur(12px)';
        });
      } else if (!detected && devToolsOpen) {
        devToolsOpen = false;
        document.querySelectorAll('img').forEach(function(img) {
          (img as HTMLImageElement).style.filter = '';
     0  });
      }
    }, 500);

    const observer = new MutationObserver(function() { protectImages(); });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown);
    protectImages();

    return function() {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsCheck);
      observer.disconnect();
      document.querySelectorAll('.ccm-shield').forEach(function(s) { s.remove(); });
    };
  }, []);
}
