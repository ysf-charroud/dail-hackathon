"use client";

import { usePathname } from "next/navigation";
import PillNav, { type PillNavItem } from "./PillNav";
import { AuthButton } from "./auth-button";

const NAV_ITEMS: PillNavItem[] = [
  { label: "Overview", href: "/", ariaLabel: "Overview" },
  { label: "Applications", href: "/applications", ariaLabel: "Applications" },
  {
    label: "How it works",
    href: "/#how-it-works",
    ariaLabel: "How it works",
  },
  {
    label: "Evidence model",
    href: "/#evidence-model",
    ariaLabel: "Evidence model",
  },
  { label: "MCP setup", href: "/mcp", ariaLabel: "MCP setup" },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <>
    <PillNav
      logo="/images/schmitz-mark.png"
      logoAlt="Schmitz-Stiftungen"
      items={NAV_ITEMS}
        activeHref={pathname}
        baseColor="var(--card)"
        pillColor="var(--primary)"
        hoveredPillTextColor="var(--primary)"
        pillTextColor="var(--primary-foreground)"
      />
      <div className="fixed top-[4.25rem] right-4 z-40 md:right-8">
        <AuthButton />
      </div>
    </>
  );
}
