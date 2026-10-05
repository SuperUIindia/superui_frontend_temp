/**
 * Maps the `icon` string stored in MongoDB to a lucide-react component.
 *
 * Section content in the database stores icon names as strings (e.g. "Zod",
 * "ShieldCheck") rather than component references, so the admin dashboard can
 * edit them as plain JSON. Every section resolves its icons through this map.
 */
import {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Palette,
  Code,
  Code2,
  Server,
  Wrench,
  ShieldCheck,
  Cloud,
  Package,
  BookOpen,
  TrendingUp,
  Cpu,
  CreditCard,
  Network,
  Zap,
  HeartHandshake,
  Award,
  Sparkles,
  MessageSquareText,
  FileSpreadsheet,
  Rocket,
  CheckCircle,
  Layout,
  Database,
  Search,
  Smartphone,
  Layers,
  Target,
  Gauge,
  Boxes,
  GitBranch,
  Terminal,
  Lightbulb,
  Compass,
  Repeat,
  LifeBuoy
} from 'lucide-react';

export const ICON_MAP = {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Palette,
  Code,
  Code2,
  Server,
  Wrench,
  ShieldCheck,
  Cloud,
  Package,
  BookOpen,
  TrendingUp,
  Cpu,
  CreditCard,
  Network,
  Zap,
  HeartHandshake,
  Award,
  Sparkles,
  MessageSquareText,
  FileSpreadsheet,
  Rocket,
  CheckCircle,
  Layout,
  Database,
  Search,
  Smartphone,
  Layers,
  Target,
  Gauge,
  Boxes,
  GitBranch,
  Terminal,
  Lightbulb,
  Compass,
  Repeat,
  LifeBuoy
};

/** Every icon name an admin may type into a section's `icon` field. */
export const ICON_NAMES = Object.keys(ICON_MAP);

/**
 * Resolves an icon name to a component, falling back to `fallback` (default
 * Globe) so an unknown or missing name never crashes a section render.
 */
export function resolveIcon(name, fallback = Globe) {
  return ICON_MAP[name] || fallback;
}

export default ICON_MAP;