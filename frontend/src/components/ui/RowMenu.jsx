import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function RowMenu({ items }) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(null);

  function place(nextOpen = open) {
    if (!nextOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 200;
    const height = menuRef.current?.offsetHeight || items.length * 38 + 12;
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const below = rect.bottom + 6;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 6) : below;
    setStyle({ top, left, width });
  }

  useEffect(() => {
    if (!open) return undefined;
    place(true);
    function onPointer(event) {
      if (buttonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReflow() {
      place(true);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, items.length]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`icon-btn ${open ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) {
              const rect = buttonRef.current.getBoundingClientRect();
              setStyle({ top: rect.bottom + 6, left: Math.max(8, rect.right - 200), width: 200 });
            }
            return next;
          });
        }}
      >
        <Icon name="more" />
      </button>
      {open
        ? createPortal(
            <div ref={menuRef} className="menu-pop" style={style || undefined} role="menu">
              {items.map((item) => {
                const className = `menu-item${item.danger ? " danger" : ""}`;
                if (item.to) {
                  return (
                    <Link
                      key={item.label}
                      className={className}
                      to={item.to}
                      target={item.target}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={className}
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
