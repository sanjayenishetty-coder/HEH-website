"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks, site } from "@/data/site";
import { ButtonLink, Icon } from "@/components/ui";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          <Image src="/brand/logo.png" alt={site.name} width={448} height={136} priority className="h-11 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-navy" : "text-navy-700 hover:text-navy hover:bg-navy/5"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-4 -bottom-[13px] h-0.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/login" variant="secondary">Member login</ButtonLink>
          <ButtonLink href={site.applyUrl} external>Apply to join</ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2 text-navy hover:bg-navy/5 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white lg:hidden">
          <nav className="container-x flex flex-col py-3" aria-label="Mobile">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} onClick={close} className="rounded-lg px-3 py-3 text-base font-semibold text-navy hover:bg-cream">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4 pb-2">
              <ButtonLink href="/login" variant="secondary" size="lg">Member login</ButtonLink>
              <ButtonLink href={site.applyUrl} external size="lg">Apply to join</ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
