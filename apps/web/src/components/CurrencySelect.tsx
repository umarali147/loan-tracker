"use client";

import { CURRENCIES, findCurrency } from "@loan/core";
import { useEffect, useMemo, useRef, useState } from "react";

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  id?: string;
}

export function CurrencySelect({ value, onChange, id }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = findCurrency(value) ?? CURRENCIES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  function commit(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-2.5 py-2 border border-gray-300 rounded-lg bg-white flex items-center gap-1.5 text-left hover:border-gray-400 transition text-sm"
      >
        <span className="text-gray-400">{selected.symbol}</span>
        <span className="font-semibold font-mono">{selected.code}</span>
        <span className="text-gray-400 ml-auto">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-72">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const pick = filtered[activeIdx];
                if (pick) commit(pick.code);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                setQuery("");
              }
            }}
            placeholder="Search by code or name…"
            className="px-3 py-2 border-b border-gray-200 outline-none text-sm"
          />
          <ul ref={listRef} className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-gray-400 text-sm">
                No matching currency
              </li>
            ) : (
              filtered.map((c, i) => (
                <li key={c.code}>
                  <button
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => commit(c.code)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 ${
                      i === activeIdx ? "bg-emerald-50" : ""
                    } ${c.code === value ? "font-semibold" : ""}`}
                  >
                    <span className="inline-block w-12 font-mono text-gray-900">
                      {c.code}
                    </span>
                    <span className="text-gray-700 flex-1 truncate">
                      {c.name}
                    </span>
                    <span className="text-gray-400 text-xs">{c.symbol}</span>
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
