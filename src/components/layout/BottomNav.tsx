import { useStore } from '../../store/useStore'
import type { TabId } from '../../types'

interface NavItem {
  id: TabId
  label: string
  icon: string
  activeIcon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'map',     label: 'Ride',    icon: '🗺️',  activeIcon: '🗺️' },
  { id: 'chat',    label: 'Chat',    icon: '💬',  activeIcon: '💬' },
  { id: 'explore', label: 'Explore', icon: '🔭',  activeIcon: '🔭' },
  { id: 'garage',  label: 'Garage',  icon: '🔧',  activeIcon: '🔧' },
  { id: 'weather', label: 'Weather', icon: '🌤️',  activeIcon: '🌤️' },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const chatUnread = useStore(s => s.conversations.reduce((n, c) => n + c.unreadCount, 0))

  return (
    <nav className="flex-shrink-0 bg-bg-secondary border-t border-white/8 px-2 pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active
          const badge = item.id === 'chat' && chatUnread > 0 ? chatUnread : 0
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex-1 flex flex-col items-center py-2.5 transition-all relative ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
            >
              <span className="relative inline-block">
                <span className="text-xl">{isActive ? item.activeIcon : item.icon}</span>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-accent rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-accent' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
