import {
  Briefcase,
  Code2,
  ExternalLink,
  Globe,
  GraduationCap,
  Languages,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  email: Mail,
  phone: Phone,
  'map-pin': MapPin,
  location: MapPin,
  github: Code2,
  globe: Globe,
  link: Link2,
  linkedin: Link2,
  user: User,
  about: User,
  skills: Wrench,
  education: GraduationCap,
  projects: Sparkles,
  experience: Briefcase,
  languages: Languages,
}

export function CvIcon({
  name,
  className,
  size = 14,
}: {
  name?: string
  className?: string
  size?: number
}) {
  const Icon = (name && ICON_MAP[name.toLowerCase()]) || Globe
  return <Icon className={className} size={size} strokeWidth={1.75} aria-hidden />
}

export function ExternalLinkIcon({ className }: { className?: string }) {
  return <ExternalLink className={className} size={12} strokeWidth={1.75} aria-hidden />
}
