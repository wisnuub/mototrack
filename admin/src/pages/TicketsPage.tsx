import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface TicketRow {
  id: string
  event_id: string
  user_id: string
  type: string
  created_at: string
  events?: { title: string; ticket_price?: number }
  profiles?: { name: string; email: string }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('event_interactions')
      .select('*, events(title, ticket_price), profiles(name, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTickets(data ?? []))
  }, [])

  const attending = tickets.filter(t => t.type === 'attending')
  const interested = tickets.filter(t => t.type === 'interested')
  const revenue = attending.reduce((s, t) => s + (t.events?.ticket_price ?? 0), 0)

  return (
    <div>
      <h1 className="text-white font-bold text-2xl mb-6">Ticket Sales & Interactions</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Attending', value: attending.length, icon: '✅', color: 'text-green-400' },
          { label: 'Total Interested', value: interested.length, icon: '👀', color: 'text-purple-400' },
          { label: 'Estimated Revenue', value: `Rp ${revenue.toLocaleString()}`, icon: '💰', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-white/5">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-white font-semibold">All Interactions</h2>
        </div>
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">No interactions yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map(t => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.events?.title ?? t.event_id}</p>
                  <p className="text-gray-500 text-xs">{t.profiles?.name ?? t.user_id} · {t.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {t.type === 'attending' && t.events?.ticket_price && (
                    <span className="text-orange-400 text-xs font-semibold">Rp {t.events.ticket_price.toLocaleString()}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === 'attending' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {t.type}
                  </span>
                  <span className="text-gray-600 text-xs">{format(new Date(t.created_at), 'd MMM')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
