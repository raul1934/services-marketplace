import React from 'react';
import { ColorValue } from 'react-native';
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
  Eye,
  EyeOff,
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

/**
 * App icon names → lucide icons. Single source of truth for the icon set.
 *
 * `satisfies` (not `: Record<string, LucideIcon>`) is load-bearing: an
 * annotation would widen `keyof typeof ICONS` to `string`, making `IconName`
 * meaningless and letting a typo'd name through to the runtime fallback.
 */
const ICONS = {
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
  eye: Eye,
  eyeOff: EyeOff,
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
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Runtime list of registered icon names (for validating dynamic/backend names). */
export const ICON_NAMES: string[] = Object.keys(ICONS);

/** Narrows an untrusted name (backend/i18n/older-app payload) to a real icon. */
export function isIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}

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
  name: IconName;
  size?: number;
  /** RN's canonical colour type, so navigation's `tabBarIcon({ color })` passes straight through. */
  color?: ColorValue;
  fill?: 'none' | 'current';
  strokeWidth?: number;
}) {
  const t = useTheme();
  const Comp: LucideIcon = ICONS[name] ?? Search;
  // lucide types `color` as a plain string; ColorValue only differs for
  // PlatformColor/DynamicColorIOS, which we never pass. Cast once, here.
  const c = (color ?? t.colors.ink) as string;
  return <Comp size={size} color={c} strokeWidth={strokeWidth} fill={fill === 'current' ? c : 'none'} />;
}
