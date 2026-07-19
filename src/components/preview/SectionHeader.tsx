import { CvIcon } from '@/components/icons'

export function SidebarSectionHeader({
  icon,
  label,
}: {
  icon: string
  label: string
}) {
  return (
    <header className="cv-section-header">
      <CvIcon name={icon} className="cv-section-header__icon" />
      <span className="cv-section-header__label">{label}</span>
      <span className="cv-section-header__bar" />
    </header>
  )
}

export function CenterSectionHeader({ label }: { label: string }) {
  return (
    <header className="cv-center-header">
      <span className="cv-center-header__rule" />
      <h2 className="cv-center-header__label">{label}</h2>
      <span className="cv-center-header__rule" />
    </header>
  )
}
