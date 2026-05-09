import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Stats { events: number; products: number; totalInterested: number; totalAttending: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ events: 0, products: 0, totalInterested: 0, totalAttending: 0 })

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('events').select('interested_count, attending_count'),
      supabase.from('products').select('id'),
    ]).then(([evRes, prRes]) => {
      const events = evRes.data ?? []
      setStats({
        events: events.length,
        products: prRes.data?.length ?? 0,
        totalInterested: events.reduce((s, e) => s + (e.interested_count ?? 0), 0),
        totalAttending: events.reduce((s, e) => s + (e.attending_count ?? 0), 0),
      })
    })
  }, [])

  const cards = [
    { label: 'Active Events',      value: stats.events,          icon: '🎫', color: 'text-orange-400' },
    { label: 'Products Listed',    value: stats.products,         icon: '🛒', color: 'text-blue-400' },
    { label: 'Total Interested',   value: stats.totalInterested,  icon: '👀', color: 'text-purple-400' },
    { label: 'Ticket Attendees',   value: stats.totalAttending,   icon: '✅', color: 'text-green-400' },
  ]

  return (
    <div>
      <h1 className="text-white font-bold text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 rounded-2xl p-5 border border-white/5">
            <p className="text-3xl mb-3">{c.icon}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 border border-white/5">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/events" className="flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold px-4 py-2.5 rounded-xl text-sm">
            🎫 Create Event
          </a>
          <a href="/products" className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold px-4 py-2.5 rounded-xl text-sm">
            🛒 Add Product
          </a>
          <a href="/tickets" className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 font-semibold px-4 py-2.5 rounded-xl text-sm">
            📊 View Sales
          </a>
        </div>
      </div>
    </div>
  )
}
