"use client";

import { usePathname } from "next/navigation";
import PillNav, { type PillNavItem } from "./PillNav";

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
    <PillNav
      logo="/logo-mark.png"
      logoAlt="EvidenceFlow home"
      items={NAV_ITEMS}
      activeHref={pathname}
      baseColor="var(--card)"
      pillColor="var(--primary)"
      hoveredPillTextColor="var(--primary)"
      pillTextColor="var(--primary-foreground)"
    />
  );
}
