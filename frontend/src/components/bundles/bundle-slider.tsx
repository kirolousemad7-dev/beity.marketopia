"use client";

import { useRef, useState, useEffect } from 'react';
import { Bundle } from '@/lib/types';
import { Dictionary } from '@/i18n/getDictionary';
import { Locale } from '@/i18n/config';
import BundleCard from './bundle-card';
import styles from './bundle_slider.module.css';

interface Props {
  bundles: Bundle[];
  lang: Locale;
  dict: Dictionary;
}

export default function BundleSlider({ bundles, lang, dict }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Reset and recalculate when locale changes
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // Reset to start
    el.scrollLeft = 0;
    setCurrentIndex(0);
    setIsAutoplay(true);

    // Small delay to allow DOM to update for RTL
    setTimeout(() => {
      updateArrows();
    }, 50);
  }, [lang]); // Re-run when language changes

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;

    // Get dimensions after DOM has settled
    const cardWidth = el.firstElementChild?.clientWidth || 500;
    const gap = 32;

    // RTL-aware scroll calculation
    const isRTL = document.documentElement.dir === 'rtl' || lang === 'ar';
    
    if (isRTL) {
      // For RTL: calculate from right edge
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft); // RTL gives negative values
      
      setCanScrollLeft(currentScroll > 10);
      setCanScrollRight(currentScroll < maxScroll - 10);
      
      const index = Math.round(currentScroll / (cardWidth + gap));
      setCurrentIndex(index);
    } else {
      // For LTR: normal calculation
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
      
      const index = Math.round(el.scrollLeft / (cardWidth + gap));
      setCurrentIndex(index);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;

    const cardWidth = el.firstElementChild?.clientWidth || 500;
    const gap = 32;
    const amount = cardWidth + gap;
    const isRTL = document.documentElement.dir === 'rtl' || lang === 'ar';

    if (isRTL) {
      // For RTL: reverse the direction
      const scrollAmount = direction === 'left' ? amount : -amount;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      // For LTR: normal direction
      const scrollAmount = direction === 'left' ? -amount : amount;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setIsAutoplay(false);
  };

  const scrollToIndex = (index: number) => {
    const el = trackRef.current;
    if (!el) return;

    const cardWidth = el.firstElementChild?.clientWidth || 500;
    const gap = 32;
    const isRTL = document.documentElement.dir === 'rtl' || lang === 'ar';

    if (isRTL) {
      // For RTL: scroll position is negative
      el.scrollTo({ left: -index * (cardWidth + gap), behavior: 'smooth' });
    } else {
      // For LTR: normal scroll position
      el.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' });
    }

    setIsAutoplay(false);
  };

  // Handle window resize to recalculate dimensions
  useEffect(() => {
    const handleResize = () => {
      updateArrows();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay + pause on hover
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !isAutoplay) return;

    let interval: any;
    const cardWidth = el.firstElementChild?.clientWidth || 500;
    const gap = 32;
    const amount = cardWidth + gap;
    const isRTL = document.documentElement.dir === 'rtl' || lang === 'ar';

    const start = () => {
      interval = setInterval(() => {
        if (isRTL) {
          const maxScroll = el.scrollWidth - el.clientWidth;
          const currentScroll = Math.abs(el.scrollLeft);

          if (currentScroll >= maxScroll - 10) {
            el.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            el.scrollBy({ left: -amount, behavior: 'smooth' });
          }
        } else {
          if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
            el.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            el.scrollBy({ left: amount, behavior: 'smooth' });
          }
        }
      }, 5000);
    };

    const stop = () => clearInterval(interval);
    const pause = () => {
      stop();
      setIsAutoplay(false);
    };
    const resume = () => {
      setIsAutoplay(true);
      start();
    };

    start();
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('scroll', updateArrows);

    return () => {
      clearInterval(interval);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('scroll', updateArrows);
    };
  }, [isAutoplay, lang]);

  // Drag to scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let hasMoved = false;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      const clickedElement = target.closest('a, button');

      if (clickedElement) {
        return;
      }
      isDown = true;
      hasMoved = false; // Reset on mousedown
      setIsAutoplay(false);
      el.classList.add(styles.dragging);
      const pageX = 'touches' in e ? e.touches[0].pageX : (e as MouseEvent).pageX;
      startX = pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onLeave = () => {
      isDown = false;
      el.classList.remove(styles.dragging);
    };

    const onUp = () => {
      isDown = false;
      el.classList.remove(styles.dragging);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDown) return;
      
      const pageX = 'touches' in e ? e.touches[0].pageX : (e as MouseEvent).pageX;
      const x = pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;

      // Only treat as drag if moved more than 5 pixels
      if (Math.abs(walk) > 5) {
        hasMoved = true;
        e.preventDefault(); // Prevent default text selection/scrolling only during active drags
        
        const isRTL = document.documentElement.dir === 'rtl' || lang === 'ar';
        el.scrollLeft = isRTL ? scrollLeft + walk : scrollLeft - walk;
      }
    };

    el.addEventListener('mousedown', onDown as any);
    el.addEventListener('touchstart', onDown as any);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('touchend', onUp);
    el.addEventListener('mousemove', onMove as any);
    el.addEventListener('touchmove', onMove as any, { passive: false });

    return () => {
      el.removeEventListener('mousedown', onDown as any);
      el.removeEventListener('touchstart', onDown as any);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('mousemove', onMove as any);
      el.removeEventListener('touchmove', onMove as any);
    };
  }, [lang]);

  return (
    <div className={styles.sliderWrapper}>
      <div ref={trackRef} className={styles.track} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {bundles.map((bundle, index) => (
          <div
            key={bundle.id}
            className={styles.slide}
            style={{ animationDelay: `${index * 80}ms` }}>
            <BundleCard key={bundle.id} bundle={bundle} lang={lang} dict={dict} />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className={`${styles.navBtn} ${styles.prev}`}
          aria-label="Previous bundle"
          title="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className={`${styles.navBtn} ${styles.next}`}
          aria-label="Next bundle"
          title="Next"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      <div className={styles.dots}>
        {bundles.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={`${styles.dot} ${currentIndex === i ? styles.dotActive : ''}`}
            aria-label={`Go to bundle ${i + 1}`}
            aria-current={currentIndex === i}
          />
        ))}
      </div>
    </div>
  );
}