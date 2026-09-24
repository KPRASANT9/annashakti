"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Kitchen" },
  { href: "/lab", label: "Synthesis Lab" },
  { href: "/whoop", label: "WHOOP Metrics" },
  { href: "/science", label: "Science" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <Link href="/" className="brand">
        Annashakti <span>Food Tech</span>
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            data-active={
              l.href === "/"
                ? false
                : pathname.startsWith(l.href)
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
