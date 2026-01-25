import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'

// Animated cleaning company illustration with subtle motion
export default function CleaningAnimation() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([])
  
  useEffect(() => {
    // Generate random floating bubbles
    const newBubbles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      size: 4 + Math.random() * 12,
    }))
    setBubbles(newBubbles)
  }, [])
  
  // Colors based on theme
  const fillColor = isDark ? '#60a5fa' : 'white'
  
  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950' 
        : 'bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900'
    }`}>
      {/* Floating bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute rounded-full animate-float ${isDark ? 'bg-primary-500/20' : 'bg-white/10'}`}
          style={{
            left: `${bubble.x}%`,
            bottom: '-20px',
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-white">
        {/* Cleaning icon illustration */}
        <div className="mb-8 relative">
          <svg
            viewBox="0 0 120 120"
            className="w-32 h-32 md:w-40 md:h-40"
            fill="none"
          >
            {/* Sparkle effects */}
            <g className="animate-pulse">
              <circle cx="20" cy="25" r="3" fill={fillColor} opacity="0.6" />
              <circle cx="100" cy="35" r="2" fill={fillColor} opacity="0.8" />
              <circle cx="85" cy="20" r="2.5" fill={fillColor} opacity="0.5" />
            </g>
            
            {/* Building/office shape */}
            <rect
              x="25"
              y="40"
              width="70"
              height="60"
              rx="4"
              fill={fillColor}
              opacity="0.15"
              className="animate-subtle-float"
            />
            
            {/* Windows */}
            <rect x="35" y="50" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            <rect x="55" y="50" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            <rect x="75" y="50" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            <rect x="35" y="70" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            <rect x="55" y="70" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            <rect x="75" y="70" width="12" height="12" rx="2" fill={fillColor} opacity="0.9" />
            
            {/* Spray bottle */}
            <g className="animate-spray origin-bottom">
              <rect x="8" y="60" width="14" height="30" rx="3" fill={fillColor} opacity="0.9" />
              <rect x="10" y="50" width="10" height="12" rx="1" fill={fillColor} opacity="0.7" />
              <rect x="11" y="45" width="4" height="6" rx="1" fill={fillColor} opacity="0.8" />
              {/* Spray particles */}
              <circle cx="22" cy="52" r="2" fill={fillColor} opacity="0.6" className="animate-ping" />
              <circle cx="28" cy="48" r="1.5" fill={fillColor} opacity="0.4" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              <circle cx="32" cy="55" r="1" fill={fillColor} opacity="0.3" className="animate-ping" style={{ animationDelay: '0.4s' }} />
            </g>
            
            {/* Broom/mop */}
            <g className="animate-sweep origin-bottom">
              <rect x="100" y="30" width="4" height="55" rx="2" fill={fillColor} opacity="0.9" transform="rotate(15, 102, 85)" />
              <ellipse cx="108" cy="88" rx="12" ry="6" fill={fillColor} opacity="0.7" transform="rotate(15, 108, 88)" />
            </g>
            
            {/* Shine effect */}
            <path
              d="M60 15 L62 25 L72 27 L62 29 L60 39 L58 29 L48 27 L58 25 Z"
              fill={fillColor}
              opacity="0.8"
              className="animate-twinkle"
            />
          </svg>
        </div>
        
        {/* Tagline */}
        <h2 className={`text-xl md:text-2xl font-semibold text-center mb-3 ${isDark ? 'text-white/90' : 'text-white/95'}`}>
          {t('landing.tagline')}
        </h2>
        <p className={`text-sm md:text-base text-center max-w-xs ${isDark ? 'text-gray-400' : 'text-white/70'}`}>
          {t('landing.subtitle')}
        </p>
        
        {/* Stats - shows placeholder until backend is connected */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-primary-400' : 'text-white/95'}`}>--</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-white/60'}`}>{t('landing.stats.sites')}</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-primary-400' : 'text-white/95'}`}>--</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-white/60'}`}>{t('landing.stats.agents')}</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-primary-400' : 'text-white/95'}`}>--</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-white/60'}`}>{t('landing.stats.zones')}</div>
          </div>
        </div>
        
        {/* Demo mode notice */}
        <div className={`mt-8 px-4 py-2 rounded-full text-xs font-medium ${isDark ? 'bg-primary-500/20 text-primary-300' : 'bg-white/10 text-white/80'}`}>
          {t('landing.demoMode')}
        </div>
      </div>
      
      {/* Gradient overlay at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-32 ${isDark ? 'bg-gradient-to-t from-gray-950/50 to-transparent' : 'bg-gradient-to-t from-primary-900/50 to-transparent'}`} />
      
      {/* Subtle pattern overlay */}
      <div 
        className={`absolute inset-0 ${isDark ? 'opacity-[0.02]' : 'opacity-5'}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes subtle-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes spray {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        
        @keyframes sweep {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-subtle-float {
          animation: subtle-float 4s ease-in-out infinite;
        }
        
        .animate-spray {
          animation: spray 2s ease-in-out infinite;
        }
        
        .animate-sweep {
          animation: sweep 3s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
