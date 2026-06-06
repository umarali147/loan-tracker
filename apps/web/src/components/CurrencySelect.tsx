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
        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white flex items-center justify-between text-left hover:border-slate-400 transition"
      >
        <span className="truncate">
          <span className="font-semibold font-mono">{selected.code}</span>
          <span className="text-slate-500 ml-2">{selected.name}</span>
        </span>
        <span className="text-slate-400 ml-2">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-72">
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
            className="px-3 py-2 border-b border-slate-200 outline-none text-sm"
          />
          <ul ref={listRef} className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-slate-400 text-sm">
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
                      i === activeIdx ? "bg-teal-50" : ""
                    } ${c.code === value ? "font-semibold" : ""}`}
                  >
                    <span className="inline-block w-12 font-mono text-slate-900">
                      {c.code}
                    </span>
                    <span className="text-slate-700 flex-1 truncate">
                      {c.name}
                    </span>
                    <span className="text-slate-400 text-xs">{c.symbol}</span>
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
