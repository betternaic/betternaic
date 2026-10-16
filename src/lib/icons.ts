// Named icon registry: imports only the icons the YAML data refers to, so the
// bundle does not pull in all of lucide-react.
import { createElement } from 'react';
import {
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  HardHat,
  HeartHandshake,
  IdCard,
  Landmark,
  Recycle,
  ShieldAlert,
  Stethoscope,
  Wheat,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  HardHat,
  HeartHandshake,
  IdCard,
  Landmark,
  Recycle,
  ShieldAlert,
  Stethoscope,
  Wheat,
};

export function getIcon(name: string): LucideIcon {
  return icons[name] ?? CircleHelp;
}

/** Renders a registered icon by name. */
export function NamedIcon({ name, className }: { name: string; className?: string }) {
  return createElement(getIcon(name), { className, 'aria-hidden': true });
}
