import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  icon: '📊' },
  { to: '/events',    label: 'Events',      icon: '🎫' },
  { to: '/products',  label: 'Products',    icon: '🛒' },
  { to: '/tickets',   label: 'Ticket Sales',icon: '🎟️' },
]

export default function Layout({ children, session }: { children: React.ReactNode; session: any }) {
  const email = session?.user?.email ?? ''

  const signOut = async () => {
    await supabase?.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-white/5 flex flex-col">
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-white font-bold text-base">
            <span className="text-white">Moto</span>
            <span className="text-orange-500">Track</span>
            <span className="text-gray-500 font-normal text-xs ml-1">Admin</span>
          </p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-orange-500/15 text-orange-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {n.icon} {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-gray-500 text-xs truncate mb-2">{email}</p>
          <button onClick={signOut} className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
