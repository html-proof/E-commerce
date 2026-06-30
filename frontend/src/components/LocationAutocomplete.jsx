import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * LocationAutocomplete
 * ─────────────────────
 * A search-as-you-type location picker powered by OpenStreetMap Nominatim.
 * Covers every city, district, small town and village in the world.
 *
 * Props:
 *   value        {string}   – current text value (controlled)
 *   onChange     {fn}       – called with (label, {lat, lon, display_name}) when a suggestion is selected
 *   onInput      {fn}       – called with raw string as user types (for filter scenarios)
 *   placeholder  {string}
 *   required     {boolean}
 *   className    {string}   – extra class on the wrapper div
 *   inputClass   {string}   – extra class on the <input>
 *   small        {boolean}  – compact style (for sidebar filter)
 */
const LocationAutocomplete = ({
    value = '',
    onChange,
    onInput,
    placeholder = 'Search any city, district, town…',
    required = false,
    className = '',
    inputClass = '',
    small = false,
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // Keep internal query in sync when parent value changes (e.g. reset)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchSuggestions = useCallback(async (q) => {
        if (!q || q.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`geocode/?q=${encodeURIComponent(q)}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setSuggestions(data);
            setOpen(data.length > 0);
            setActiveIdx(-1);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (onInput) onInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelect = (item) => {
        setQuery(item.label);
        setSuggestions([]);
        setOpen(false);
        if (onChange) onChange(item.label, item);
        if (onInput) onInput(item.label);
    };

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0) handleSelect(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const inputBase = small
        ? 'w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white outline-none transition-colors'
        : 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none';

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                {/* Pin icon */}
                <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${small ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>

                <input
                    type="text"
                    className={`${inputBase} ${small ? 'pl-8' : 'pl-10 pr-10'} ${inputClass}`}
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
                    required={required}
                    autoComplete="off"
                />

                {/* Loading spinner / clear */}
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1`}>
                    {loading && (
                        <div className={`border-2 border-blue-400 border-t-transparent rounded-full animate-spin ${small ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    )}
                    {!loading && query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setSuggestions([]);
                                setOpen(false);
                                if (onChange) onChange('', null);
                                if (onInput) onInput('');
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className={`${small ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5 ${activeIdx === idx ? 'bg-blue-50' : ''}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setActiveIdx(idx)}
                            >
                                <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <div>
                                    <div className={`font-medium text-gray-800 ${small ? 'text-xs' : 'text-sm'}`}>{item.label}</div>
                                    {!small && item.display_name && item.display_name !== item.label && (
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{item.display_name}</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5">
                        <img src="https://www.openstreetmap.org/favicon.ico" alt="OSM" className="w-3 h-3 opacity-60" />
                        <span className="text-[10px] text-gray-400">Powered by OpenStreetMap</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationAutocomplete;
