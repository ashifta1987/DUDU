import {
  BarChart3,
  Bell,
  BookOpen,
  Camera,
  Cpu,
  CreditCard,
  FileText,
  Home,
  IndianRupee,
  LayoutDashboard,
  Library,
  MoreHorizontal,
  NotebookPen,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** message key */
  key: string;
  icon: LucideIcon;
}

/** Parent web: left nav order from the prototype. */
export const PARENT_NAV: NavItem[] = [
  { href: "/app", key: "home", icon: Home },
  { href: "/app/study", key: "study", icon: BookOpen },
  { href: "/app/reminders", key: "reminders", icon: Bell },
  { href: "/app/monitor", key: "monitor", icon: Camera },
  { href: "/app/homework", key: "homework", icon: NotebookPen },
  { href: "/app/report", key: "report", icon: BarChart3 },
  { href: "/app/library", key: "library", icon: Library },
  { href: "/app/settings", key: "settings", icon: Settings },
];

/** Under 768px: five bottom tabs; the rest live under "More". */
export const PARENT_TABS: NavItem[] = [
  PARENT_NAV[0]!,
  PARENT_NAV[2]!,
  PARENT_NAV[3]!,
  PARENT_NAV[4]!,
  { href: "/app/more", key: "more", icon: MoreHorizontal },
];

export const PARENT_MORE: NavItem[] = PARENT_NAV.filter(
  (i) => !PARENT_TABS.some((t) => t.href === i.href),
);

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/devices", key: "devices", icon: Cpu },
  { href: "/admin/families", key: "families", icon: Users },
  { href: "/admin/content", key: "content", icon: FileText },
  { href: "/admin/subscriptions", key: "subscriptions", icon: CreditCard },
  { href: "/admin/ai-usage", key: "aiUsage", icon: IndianRupee },
  { href: "/admin/safety", key: "safety", icon: ShieldAlert },
];

/** Active if exact match for section roots, prefix match for nested pages. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/app" || href === "/admin") return pathname === href;
  if (href === "/app/more")
    return pathname === href || PARENT_MORE.some((i) => pathname.startsWith(i.href));
  return pathname === href || pathname.startsWith(href + "/");
}
