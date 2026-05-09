import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { format } from 'date-fns'
import { useStore } from '../../store/useStore'
import { INDONESIA_CENTER } from '../../data/mockData'
import type { MotoEvent, BadgeType } from '../../types'

// ─── Event pin icon ──────────────────────────────────────────────────────────

function createEventPin(emoji: string, isPaid: boolean) {
  const color = isPaid ? '#ffd60a' : '#30d158'
  const svg = `
    <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 0C10 0 0 10 0 22c0 15 22 30 22 30S44 37 44 22C44 10 34 0 22 0z" fill="${color}"/>
      <circle cx="22" cy="21" r="14" fill="#0c0d13"/>
      <text x="22" y="26" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>
  `
  return L.divIcon({ html: svg, className: '', iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -52] })
}

// ─── Auto-fit map to event bounds ────────────────────────────────────────────

function FitBounds({ events }: { events: MotoEvent[] }) {
  const map = useMap()
  const coords = events.filter(e => e.locationCoords).map(e => [e.locationCoords!.lat, e.locationCoords!.lng] as [number, number])
  if (coords.length > 1) {
    try { map.fitBounds(coords, { padding: [40, 40], maxZoom: 11 }) } catch {}
  }
  return null
}

// ─── Badge chip (inline, no import from ExplorePanel) ───────────────────────

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  yamaha:   { label: 'Yamaha',   color: '#0a84ff' },
  honda:    { label: 'Honda',    color: '#ff453a' },
  kawasaki: { label: 'Kawasaki', color: '#30d158' },
  verified: { label: '✓ Verified', color: '#ff6b35' },
  brand:    { label: 'Brand',    color: '#bf5af2' },
}

function MiniChip({ badge }: { badge: BadgeType }) {
  const cfg = BADGE_CONFIG[badge]
  if (!cfg) return null
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.color + '22', border: `1px solid ${cfg.color}40` }}>
      {cfg.label}
    </span>
  )
}

// ─── Story preview card (9:16, compact) ─────────────────────────────────────

function StoryPreviewCard({ event, onClose, onOpen }: {
  event: MotoEvent
  onClose: () => void
  onOpen: () => void
}) {
  const interactions = useStore(s => s.eventInteractions)
  const isInterested = interactions.some(i => i.eventId === event.id && i.type === 'interested')
  const isAttending  = interactions.some(i => i.eventId === event.id && i.type === 'attending')

  const formatIDR = (n: number) =>
    n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}Jt` : `Rp ${n.toLocaleString('en-US')}`

  const categoryGradients: Record<string, string> = {
    track_day:   'from-yellow-900/80 via-orange-900/60 to-gray-950',
    kopdar:      'from-blue-900/80 via-indigo-900/60 to-gray-950',
    touring:     'from-green-900/80 via-teal-900/60 to-gray-950',
    competition: 'from-red-900/80 via-rose-900/60 to-gray-950',
    workshop:    'from-purple-900/80 via-violet-900/60 to-gray-950',
    launch:      'from-orange-900/80 via-amber-900/60 to-gray-950',
    community:   'from-cyan-900/80 via-sky-900/60 to-gray-950',
  }
  const grad = categoryGradients[event.category] ?? 'from-gray-900 via-gray-800 to-gray-950'

  return (
    // 9:16 ratio = width × 16/9. w-44 = 176px → 176 × 16/9 ≈ 313px
    <div className="w-44 rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col animate-slide-up"
         style={{ height: '312px' }}>

      {/* Cover — fills top ~55% */}
      <div className={`flex-1 relative bg-gradient-to-b ${grad} flex items-center justify-center`}>
        <span className="text-7xl opacity-70 select-none">{event.coverEmoji}</span>

        {/* Close */}
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold z-10"
        >
          ✕
        </button>

        {/* Organizer row at top */}
        <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
          <span className="text-sm">{event.organizerAvatar}</span>
          {event.organizerBadges.slice(0, 2).map(b => <MiniChip key={b} badge={b} />)}
        </div>

        {/* Attending badge */}
        {isAttending && (
          <div className="absolute bottom-2 left-2 bg-moto-green/90 rounded-full px-2 py-0.5 text-[9px] text-white font-bold">
            ✅ Going
          </div>
        )}
        {isInterested && !isAttending && (
          <div className="absolute bottom-2 left-2 bg-accent/90 rounded-full px-2 py-0.5 text-[9px] text-white font-bold">
            ★ Interested
          </div>
        )}
      </div>

      {/* Info panel — bottom ~45% */}
      <div className="bg-gray-950/95 px-3 py-2.5 flex flex-col gap-1.5 border-t border-white/5"
           style={{ minHeight: '140px' }}>
        <p className="text-white font-bold text-xs leading-tight line-clamp-2">{event.title}</p>

        <p className="text-gray-400 text-[10px] flex items-center gap-1">
          📅 {format(event.date, 'd MMM · HH:mm')}
        </p>
        <p className="text-gray-400 text-[10px] flex items-center gap-1 line-clamp-1">
          📍 {event.location}
        </p>

        <div className="flex items-center justify-between mt-0.5">
          {event.ticketType === 'paid' && event.ticketPrice ? (
            <span className="text-accent-amber text-xs font-bold">{formatIDR(event.ticketPrice)}</span>
          ) : (
            <span className="text-moto-green text-xs font-bold">FREE</span>
          )}
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
            <span>✓ {event.attendingCount}</span>
            <span>👀 {event.interestedCount}</span>
          </div>
        </div>

        <button
          onClick={onOpen}
          className="w-full bg-accent text-white text-[10px] font-bold py-2 rounded-xl mt-auto active:scale-95 transition-all"
        >
          View Details →
        </button>
      </div>
    </div>
  )
}

// ─── Events Map Panel ─────────────────────────────────────────────────────────

interface EventsMapPanelProps {
  events: MotoEvent[]
  onEventOpen: (event: MotoEvent) => void
}

export default function EventsMapPanel({ events, onEventOpen }: EventsMapPanelProps) {
  const [preview, setPreview] = useState<MotoEvent | null>(null)

  const eventsWithCoords = events.filter(e => e.locationCoords)

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">🗺️ Event Locations</p>

      <div className="relative rounded-2xl overflow-hidden border border-white/5" style={{ height: 220 }}>
        <MapContainer
          center={INDONESIA_CENTER}
          zoom={5}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full z-0"
          style={{ height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {eventsWithCoords.map(event => (
            <Marker
              key={event.id}
              position={[event.locationCoords!.lat, event.locationCoords!.lng]}
              icon={createEventPin(event.coverEmoji, event.ticketType === 'paid')}
              eventHandlers={{
                click: () => setPreview(p => p?.id === event.id ? null : event),
              }}
            />
          ))}

          {eventsWithCoords.length > 0 && <FitBounds events={eventsWithCoords} />}
        </MapContainer>

        {/* Story preview — floats over the map, right side */}
        {preview && (
          <div className="absolute top-3 right-3 z-10">
            <StoryPreviewCard
              event={preview}
              onClose={() => setPreview(null)}
              onOpen={() => { onEventOpen(preview); setPreview(null) }}
            />
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-[10px]">
            <span style={{ color: '#ffd60a' }}>●</span>
            <span className="text-gray-300">Paid</span>
          </div>
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-[10px]">
            <span style={{ color: '#30d158' }}>●</span>
            <span className="text-gray-300">Free</span>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-400">
            Tap pin to preview
          </div>
        </div>
      </div>
    </div>
  )
}
