import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-accent-muted to-violet-500/10 border border-border flex items-center justify-center shadow-sm">
        <Icon size={32} className="text-accent" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-bold text-text-primary text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted max-w-[260px] leading-relaxed mx-auto">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
