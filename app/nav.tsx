"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import type { Locale } from "@/lib/translations";

export default function Nav() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const links = [
    { href: "/", label: t("nav.tickets") },
    { href: "/admin", label: t("nav.scanner") },
  ];

  const toggleLang = () => {
    const next: Locale = locale === "es" ? "en" : "es";
    setLocale(next);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 mr-2">
          <img src="/diekpower-hero.jpg" alt="DiekPower" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-bold text-gray-900 text-sm tracking-tight">DiekPower</span>
        </Link>
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={toggleLang}
        className="text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
    </nav>
  );
}
