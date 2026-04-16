"use client";

import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-16 md:mt-24"
      style={{ borderTop: "1px solid var(--border)", background: "rgba(255,253,247,0.6)" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-12 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <span aria-hidden="true">📸</span>
            <span>{brand.name}</span>
          </div>
          <p className="text-sm max-w-xs" style={{ color: "var(--ink-2)" }}>
            {brand.tagline}
          </p>
        </div>

        <FooterCol title="Product">
          <FooterAnchor href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")}>
            How it works
          </FooterAnchor>
          <FooterAnchor
            href="https://github.com/920four4/snapvite-calendar-app/tree/main/chrome-extension"
            external
          >
            Chrome extension
          </FooterAnchor>
          <FooterLink href="/settings">Settings</FooterLink>
        </FooterCol>

        <FooterCol title="Trust">
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            Screenshots never stored
          </span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            Anon by default
          </span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            10 parses/day free
          </span>
        </FooterCol>

        <FooterCol title="Elsewhere">
          <FooterAnchor href={brand.social.twitter} external>Twitter</FooterAnchor>
          <FooterAnchor
            href="https://github.com/920four4/snapvite-calendar-app"
            external
          >
            GitHub
          </FooterAnchor>
        </FooterCol>
      </div>

      <div
        className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs"
        style={{ color: "var(--ink-3)", borderTop: "1px solid var(--border)" }}
      >
        <span>© {year} {brand.name}. Built for calendar nerds.</span>
        <span>Powered by Claude vision · Next.js · Resend</span>
      </div>
    </footer>
  );
}

function scrollToSection(
  e: React.MouseEvent<HTMLAnchorElement>,
  id: string
) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function FooterAnchor({
  href,
  external,
  onClick,
  children,
}: {
  href: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm hover:opacity-70 transition-opacity"
      style={{ color: "var(--ink-2)" }}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--ink-2)" }}>
      {children}
    </Link>
  );
}
