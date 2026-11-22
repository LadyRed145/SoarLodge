import { useEffect, useId, useRef, useState } from 'react';
import './SortControl.css';

const OPTIONS = [
  { value: 'name', label: 'Destino A–Z' },
  { value: 'country', label: 'País A–Z' },
  { value: 'region', label: 'Región A–Z' },
];

/** Selector de ordenamiento accesible; ordena datos locales sin nuevas peticiones. */
export default function SortControl({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsId = useId();
  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return undefined;
    const dismissOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const dismissEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissEscape);
    };
  }, [open]);

  const moveFocus = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(wrapperRef.current?.querySelectorAll('.sort-menu-option') ?? []);
    if (!open) {
      setOpen(true);
      return;
    }
    if (!buttons.length) return;
    const currentIndex = buttons.indexOf(document.activeElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : event.key === 'ArrowDown' ? (currentIndex + 1) % buttons.length
      : (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  };

  return <div className="sort-field">
    <span className="sort-field-label">Ordenar por</span>
    <div className="sort-menu" ref={wrapperRef} onKeyDown={moveFocus}>
      <button
        type="button"
        ref={triggerRef}
        className="sort-menu-trigger"
        aria-label={`Ordenar destinos: ${selected.label}`}
        aria-expanded={open}
        aria-controls={open ? optionsId : undefined}
        aria-haspopup="true"
        onClick={() => setOpen((previous) => !previous)}
      >
        <svg className="sort-menu-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v16m0-16L4 7m3-3 3 3M17 20V4m0 16-3-3m3 3 3-3"/>
        </svg>
        <span className="sort-menu-current">{selected.label}</span>
        <svg className={`sort-menu-chevron${open ? ' is-open' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && <div className="sort-menu-options" id={optionsId} role="group" aria-label="Opciones de ordenación">
        {OPTIONS.map((option) => <button
          key={option.value}
          type="button"
          className={`sort-menu-option${option.value === value ? ' is-selected' : ''}`}
          aria-pressed={option.value === value}
          onClick={() => {
            onChange(option.value);
            setOpen(false);
            triggerRef.current?.focus();
          }}
        >
          <span>{option.label}</span><span className="sort-menu-check" aria-hidden="true">{option.value === value ? '✓' : ''}</span>
        </button>)}
      </div>}
    </div>
  </div>;
}
