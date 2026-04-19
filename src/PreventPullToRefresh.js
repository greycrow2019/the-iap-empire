import React, { useEffect, useRef } from 'react';

export default function PreventPullToRefresh({ children }) {
  const lastYRef = useRef(0);
  const scrollingInsideRef = useRef(false);

  useEffect(() => {
    function handleTouchStart(e) {
      if (e.touches.length !== 1) return;
      lastYRef.current = e.touches[0].clientY;

      // 檢查這次 touch 是否發生在「可滾動的內層區域」
      const el = e.target.closest('[data-scrollable="true"]');
      scrollingInsideRef.current = !!el;
    }

    function handleTouchMove(e) {
      if (e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const diffY = currentY - lastYRef.current;
      lastYRef.current = currentY;

      // 如果這次拖拉是發生在可滾動的內層區，交給內層自己處理
      if (scrollingInsideRef.current) {
        return;
      }

      // 只在 body 或整個 document 頂部下拉時，阻止預設的「pull-to-refresh」
      const scrollTop =
        document.scrollingElement?.scrollTop ?? document.body.scrollTop ?? 0;

      if (scrollTop === 0 && diffY > 0) {
        // 在頂部往下拉 → 阻止預設行為，避免瀏覽器下拉刷新
        e.preventDefault();
      }
    }

    // 必須 usePassive: false 才能 preventDefault
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return <>{children}</>;
}