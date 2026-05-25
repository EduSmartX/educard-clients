/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Drop-in replacement for lucide-react-native
 * Uses @expo/vector-icons (Ionicons/MaterialIcons) instead of react-native-svg
 * to avoid TurboModule crash in Expo Go
 */

import { Ionicons, Feather } from '@expo/vector-icons';
import React from 'react';

// Map lucide icon names to @expo/vector-icons equivalents
interface IconMapping {
  lib: typeof Ionicons | typeof Feather;
  name: string;
}
const iconMap: Record<string, IconMapping> = {
  // Navigation
  ChevronLeft: { lib: Ionicons, name: 'chevron-back' },
  ChevronRight: { lib: Ionicons, name: 'chevron-forward' },
  ChevronDown: { lib: Ionicons, name: 'chevron-down' },
  ChevronUp: { lib: Ionicons, name: 'chevron-up' },
  ArrowLeft: { lib: Ionicons, name: 'arrow-back' },
  ArrowRight: { lib: Ionicons, name: 'arrow-forward' },

  // Actions
  Save: { lib: Ionicons, name: 'save-outline' },
  Send: { lib: Ionicons, name: 'send' },
  Search: { lib: Ionicons, name: 'search' },
  Plus: { lib: Ionicons, name: 'add' },
  X: { lib: Ionicons, name: 'close' },
  Check: { lib: Ionicons, name: 'checkmark' },
  CheckCircle: { lib: Ionicons, name: 'checkmark-circle' },
  Edit: { lib: Feather, name: 'edit' },
  Trash: { lib: Ionicons, name: 'trash-outline' },
  RefreshCw: { lib: Ionicons, name: 'refresh' },
  Filter: { lib: Ionicons, name: 'filter' },
  MoreVertical: { lib: Ionicons, name: 'ellipsis-vertical' },
  MoreHorizontal: { lib: Ionicons, name: 'ellipsis-horizontal' },
  Download: { lib: Ionicons, name: 'download-outline' },
  Upload: { lib: Ionicons, name: 'cloud-upload-outline' },
  Copy: { lib: Ionicons, name: 'copy-outline' },

  // Auth/User
  User: { lib: Ionicons, name: 'person-outline' },
  Users: { lib: Ionicons, name: 'people-outline' },
  Mail: { lib: Ionicons, name: 'mail-outline' },
  Lock: { lib: Ionicons, name: 'lock-closed-outline' },
  Eye: { lib: Ionicons, name: 'eye-outline' },
  EyeOff: { lib: Ionicons, name: 'eye-off-outline' },
  KeyRound: { lib: Ionicons, name: 'key-outline' },
  Shield: { lib: Ionicons, name: 'shield-outline' },
  LogOut: { lib: Ionicons, name: 'log-out-outline' },
  LogIn: { lib: Ionicons, name: 'log-in-outline' },

  // Communication
  Phone: { lib: Ionicons, name: 'call-outline' },
  MessageCircle: { lib: Ionicons, name: 'chatbubble-outline' },
  Bell: { lib: Ionicons, name: 'notifications-outline' },
  BellRing: { lib: Ionicons, name: 'notifications' },

  // Content
  BookOpen: { lib: Ionicons, name: 'book-outline' },
  Book: { lib: Ionicons, name: 'book-outline' },
  GraduationCap: { lib: Ionicons, name: 'school-outline' },
  School: { lib: Ionicons, name: 'school-outline' },
  Briefcase: { lib: Ionicons, name: 'briefcase-outline' },
  Building: { lib: Ionicons, name: 'business-outline' },
  Building2: { lib: Ionicons, name: 'business-outline' },
  Calendar: { lib: Ionicons, name: 'calendar-outline' },
  CalendarDays: { lib: Ionicons, name: 'calendar' },
  Clock: { lib: Ionicons, name: 'time-outline' },
  FileText: { lib: Ionicons, name: 'document-text-outline' },
  FileTextIcon: { lib: Ionicons, name: 'document-text-outline' },
  File: { lib: Ionicons, name: 'document-outline' },
  FileIcon: { lib: Ionicons, name: 'document-outline' },
  Paperclip: { lib: Ionicons, name: 'attach-outline' },
  PaperclipIcon: { lib: Ionicons, name: 'attach-outline' },
  Folder: { lib: Ionicons, name: 'folder-outline' },
  Image: { lib: Ionicons, name: 'image-outline' },
  Camera: { lib: Ionicons, name: 'camera-outline' },

  // Layout / UI
  Home: { lib: Ionicons, name: 'home-outline' },
  Settings: { lib: Ionicons, name: 'settings-outline' },
  Menu: { lib: Ionicons, name: 'menu' },
  Grid: { lib: Ionicons, name: 'grid-outline' },
  Grid3x3: { lib: Ionicons, name: 'grid-outline' },
  List: { lib: Ionicons, name: 'list-outline' },
  LayoutDashboard: { lib: Ionicons, name: 'grid-outline' },
  Layers: { lib: Ionicons, name: 'layers-outline' },
  BarChart: { lib: Ionicons, name: 'bar-chart-outline' },
  TrendingUp: { lib: Ionicons, name: 'trending-up' },
  Activity: { lib: Ionicons, name: 'pulse-outline' },
  Clipboard: { lib: Ionicons, name: 'clipboard-outline' },
  ClipboardList: { lib: Ionicons, name: 'clipboard' },

  // Status
  AlertCircle: { lib: Ionicons, name: 'alert-circle-outline' },
  AlertTriangle: { lib: Ionicons, name: 'warning-outline' },
  Info: { lib: Ionicons, name: 'information-circle-outline' },
  HelpCircle: { lib: Ionicons, name: 'help-circle-outline' },
  CircleCheck: { lib: Ionicons, name: 'checkmark-circle-outline' },
  CircleX: { lib: Ionicons, name: 'close-circle-outline' },

  // Misc
  Star: { lib: Ionicons, name: 'star-outline' },
  Heart: { lib: Ionicons, name: 'heart-outline' },
  MapPin: { lib: Ionicons, name: 'location-outline' },
  Globe: { lib: Ionicons, name: 'globe-outline' },
  Wifi: { lib: Ionicons, name: 'wifi-outline' },
  QrCode: { lib: Ionicons, name: 'qr-code-outline' },
  Hash: { lib: Ionicons, name: 'text-outline' },
  Tag: { lib: Ionicons, name: 'pricetag-outline' },
  Link: { lib: Ionicons, name: 'link-outline' },
  ExternalLink: { lib: Ionicons, name: 'open-outline' },
  Share: { lib: Ionicons, name: 'share-outline' },
  Pencil: { lib: Ionicons, name: 'pencil' },

  // Additional icons
  UserCircle: { lib: Ionicons, name: 'person-circle-outline' },
  CalendarCheck: { lib: Ionicons, name: 'calendar' },
  CreditCard: { lib: Ionicons, name: 'card-outline' },
  ClipboardCheck: { lib: Ionicons, name: 'clipboard' },
  Award: { lib: Ionicons, name: 'ribbon-outline' },
  Moon: { lib: Ionicons, name: 'moon-outline' },
  Sun: { lib: Ionicons, name: 'sunny-outline' },
  Palette: { lib: Ionicons, name: 'color-palette-outline' },
  Languages: { lib: Ionicons, name: 'language-outline' },
  CircleHelp: { lib: Ionicons, name: 'help-circle-outline' },
  MessageSquare: { lib: Ionicons, name: 'chatbox-outline' },
  FileBarChart: { lib: Ionicons, name: 'stats-chart-outline' },
  Megaphone: { lib: Ionicons, name: 'megaphone-outline' },
  BarChart3: { lib: Ionicons, name: 'bar-chart-outline' },
  PieChart: { lib: Ionicons, name: 'pie-chart-outline' },
  Target: { lib: Ionicons, name: 'locate-outline' },
  Newspaper: { lib: Ionicons, name: 'newspaper-outline' },
  UserCog: { lib: Ionicons, name: 'person-outline' },
  Landmark: { lib: Ionicons, name: 'business-outline' },
  School2: { lib: Ionicons, name: 'school-outline' },
  SquareLibrary: { lib: Ionicons, name: 'library-outline' },
  BadgeCheck: { lib: Ionicons, name: 'checkmark-circle' },
  ShieldCheck: { lib: Ionicons, name: 'shield-checkmark-outline' },
  Wallet: { lib: Ionicons, name: 'wallet-outline' },
  Receipt: { lib: Ionicons, name: 'receipt-outline' },
  HandCoins: { lib: Ionicons, name: 'cash-outline' },
  Banknote: { lib: Ionicons, name: 'cash-outline' },
  IndianRupee: { lib: Ionicons, name: 'cash-outline' },
  DollarSign: { lib: Ionicons, name: 'cash-outline' },
  Percent: { lib: Ionicons, name: 'pricetag-outline' },
  XCircle: { lib: Ionicons, name: 'close-circle-outline' },
  CheckCircle2: { lib: Ionicons, name: 'checkmark-circle-outline' },
  BookMarked: { lib: Ionicons, name: 'bookmark-outline' },
  PencilLine: { lib: Ionicons, name: 'pencil' },
  UserPlus: { lib: Ionicons, name: 'person-add-outline' },
  UserCheck: { lib: Ionicons, name: 'person-outline' },
  UserX: { lib: Ionicons, name: 'person-remove-outline' },
  CirclePlus: { lib: Ionicons, name: 'add-circle-outline' },
  Minus: { lib: Ionicons, name: 'remove' },
  Loader2: { lib: Ionicons, name: 'reload' },
  RotateCcw: { lib: Ionicons, name: 'refresh' },
  SlidersHorizontal: { lib: Ionicons, name: 'options-outline' },
  Navigation: { lib: Ionicons, name: 'navigate-outline' },
  MapPinned: { lib: Ionicons, name: 'location' },
  ImageIcon: { lib: Ionicons, name: 'image-outline' },
  Edit3: { lib: Feather, name: 'edit-3' },
  Trash2: { lib: Ionicons, name: 'trash-outline' },

  // Additional icons for management screen
  CheckSquare: { lib: Ionicons, name: 'checkbox-outline' },
  PartyPopper: { lib: Ionicons, name: 'happy-outline' },

  // Additional icons for attendance screens
  TriangleAlert: { lib: Ionicons, name: 'warning-outline' },

  // Additional icons for insights
  TrendingDown: { lib: Ionicons, name: 'trending-down' },
  Lightbulb: { lib: Ionicons, name: 'bulb-outline' },
  ThumbsUp: { lib: Ionicons, name: 'thumbs-up-outline' },
  ArrowUpRight: { lib: Ionicons, name: 'arrow-up' },
  ArrowDownRight: { lib: Ionicons, name: 'arrow-down' },
};

