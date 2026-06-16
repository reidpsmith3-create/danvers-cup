"use client";

import Link from "next/link";
import { useState } from "react";

const primaryLinks = [
  {
    href: "/",
    label: "Home",
    icon: "🏠",
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: "📅",
  },
  {
    href: "/live",
    label: "Live",
    icon: "⛳",
  },
  {
    href: "/standings",
    label: "Standings",
    icon: "🏆",
  },
];

const moreLinks = [
  {
    href: "/players",
    label: "Players",
    icon: "👤",
  },
  {
    href: "/teams",
    label: "Teams",
    icon: "🛡️",
  },
  {
    href: "/history",
    label: "History",
    icon: "📚",
  },
  {
    href: "/admin",
    label: "Admin",
    icon: "⚙️",
  },
];

export default function BottomNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          <div className="fixed bottom-20 right-4 z-50 w-52 overflow-hidden rounded-3xl border border-white/10 bg-danvers-surface/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="p-2">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-danvers-text transition hover:bg-white/5"
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-semibold">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-danvers-border bg-danvers-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-danvers-muted transition hover:text-danvers-text"
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-danvers-muted transition hover:text-danvers-text"
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}