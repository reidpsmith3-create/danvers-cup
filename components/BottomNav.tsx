import Link from "next/link";

const links = [
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
    href: "/competitions",
    label: "Events",
    icon: "🎯",
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

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-danvers-border bg-danvers-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-danvers-muted transition hover:text-danvers-text"
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}