interface IconProps {
  size?: number;
  color?: string;
  style?: import('react-native').StyleProp<import('react-native').TextStyle>;
}

function createIconComponent(lucideName: string) {
  const IconComponent = React.forwardRef<typeof Ionicons, IconProps>(
    ({ size = 24, color = '#000', style }, _ref) => {
      const mapping = iconMap[lucideName];
      if (!mapping) {
        // Fallback: render a generic icon
        return <Ionicons name="help-outline" size={size} color={color} style={style} />;
      }
      const Lib = mapping.lib as typeof Ionicons;
      const iconName = mapping.name as keyof typeof Ionicons.glyphMap;
      return <Lib name={iconName} size={size} color={color} style={style} />;
    }
  );
  IconComponent.displayName = lucideName;
  return IconComponent;
}

// Export all icons as named exports using a Proxy
// This way any `import { IconName } from 'lucide-react-native'` will work
const handler: ProxyHandler<Record<string, ReturnType<typeof createIconComponent>>> = {
  get(_target, prop: string) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return undefined;
    return createIconComponent(prop);
  },
};

const _allIcons = new Proxy({}, handler);

// Pre-create commonly used icons for better tree-shaking hints
export const ChevronLeft = createIconComponent('ChevronLeft');
export const ChevronRight = createIconComponent('ChevronRight');
export const ChevronDown = createIconComponent('ChevronDown');
export const ChevronUp = createIconComponent('ChevronUp');
export const ArrowLeft = createIconComponent('ArrowLeft');
export const ArrowRight = createIconComponent('ArrowRight');
export const Save = createIconComponent('Save');
export const Send = createIconComponent('Send');
export const Search = createIconComponent('Search');
export const Plus = createIconComponent('Plus');
export const X = createIconComponent('X');
export const Check = createIconComponent('Check');
export const CheckCircle = createIconComponent('CheckCircle');
export const Edit = createIconComponent('Edit');
export const Trash = createIconComponent('Trash');
export const RefreshCw = createIconComponent('RefreshCw');
export const Filter = createIconComponent('Filter');
export const User = createIconComponent('User');
export const Users = createIconComponent('Users');
export const Mail = createIconComponent('Mail');
export const Lock = createIconComponent('Lock');
export const Eye = createIconComponent('Eye');
export const EyeOff = createIconComponent('EyeOff');
export const KeyRound = createIconComponent('KeyRound');
export const Phone = createIconComponent('Phone');
export const BookOpen = createIconComponent('BookOpen');
export const Book = createIconComponent('Book');
export const GraduationCap = createIconComponent('GraduationCap');
export const School = createIconComponent('School');
export const Briefcase = createIconComponent('Briefcase');
export const Building = createIconComponent('Building');
export const Building2 = createIconComponent('Building2');
export const Calendar = createIconComponent('Calendar');
export const CalendarDays = createIconComponent('CalendarDays');
export const Clock = createIconComponent('Clock');
export const FileText = createIconComponent('FileText');
export const Home = createIconComponent('Home');
export const Settings = createIconComponent('Settings');
export const Menu = createIconComponent('Menu');
export const Grid = createIconComponent('Grid');
export const LayoutDashboard = createIconComponent('LayoutDashboard');
export const Layers = createIconComponent('Layers');
export const BarChart = createIconComponent('BarChart');
export const TrendingUp = createIconComponent('TrendingUp');
export const Activity = createIconComponent('Activity');
export const Clipboard = createIconComponent('Clipboard');
export const ClipboardList = createIconComponent('ClipboardList');
export const AlertCircle = createIconComponent('AlertCircle');
export const AlertTriangle = createIconComponent('AlertTriangle');
export const Info = createIconComponent('Info');
export const HelpCircle = createIconComponent('HelpCircle');
export const Star = createIconComponent('Star');
export const Heart = createIconComponent('Heart');
export const MapPin = createIconComponent('MapPin');
export const Bell = createIconComponent('Bell');
export const BellRing = createIconComponent('BellRing');
export const MessageCircle = createIconComponent('MessageCircle');
export const LogOut = createIconComponent('LogOut');
export const LogIn = createIconComponent('LogIn');
export const Shield = createIconComponent('Shield');
export const Image = createIconComponent('Image');
export const Camera = createIconComponent('Camera');
export const MoreVertical = createIconComponent('MoreVertical');
export const MoreHorizontal = createIconComponent('MoreHorizontal');
export const Download = createIconComponent('Download');
export const Upload = createIconComponent('Upload');
export const Copy = createIconComponent('Copy');
export const List = createIconComponent('List');
export const Grid3x3 = createIconComponent('Grid3x3');
export const Folder = createIconComponent('Folder');
export const Globe = createIconComponent('Globe');
export const Wifi = createIconComponent('Wifi');
export const QrCode = createIconComponent('QrCode');
export const Hash = createIconComponent('Hash');
export const Tag = createIconComponent('Tag');
export const Link = createIconComponent('Link');
export const ExternalLink = createIconComponent('ExternalLink');
export const Share = createIconComponent('Share');
export const Pencil = createIconComponent('Pencil');
export const PencilLine = createIconComponent('PencilLine');
export const UserPlus = createIconComponent('UserPlus');
export const UserCheck = createIconComponent('UserCheck');
export const UserX = createIconComponent('UserX');
export const CirclePlus = createIconComponent('CirclePlus');
export const CircleCheck = createIconComponent('CircleCheck');
export const CircleX = createIconComponent('CircleX');
export const Minus = createIconComponent('Minus');
export const Loader2 = createIconComponent('Loader2');
export const RotateCcw = createIconComponent('RotateCcw');

