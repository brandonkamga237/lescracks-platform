import { Award, BookOpen, CalendarCheck, Code, Flame, Heart, Lightbulb, Medal, Megaphone, Rocket, Shield, Sparkles, Star, Trophy, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The icon keys a badge may use: the same list the API accepts (BadgeServiceImpl.ICONS). */
export const BADGE_ICONS: Record<string, LucideIcon> = {
  award: Award,
  trophy: Trophy,
  medal: Medal,
  code: Code,
  'calendar-check': CalendarCheck,
  sparkles: Sparkles,
  star: Star,
  flame: Flame,
  heart: Heart,
  rocket: Rocket,
  megaphone: Megaphone,
  shield: Shield,
  lightbulb: Lightbulb,
  users: Users,
  'book-open': BookOpen,
};
