import { Sparkles } from 'lucide-react'

interface LogoProps {
  collapsed?: boolean
  className?: string
}

export default function Logo({ collapsed = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-primary-500/20 blur-lg -z-10" />
      </div>
      
      {/* Logo Text */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[var(--color-text)] leading-tight tracking-tight">
            Nettoyage
          </span>
          <span className="text-[10px] font-medium text-primary-500 uppercase tracking-widest -mt-0.5">
            Plus
          </span>
        </div>
      )}
    </div>
  )
}
