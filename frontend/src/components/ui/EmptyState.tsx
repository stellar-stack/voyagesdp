import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
        <Icon size={28} className="text-text-muted" />
      </div>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
