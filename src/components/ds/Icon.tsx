// DS Icon: Lucide, same set the designs use (lucide@0.469 on the web → lucide-react-native here).
import {
  ArrowRight, Bell, BellOff, BellRing, BookA, BookOpen, BookPlus, Bookmark, BookmarkPlus, Calendar,
  CalendarCheck, CalendarDays, CalendarRange, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, Clock3, Cloud, CloudOff, CloudUpload, Copy, EllipsisVertical, Eye, EyeOff,
  FileCheck, FileText, FileX, Flag, Flame, FolderOpen, FolderSearch, Hash, Highlighter, House, Info,
  KeyRound, Languages, LayoutGrid, Library, List, LoaderCircle, Lock, LogOut, Mail, MailCheck, Medal,
  Minus, Moon, NotebookPen, PartyPopper, Plus, RefreshCw, ScrollText, Search, Settings, ShieldAlert,
  Sparkles, Sprout, StickyNote, Sun, Target, TrendingUp, TriangleAlert, Trash2, Trophy, Type, Upload,
  User, Volume2, WifiOff, X, type LucideIcon,
} from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';

const registry = {
  'arrow-right': ArrowRight, bell: Bell, 'bell-off': BellOff, 'bell-ring': BellRing, 'book-a': BookA,
  'book-open': BookOpen, 'book-plus': BookPlus, bookmark: Bookmark, 'bookmark-plus': BookmarkPlus,
  calendar: Calendar, 'calendar-check': CalendarCheck, 'calendar-days': CalendarDays,
  'calendar-range': CalendarRange, camera: Camera, check: Check, 'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'circle-alert': CircleAlert,
  'circle-check': CircleCheck, 'clock-3': Clock3, cloud: Cloud, 'cloud-off': CloudOff,
  'cloud-upload': CloudUpload, copy: Copy, 'ellipsis-vertical': EllipsisVertical, eye: Eye,
  'eye-off': EyeOff, 'file-check': FileCheck, 'file-text': FileText, 'file-x': FileX, flag: Flag,
  flame: Flame, 'folder-open': FolderOpen, 'folder-search': FolderSearch, hash: Hash,
  highlighter: Highlighter, house: House, info: Info, 'key-round': KeyRound, languages: Languages,
  'layout-grid': LayoutGrid, library: Library, list: List, 'loader-circle': LoaderCircle, lock: Lock,
  'log-out': LogOut, mail: Mail, 'mail-check': MailCheck, medal: Medal, minus: Minus, moon: Moon,
  'notebook-pen': NotebookPen, 'party-popper': PartyPopper, plus: Plus, 'refresh-cw': RefreshCw,
  'scroll-text': ScrollText, search: Search, settings: Settings, 'shield-alert': ShieldAlert,
  sparkles: Sparkles, sprout: Sprout, 'sticky-note': StickyNote, sun: Sun, target: Target,
  'trending-up': TrendingUp, 'triangle-alert': TriangleAlert, 'trash-2': Trash2, trophy: Trophy,
  type: Type, upload: Upload, user: User, 'volume-2': Volume2, 'wifi-off': WifiOff, x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof registry;

export type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 20, strokeWidth = 2.2, color = '#424f57', fill = 'none', style }: IconProps) {
  const Cmp = registry[name];
  return <Cmp size={size} strokeWidth={strokeWidth} color={color} fill={fill} style={style} />;
}
