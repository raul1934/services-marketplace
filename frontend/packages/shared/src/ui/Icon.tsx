import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BatteryCharging,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronsRight,
  Clock,
  CornerUpRight,
  CreditCard,
  DollarSign,
  Droplet,
  GripVertical,
  Heart,
  Home,
  Key,
  List,
  type LucideIcon,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Minus,
  Navigation,
  PawPrint,
  Phone,
  Pin,
  Plus,
  Power,
  QrCode,
  Scissors,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Star,
  Truck,
  User,
  UserX,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../theme';

/** App icon names → lucide icons. Single source of truth for the icon set. */
const ICONS: Record<string, LucideIcon> = {
  arrowR: ArrowRight,
  back: ArrowLeft,
  battery: BatteryCharging,
  bell: Bell,
  briefcase: Briefcase,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  card: CreditCard,
  cash: Banknote,
  chat: MessageCircle,
  check: Check,
  chevronsR: ChevronsRight,
  clock: Clock,
  close: X,
  dollar: DollarSign,
  drop: Droplet,
  edit: SquarePen,
  filter: SlidersHorizontal,
  flash: Zap,
  fwd: CornerUpRight,
  grip: GripVertical,
  heart: Heart,
  home: Home,
  key: Key,
  list: List,
  menu: Menu,
  location: MapPin,
  mail: Mail,
  mic: Mic,
  minus: Minus,
  navigate: Navigation,
  paw: PawPrint,
  phone: Phone,
  pin: Pin,
  pix: QrCode,
  plus: Plus,
  power: Power,
  scissors: Scissors,
  search: Search,
  settings: Settings,
  shield: Shield,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  truck: Truck,
  user: User,
  userX: UserX,
  wifi: Wifi,
  wrench: Wrench,
};

export type IconName = keyof typeof ICONS;

/** Runtime list of registered icon names (for validating dynamic/backend names). */
export const ICON_NAMES: string[] = Object.keys(ICONS);

/**
 * Renders a lucide icon by app name. `color` sets the stroke; `fill="current"`
 * fills the glyph with the same color (for icons the design renders solid).
 */
export function Icon({
  name,
  size = 24,
  color,
  fill = 'none',
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  fill?: 'none' | 'current';
  strokeWidth?: number;
}) {
  const t = useTheme();
  const Comp = ICONS[name] ?? Search;
  const c = color ?? t.colors.ink;
  return <Comp size={size} color={c} strokeWidth={strokeWidth} fill={fill === 'current' ? c : 'none'} />;
}
