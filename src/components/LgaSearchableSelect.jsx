import { useState, useRef, useEffect } from 'react';

export const OYO_LGAS = ['Oyo East', 'Oyo West', 'Afijio', 'Atiba'];

/**
 * Searchable dropdown component for selecting an Oyo State Local Government Area (LGA).
 * Allows typing to filter, but strictly selects from OYO_LGAS.
 */
export default function LgaSearchableSelect({ value, onChange, id = 'reg-lga', hasError = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal query when external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const filteredLgas = OYO_LGAS.filter((lga) =>
    lga.toLowerCase().includes(query.toLowerCase().trim())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // If query does not match any valid LGA, update parent with current query for validation
        if (query && !OYO_LGAS.includes(query)) {
          onChange(query);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [query, onChange]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelect = (lga) => {
    setQuery(lga);
    onChange(lga);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredLgas.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredLgas.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredLgas.length) {
        handleSelect(filteredLgas[highlightedIndex]);
      } else if (filteredLgas.length === 1) {
        handleSelect(filteredLgas[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isExactMatch = OYO_LGAS.includes(query);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search LGA (e.g. Oyo East, Afijio...)"
          autoComplete="off"
          className={`w-full border rounded-md px-3 py-2 text-sm text-naos-dark pr-16 focus:outline-none focus:ring-2 focus:ring-naos-green focus:border-transparent transition bg-white ${
            hasError ? 'border-red-500 bg-red-50/20' : 'border-naos-gray'
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition"
              aria-label="Clear LGA selection"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition"
            aria-label={isOpen ? 'Close LGA list' : 'Open LGA list'}
            tabIndex={-1}
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-naos-green' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10 border border-naos-gray/40 focus:outline-none text-sm"
        >
          <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-naos-text/60 border-b border-naos-gray/30 bg-naos-gray/20">
            Official Oyo State LGAs (4 Zones)
          </li>

          {filteredLgas.length > 0 ? (
            filteredLgas.map((lga, index) => {
              const selected = value === lga;
              const highlighted = highlightedIndex === index;

              return (
                <li
                  key={lga}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(lga)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer select-none transition-colors ${
                    highlighted ? 'bg-naos-green/10 text-naos-dark' : 'text-naos-dark'
                  } ${selected ? 'font-semibold text-naos-green bg-naos-green/5' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-naos-gold" />
                    {lga}
                  </span>
                  {selected && (
                    <svg className="h-4 w-4 text-naos-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-3 text-center text-xs text-red-600 bg-red-50/50">
              No matching LGA. Allowed: Oyo East, Oyo West, Afijio, Atiba.
            </li>
          )}
        </ul>
      )}

      {/* Selected Confirmation Pill */}
      {isExactMatch && (
        <p className="mt-1 text-[11px] text-naos-green flex items-center gap-1 font-medium">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Selected: {query}
        </p>
      )}
    </div>
  );
}
