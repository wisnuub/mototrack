import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface AdminEvent {
  id: string; title: string; category: string; event_date: string
  location: string; ticket_type: string; ticket_price?: number
  interested_count: number; attending_count: number; max_capacity?: number
}

const CATEGORIES = ['track_day', 'kopdar', 'touring', 'competition', 'workshop', 'launch', 'community']

export default function EventsPage() {
  const [events, setEvents]     = useState<AdminEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState(false)

  // Form state
  const [title, setTitle]           = useState('')
  const [category, setCategory]     = useState('kopdar')
  const [description, setDesc]      = useState('')
  const [date, setDate]             = useState('')
  const [location, setLocation]     = useState('')
  const [ticketType, setTType]      = useState<'free' | 'paid'>('free')
  const [ticketPrice, setTPrice]    = useState('')
  const [whatsapp, setWhatsapp]     = useState('')
  const [maxCap, setMaxCap]         = useState('')

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase.from('events').select('*').order('event_date')
    setEvents(data ?? [])
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('name, avatar, badges').eq('id', user!.id).single()

    await supabase.from('events').insert({
      organizer_id: user!.id,
      organizer_name: profile?.name ?? 'Unknown',
      organizer_avatar: profile?.avatar ?? '🏁',
      organizer_badges: profile?.badges ?? [],
      is_verified_org: true,
      category, title, description,
      event_date: new Date(date).toISOString(),
      location,
      ticket_type: ticketType,
      ticket_price: ticketType === 'paid' ? parseInt(ticketPrice) : null,
      whatsapp_number: whatsapp || null,
      max_capacity: maxCap ? parseInt(maxCap) : null,
      is_non_refundable: ticketType === 'paid',
    })
    setLoading(false)
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase?.from('events').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-2xl">Events</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900 rounded-2xl p-6 border border-white/5 mb-6 space-y-4">
          <h2 className="text-white font-semibold">Create Event</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date & Time *</label>
              <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Location *</label>
              <input required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ticket Type</label>
              <select value={ticketType} onChange={e => setTType(e.target.value as any)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {ticketType === 'paid' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Price (IDR)</label>
                <input type="number" value={ticketPrice} onChange={e => setTPrice(e.target.value)} placeholder="350000" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max Capacity</label>
              <input type="number" value={maxCap} onChange={e => setMaxCap(e.target.value)} placeholder="Optional" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">WhatsApp Number (for RSVP)</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="628123456789" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          {ticketType === 'paid' && (
            <p className="text-yellow-400 text-xs bg-yellow-400/10 rounded-xl px-3 py-2">
              ⚠️ Paid tickets are automatically marked as <strong>non-refundable</strong>. This will be shown to users before purchase.
            </p>
          )}
          <button type="submit" disabled={loading} className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Saving…' : 'Publish Event'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {events.length === 0 && <p className="text-gray-500 text-sm">No events yet. Create your first event above.</p>}
        {events.map(ev => (
          <div key={ev.id} className="bg-gray-900 rounded-2xl p-4 border border-white/5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{ev.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{ev.location} · {format(new Date(ev.event_date), 'd MMM yyyy')}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>👀 {ev.interested_count} interested</span>
                <span>✅ {ev.attending_count} attending</span>
                {ev.max_capacity && <span>📊 {ev.attending_count}/{ev.max_capacity} spots</span>}
                <span className={ev.ticket_type === 'paid' ? 'text-orange-400' : 'text-green-400'}>
                  {ev.ticket_type === 'paid' ? `Rp ${ev.ticket_price?.toLocaleString()}` : 'FREE'}
                </span>
              </div>
            </div>
            <button onClick={() => handleDelete(ev.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors flex-shrink-0">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
