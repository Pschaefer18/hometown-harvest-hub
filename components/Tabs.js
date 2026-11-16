"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOutEverywhere } from "./AuthGate";

const TABS = [
  { href: "/orders", label: "Orders" },
  { href: "/members", label: "CSA" },
  { href: "/germination", label: "Germination" },
  { href: "/greenhouse", label: "Greenhouse" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <header className="topbar no-print">
      <div className="topbar-row">
        <span className="brand">Hometown Harvest Hub</span>
        <button className="link-btn" onClick={signOutEverywhere} title={auth.currentUser?.email}>
          Sign out
        </button>
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname.startsWith(t.href) ? "tab active" : "tab"}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
