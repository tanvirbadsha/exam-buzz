"use client";

import { MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

const MENU_WIDTH = 192;
const VIEWPORT_GAP = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingActionMenu({
  ariaLabel,
  children,
  menuHeight = 176,
  triggerIcon = <MoreVertical size={18} />,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_GAP;
    const left = clamp(rect.right - MENU_WIDTH, VIEWPORT_GAP, maxLeft);
    const canOpenDown =
      rect.bottom + VIEWPORT_GAP + menuHeight <= window.innerHeight;
    const top = canOpenDown
      ? rect.bottom + VIEWPORT_GAP
      : Math.max(VIEWPORT_GAP, rect.top - menuHeight - VIEWPORT_GAP);

    setPosition({ left, top });
  }, [menuHeight]);

  const openMenu = () => {
    updatePosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleViewportChange = () => updatePosition();

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className="flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        className="icon-button h-9 w-9 border border-border"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
      >
        {triggerIcon}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${MENU_WIDTH}px`,
            }}
            className="fixed z-[100] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-xl ring-1 ring-slate-950/5"
          >
            {children({ closeMenu: () => setIsOpen(false) })}
          </div>,
          document.body,
        )}
    </div>
  );
}
