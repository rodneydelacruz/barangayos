import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  ({ options, value, onChange, placeholder = 'Search...', disabled, className, emptyMessage = 'No results found' }, ref) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const closeOnFocus = useRef(false);
    const selectedLabel = options.find((o) => o.value === value)?.label ?? '';
    const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { if (!open) setQuery(''); }, [open]);

    const handleSelect = useCallback((opt: ComboboxOption) => {
      onChange(opt.value);
      setOpen(false);
      closeOnFocus.current = true;
    }, [onChange]);

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            value={open ? query : selectedLabel}
            onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); if (value) onChange(''); }}
            onFocus={() => {
              if (closeOnFocus.current) { closeOnFocus.current = false; return; }
              setOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {value && (
            <button type="button" onClick={() => { onChange(''); setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-muted-foreground hover:text-foreground leading-none" aria-label="Clear">
              &times;
            </button>
          )}
        </div>
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => (
                <button key={opt.value} type="button" onClick={() => handleSelect(opt)}
                  className={cn('flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground', opt.value === value && 'bg-accent font-medium')}>
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);
Combobox.displayName = 'Combobox';
