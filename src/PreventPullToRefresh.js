import { useEffect, useRef } from 'react';

export default function PreventPullToRefresh({ children }) {
  const startYRef = useRef(0);

  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      const scrollTop =
        document.scrollingElement?.scrollTop ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ??
        0;

      // 在頁面頂端且向下拉時，阻止預設行為（避免觸發下拉刷新）
      if (scrollTop <= 0 && deltaY > 0) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return children;
}