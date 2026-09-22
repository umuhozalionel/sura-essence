import {
  Activity, AlertTriangle, AtSign, Banknote, Bed, Bus, Calendar, Camera, Car, CheckCircle2, Clock, Coffee, Compass,
  CreditCard, Crown, Eye, ExternalLink, Facebook, Fuel, Hospital, Info, Instagram, Landmark, Leaf, Linkedin, Mail, Map,
  MapPin, MessageCircle, Mountain, MousePointerClick, Navigation, Phone, Plane, Palette, Route, Search, Shield, ShieldCheck,
  ShoppingCart, Sparkles, Star, Sun, Target, Timer, TreePine, Twitter, Users, Utensils, Waves, Wifi, WifiHigh,
  Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * Icon names usable from messages/en.json and messages/fr.json.
 * A list item's "icon" field is looked up here, e.g. { "icon": "plane" }.
 * To use an icon that isn't listed yet, import it above and add one line below.
 */
export const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  alertTriangle: AlertTriangle,
  atSign: AtSign,
  banknote: Banknote,
  bed: Bed,
  bus: Bus,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  clock: Clock,
  compass: Compass,
  cart: ShoppingCart,
  checkCircle: CheckCircle2,
  coffee: Coffee,
  creditCard: CreditCard,
  crown: Crown,
  externalLink: ExternalLink,
  eye: Eye,
  facebook: Facebook,
  fuel: Fuel,
  hospital: Hospital,
  info: Info,
  instagram: Instagram,
  landmark: Landmark,
  leaf: Leaf,
  linkedin: Linkedin,
  mail: Mail,
  map: Map,
  mapPin: MapPin,
  messageCircle: MessageCircle,
  mountain: Mountain,
  navigation: Navigation,
  palette: Palette,
  phone: Phone,
  plane: Plane,
  route: Route,
  search: Search,
  pointer: MousePointerClick,
  shield: Shield,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  target: Target,
  timer: Timer,
  treePine: TreePine,
  twitter: Twitter,
  users: Users,
  utensils: Utensils,
  waves: Waves,
  wifi: Wifi,
  wifiHigh: WifiHigh,
  wrench: Wrench,
  zap: Zap,
};

/** Falls back to a neutral icon when a message uses a name that isn't in the list. */
export function getIcon(name?: string): LucideIcon {
  return (name && ICONS[name]) || Info;
}
