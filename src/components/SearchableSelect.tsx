import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string; name?: string }; currentTarget: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options?: Array<SearchableOption | { id?: string | number; name?: string; title?: string; value?: string | number; label?: string }>;
  children?: React.ReactNode;
  allowClear?: boolean;
  minWidth?: string;
}

/**
 * Normalizes Arabic text by unifying alef, yaa, taa marbuta, and removing tashkeel.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يىئ]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و');
}

/**
 * Helper to recursively extract plain text from React children nodes
 */
function extractTextFromChildren(node: React.ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
  if (React.isValidElement(node) && (node.props as any)?.children) {
    return extractTextFromChildren((node.props as any).children);
  }
  return '';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  defaultValue,
  onChange,
  onValueChange,
  name,
  id,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث هنا...',
  options: optionsProp,
  children,
  allowClear = false,
  minWidth
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Parse options either from options prop or from <option> children
  const parsedOptions: SearchableOption[] = useMemo(() => {
    if (optionsProp && optionsProp.length > 0) {
      return optionsProp.map(opt => {
        const val = String((opt as any).value ?? (opt as any).id ?? '');
        const lbl = String((opt as any).label ?? (opt as any).name ?? (opt as any).title ?? val);
        return {
          value: val,
          label: lbl,
          subLabel: (opt as any).subLabel,
          badge: (opt as any).badge,
          disabled: Boolean((opt as any).disabled)
        };
      });
    }

    if (children) {
      const result: SearchableOption[] = [];
      React.Children.forEach(children, child => {
        if (!child) return;
        if (React.isValidElement(child)) {
          const props = child.props as any;
          // If option element
          if (child.type === 'option') {
            const val = String(props.value ?? '');
            const lbl = extractTextFromChildren(props.children) || val;
            result.push({
              value: val,
              label: lbl,
              disabled: Boolean(props.disabled)
            });
          } else if (props?.children) {
            // Group or fragment
            React.Children.forEach(props.children, subChild => {
              if (React.isValidElement(subChild)) {
                const subProps = subChild.props as any;
                if (subChild.type === 'option') {
                  const val = String(subProps.value ?? '');
                  const lbl = extractTextFromChildren(subProps.children) || val;
                  result.push({
                    value: val,
                    label: lbl,
                    disabled: Boolean(subProps.disabled)
                  });
                }
              }
            });
          }
        }
      });
      return result;
    }

    return [];
  }, [optionsProp, children]);

  // Current selected value
  const currentValue = value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : '';

  // Current selected option
  const selectedOption = useMemo(() => {
    return parsedOptions.find(o => String(o.value) === String(currentValue));
  }, [parsedOptions, currentValue]);

  // Filter options based on normalized Arabic search query
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return parsedOptions;
    const normSearch = normalizeArabic(searchText);
    return parsedOptions.filter(opt => {
      const normLabel = normalizeArabic(opt.label);
      const normVal = normalizeArabic(opt.value);
      const normSub = opt.subLabel ? normalizeArabic(opt.subLabel) : '';
      return (
        normLabel.includes(normSearch) ||
        normVal.includes(normSearch) ||
        normSub.includes(normSearch)
      );
    });
  }, [parsedOptions, searchText]);

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      setSearchText('');
    }
  }, [isOpen]);

  // Select an option
  const handleSelectOption = (opt: SearchableOption) => {
    if (opt.disabled) return;
    const syntheticEvent = {
      target: { value: opt.value, name: name || '' },
      currentTarget: { value: opt.value, name: name || '' }
    };
    if (onChange) onChange(syntheticEvent);
    if (onValueChange) onValueChange(opt.value);
    setIsOpen(false);
    setSearchText('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchText('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[activeIndex]) {
        handleSelectOption(filteredOptions[activeIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-right ${minWidth ? minWidth : 'w-full'}`}
      dir="rtl"
      onKeyDown={handleKeyDown}
    >
      {/* Hidden native input for form compatibility */}
      {name && <input type="hidden" name={name} id={id} value={currentValue} required={required} />}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-right ${
          className
            ? className
            : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-cyan-500/50'} ${
          isOpen ? 'ring-2 ring-cyan-500/30 border-cyan-500' : ''
        }`}
        aria-expanded={isOpen}
      >
        <span className="truncate flex-1">
          {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
        </span>

        <div className="flex items-center gap-1 shrink-0 mr-1.5 text-slate-400">
          {allowClear && selectedOption && !disabled && (
            <span
              onClick={e => {
                e.stopPropagation();
                handleSelectOption({ value: '', label: '' });
              }}
              className="hover:text-rose-500 p-0.5 rounded cursor-pointer"
              title="مسح الاختيار"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Popover with Sticky Search Bar */}
      {isOpen && (
        <div
          className="absolute z-[100] mt-1.5 right-0 w-full min-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
          style={{ maxHeight: '340px' }}
        >
          {/* Sticky Search Bar Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={e => {
                  setSearchText(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-8 pl-7 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Badge */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
              {filteredOptions.length}
            </span>
          </div>

          {/* Options Scrollable List */}
          <div
            ref={listRef}
            className="overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
            style={{ maxHeight: '240px' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400 font-bold">
                لا توجد نتائج مطابقة لـ &ldquo;{searchText}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(currentValue);
                const isActive = idx === activeIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black'
                        : isActive
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex flex-col flex-1 truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-400 font-normal">{opt.subLabel}</span>
                      )}
                    </div>

                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        {opt.badge}
                      </span>
                    )}

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0 ml-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
