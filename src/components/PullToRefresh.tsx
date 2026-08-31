'use client';

import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
// Pulling further than the threshold keeps moving the indicator, but at a
// damped rate - a real finger-drag distance shouldn't map 1:1 past the
// point where release already triggers a refresh.
const DAMPING = 0.5;

/**
 * A touch-only pull-to-refresh gesture (mirrors native mobile apps) -
 * mounted once in the dashboard layout, wrapping the whole scrollable
 * page. Only engages when the page is already scrolled to the very top
 * (pulling down from there is unambiguous; anywhere else it's just a
 * normal scroll) and only listens to touch events, not mouse drag - a
 * mouse-drag equivalent would fight text selection and normal desktop
 * interactions in a way a touch gesture never does, and no real product
 * offers pull-to-refresh via mouse for that reason.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    function atTop(): boolean {
      return (document.scrollingElement?.scrollTop ?? window.scrollY) <= 0;
    }

    function handleTouchStart(e: TouchEvent) {
      if (!atTop() || refreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? null;
      pulling.current = false;
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;
      const currentY = e.touches[0]?.clientY ?? startY.current;
      const delta = currentY - startY.current;
      if (delta <= 0) {
        // Scrolled away from the top mid-gesture, or pulling up - bail
        // out cleanly rather than showing a stuck indicator.
        if (pulling.current) {
          pulling.current = false;
          setPullDistance(0);
        }
        return;
      }
      if (!atTop()) return;
      pulling.current = true;
      // Prevent the native overscroll bounce while we're driving our own
      // indicator off the same gesture - without this, iOS/Android both
      // still rubber-band the page underneath it.
      e.preventDefault();
      setPullDistance(Math.min(delta * DAMPING, MAX_PULL));
    }

    function handleTouchEnd() {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      pulling.current = false;
      startY.current = null;
      setPullDistance((current) => {
        if (current >= PULL_THRESHOLD) {
          setRefreshing(true);
          // A full reload, not a per-page refetch - this mounts once for
          // every page in the app, so it can't know each page's own
          // useAsyncData keys. A reload is also the closest real
          // equivalent to what pull-to-refresh means natively.
          window.location.reload();
        }
        return 0;
      });
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [refreshing]);

  const active = pullDistance > 0 || refreshing;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <>
      {active ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: Math.max(pullDistance - 32, 8),
            zIndex: 2000,
            pointerEvents: 'none',
            transition: refreshing ? 'padding-top 150ms ease' : undefined,
          }}
        >
          {/* .spinner already runs a continuous CSS rotation - only
              opacity/scale are ours to drive off the pull distance,
              since an inline transform would just be overridden by that
              keyframe animation every frame anyway. */}
          <span
            className="spinner"
            style={{
              opacity: refreshing ? 1 : progress,
              scale: refreshing ? 1 : 0.6 + progress * 0.4,
            }}
          />
        </div>
      ) : null}
      {children}
    </>
  );
}
