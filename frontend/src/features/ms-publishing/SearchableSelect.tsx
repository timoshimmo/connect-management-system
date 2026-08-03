import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Lightweight searchable dropdown — type to filter, click to select. Used
 * for Reviewer/Approver pickers (see ReassignModal) where the user list can
 * get long enough that a plain <select> is slow to scan.
 */
export function SearchableSelect({ options, value, onChange, placeholder = 'Select...', disabled }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-gray-100 px-2.5 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400">No matches</li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    <span>
                      {o.label}
                      {o.sublabel && <span className="ml-1.5 text-xs text-gray-400">{o.sublabel}</span>}
                    </span>
                    {o.id === value && <Check className="h-3.5 w-3.5 shrink-0 text-brand-700" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
