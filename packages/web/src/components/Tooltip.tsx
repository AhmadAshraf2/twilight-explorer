'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8, // 8px offset below
      left: rect.left + rect.width / 2, // Center horizontally
    });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleFocus = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleBlur = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Always stop propagation to prevent parent click handlers
    e.stopPropagation();
    // On mobile, toggle on tap
    if (window.innerWidth < 768) {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
      } else {
        updatePosition();
        setIsOpen(true);
      }
    }
  };

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  // Close tooltip on outside click (mobile)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Only add on mobile
    if (window.innerWidth < 768) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className={className}
        tabIndex={0}
        role="button"
        aria-describedby={isOpen ? 'tooltip-content' : undefined}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            id="tooltip-content"
            role="tooltip"
            className="fixed z-50 pointer-events-none"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="bg-card border border-card-border rounded-[7px] px-3 py-2 shadow-card"
              style={{
                maxWidth: '200px',
              }}
            >
              <p className="text-[12.3px] leading-[18px] text-white font-sans">
                {content}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