// File and attachment icons
export const File = createIconComponent('File');
export const FileIcon = createIconComponent('FileIcon');
export const FileTextIcon = createIconComponent('FileTextIcon');
export const Paperclip = createIconComponent('Paperclip');
export const PaperclipIcon = createIconComponent('PaperclipIcon');

// Additional icons used in the app
export const UserCircle = createIconComponent('UserCircle');
export const CalendarCheck = createIconComponent('CalendarCheck');
export const CreditCard = createIconComponent('CreditCard');
export const ClipboardCheck = createIconComponent('ClipboardCheck');
export const Award = createIconComponent('Award');
export const Moon = createIconComponent('Moon');
export const Sun = createIconComponent('Sun');
export const Palette = createIconComponent('Palette');
export const Languages = createIconComponent('Languages');
export const CircleHelp = createIconComponent('CircleHelp');
export const MessageSquare = createIconComponent('MessageSquare');
export const FileBarChart = createIconComponent('FileBarChart');
export const Megaphone = createIconComponent('Megaphone');
export const BarChart3 = createIconComponent('BarChart3');
export const PieChart = createIconComponent('PieChart');
export const Target = createIconComponent('Target');
export const Newspaper = createIconComponent('Newspaper');
export const UserCog = createIconComponent('UserCog');
export const Landmark = createIconComponent('Landmark');
export const School2 = createIconComponent('School2');
export const SquareLibrary = createIconComponent('SquareLibrary');
export const BadgeCheck = createIconComponent('BadgeCheck');
export const ShieldCheck = createIconComponent('ShieldCheck');
export const Wallet = createIconComponent('Wallet');
export const Receipt = createIconComponent('Receipt');
export const HandCoins = createIconComponent('HandCoins');
export const Banknote = createIconComponent('Banknote');
export const IndianRupee = createIconComponent('IndianRupee');
export const DollarSign = createIconComponent('DollarSign');
export const Percent = createIconComponent('Percent');
export const XCircle = createIconComponent('XCircle');
export const CheckCircle2 = createIconComponent('CheckCircle2');
export const BookMarked = createIconComponent('BookMarked');
export const SlidersHorizontal = createIconComponent('SlidersHorizontal');
export const Navigation = createIconComponent('Navigation');
export const MapPinned = createIconComponent('MapPinned');
export const ImageIcon = createIconComponent('ImageIcon');
export const Edit3 = createIconComponent('Edit3');
export const Trash2 = createIconComponent('Trash2');
export const CheckSquare = createIconComponent('CheckSquare');
export const PartyPopper = createIconComponent('PartyPopper');
export const TrendingDown = createIconComponent('TrendingDown');
export const Lightbulb = createIconComponent('Lightbulb');
export const ThumbsUp = createIconComponent('ThumbsUp');
export const ArrowUpRight = createIconComponent('ArrowUpRight');
export const ArrowDownRight = createIconComponent('ArrowDownRight');
export const TriangleAlert = createIconComponent('TriangleAlert');

// Type alias for LucideIcon used in typed icon props
export type LucideIcon = React.FC<IconProps>;

export default _allIcons;
