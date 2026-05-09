import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Heart, Bookmark, MapPin, Clock, Zap, Users, Eye, EyeOff, Star, ChevronRight, ExternalLink, Ticket, ShoppingBag, X } from 'lucide-react'
import type { TripTemplate, Attraction, MotoEvent, ShopProduct, CommunityMod, BadgeType, InstagramPost, InstagramAccount } from '../../types'
import { MOCK_ATTRACTIONS, MOCK_COMMUNITY_MODS } from '../../data/mockData'
import EventsMapPanel from './EventsMapPanel'
import { formatDistanceToNow, format } from 'date-fns'

// ─── Ride History ──────────────────────────────────────────────────────────────

const RIDE_HISTORY = [
  { id: 'rh1', title: 'Kintamani Sunrise Ride', date: new Date('2024-04-10T05:30:00'), distanceKm: 68.4, durationMin: 185, avgSpeedKmh: 58, maxSpeedKmh: 87, weather: 'Partly cloudy, 22°C', traffic: 'Light', riders: ['Sato', 'Rizal', 'Iqbal'], isPrivate: false, route: 'Jimbaran → Denpasar → Ubud → Kintamani', emoji: '🌋' },
  { id: 'rh2', title: 'Solo Morning Run — Uluwatu', date: new Date('2024-04-07T06:00:00'), distanceKm: 41.2, durationMin: 70, avgSpeedKmh: 64, maxSpeedKmh: 92, weather: 'Clear, 28°C', traffic: 'Very light', riders: [], isPrivate: true, route: 'Jimbaran → Pecatu → Uluwatu', emoji: '🌊' },
  { id: 'rh3', title: 'Tanah Lot Sunset Group Run', date: new Date('2024-04-03T15:00:00'), distanceKm: 38.9, durationMin: 95, avgSpeedKmh: 52, maxSpeedKmh: 78, weather: 'Sunny, 31°C', traffic: 'Moderate', riders: ['Sato', 'Wayan'], isPrivate: false, route: 'Denpasar → Tabanan → Tanah Lot', emoji: '🌅' },
]

type ExploreTab = 'discover' | 'events' | 'shop' | 'routes' | 'feed' | 'brands'

// ─── Brand badge config ──────────────────────────────────────────────────────

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  yamaha:     { label: 'Yamaha',   color: '#0a84ff', bg: '#0a84ff18' },
  honda:      { label: 'Honda',    color: '#ff453a', bg: '#ff453a18' },
  kawasaki:   { label: 'Kawasaki', color: '#30d158', bg: '#30d15818' },
  suzuki:     { label: 'Suzuki',   color: '#ff9500', bg: '#ff950018' },
  ktm:        { label: 'KTM',      color: '#ff6b35', bg: '#ff6b3518' },
  bmw:        { label: 'BMW',      color: '#0a84ff', bg: '#0a84ff18' },
  ducati:     { label: 'Ducati',   color: '#ff453a', bg: '#ff453a18' },
  triumph:    { label: 'Triumph',  color: '#ffd60a', bg: '#ffd60a18' },
  verified:   { label: '✓ Verified', color: '#ff6b35', bg: '#ff6b3518' },
  brand:      { label: 'Brand',    color: '#bf5af2', bg: '#bf5af218' },
  dev:        { label: 'Dev',      color: '#bf5af2', bg: '#bf5af218' },
  founder:    { label: 'Founder',  color: '#bf5af2', bg: '#bf5af218' },
  influencer: { label: 'Creator',  color: '#ffd60a', bg: '#ffd60a18' },
}

function BadgeChip({ badge, size = 'sm' }: { badge: BadgeType; size?: 'sm' | 'xs' }) {
  const cfg = BADGE_CONFIG[badge]
  if (!cfg) return null
  return (
    <span
      className={`font-semibold rounded-full px-1.5 py-0.5 ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}40` }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Format IDR ──────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}Jt`
  return `Rp ${n.toLocaleString('en-US')}`
}

// ─── EventDetailModal ─────────────────────────────────────────────────────────

function EventDetailModal({ event, onClose }: { event: MotoEvent; onClose: () => void }) {
  const eventInteractions = useStore(s => s.eventInteractions)
  const toggleInterest = useStore(s => s.toggleEventInterest)
  const markAttending = useStore(s => s.markEventAttending)

  const isInterested = eventInteractions.some(i => i.eventId === event.id && i.type === 'interested')
  const isAttending  = eventInteractions.some(i => i.eventId === event.id && i.type === 'attending')

  const handleBuy = () => {
    markAttending(event.id)
    const url = event.ticketUrl ?? (event.whatsappNumber
      ? `https://wa.me/${event.whatsappNumber}?text=${encodeURIComponent(`Halo, saya ingin daftar event: ${event.title}`)}`
      : null)
    if (url) window.open(url, '_blank', 'noopener noreferrer')
  }

  const categoryLabels: Record<string, string> = {
    track_day: '🏁 Track Day', kopdar: '👥 Kopdar', touring: '🗺️ Touring',
    competition: '🏆 Competition', workshop: '🔧 Workshop', launch: '🚀 Launch', community: '🤝 Community',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <span className="text-xs text-accent font-semibold">{categoryLabels[event.category]}</span>
              <h2 className="text-white font-bold text-lg leading-tight mt-1">{event.title}</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-gray-400 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-base flex-shrink-0">
              {event.organizerAvatar}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{event.organizerName}</p>
            </div>
            <div className="flex items-center gap-1 ml-1 flex-wrap">
              {event.organizerBadges.map(b => <BadgeChip key={b} badge={b} />)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Cover */}
          <div
            className="w-full h-36 rounded-2xl flex items-center justify-center text-7xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #ff6b3520 0%, #0a84ff15 100%)' }}
          >
            <span>{event.coverEmoji}</span>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-xs">
                <span className="text-gray-300">👀</span>
                <span className="text-white font-semibold">{event.interestedCount.toLocaleString()}</span>
                <span className="text-gray-400">interested</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-xs">
                <span className="text-moto-green">✓</span>
                <span className="text-white font-semibold">{event.attendingCount.toLocaleString()}</span>
                <span className="text-gray-400">going</span>
              </div>
            </div>
          </div>

          {/* Date & Location */}
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-white font-semibold text-sm">{format(event.date, "EEEE, d MMMM yyyy")}</p>
                <p className="text-gray-400 text-xs">{format(event.date, "HH:mm")}{event.endDate ? ` – ${format(event.endDate, "HH:mm")}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{event.location}</p>
                {event.locationUrl && (
                  <a href={event.locationUrl} target="_blank" rel="noopener noreferrer"
                    className="text-accent text-xs flex items-center gap-1 mt-0.5">
                    Open Maps <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
            {event.maxCapacity && (
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <p className="text-gray-300 text-sm">
                  <span className="text-white font-semibold">{event.attendingCount}</span>
                  <span className="text-gray-500"> / {event.maxCapacity} spots filled</span>
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">About</p>
            <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
          </div>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">What's included</p>
              <div className="space-y-2">
                {event.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-moto-green text-sm mt-0.5">✓</span>
                    <p className="text-gray-300 text-sm">{h}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map(t => (
              <span key={t} className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full">#{t}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-white/5 space-y-2">
          {/* Ticket price */}
          {event.ticketType === 'paid' && event.ticketPrice && (
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-white font-bold text-xl">{formatIDR(event.ticketPrice)}</p>
                <p className="text-gray-500 text-xs">per person</p>
              </div>
              {event.isNonRefundable && (
                <span className="text-[10px] text-gray-500 bg-bg-card px-2 py-1 rounded-lg border border-white/5">
                  ⚠️ Non-refundable
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={isAttending && event.ticketType === 'free'}
            className={`w-full font-bold py-3.5 rounded-2xl text-base transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isAttending
                ? 'bg-moto-green/20 text-moto-green border border-moto-green/30'
                : event.ticketType === 'paid'
                  ? 'bg-accent text-white'
                  : 'bg-moto-green text-white'
            }`}
          >
            {isAttending
              ? '✅ You\'re Going!'
              : event.ticketType === 'paid'
                ? <><Ticket size={16} /> Buy Ticket</>
                : '📩 RSVP — I\'m Going!'}
          </button>

          <button
            onClick={() => toggleInterest(event.id)}
            className={`w-full py-2.5 rounded-2xl text-sm font-semibold transition-all border ${
              isInterested
                ? 'border-accent/40 text-accent bg-accent/10'
                : 'border-white/10 text-gray-400 bg-bg-card'
            }`}
          >
            {isInterested ? '★ Interested' : '☆ Mark as Interested'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EventCard ──────────────────────────────────────────────────────────────

function EventCard({ event, onOpen }: { event: MotoEvent; onOpen: () => void }) {
  const eventInteractions = useStore(s => s.eventInteractions)
  const toggleInterest = useStore(s => s.toggleEventInterest)
  const isInterested = eventInteractions.some(i => i.eventId === event.id && i.type === 'interested')
  const isAttending  = eventInteractions.some(i => i.eventId === event.id && i.type === 'attending')
  const daysUntil = Math.ceil((event.date.getTime() - Date.now()) / 86400000)

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Cover strip */}
      <div
        className="h-24 flex items-center justify-between px-4 relative"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
        onClick={onOpen}
      >
        <div>
          <p className="text-white font-bold text-base leading-tight">{event.title}</p>
          <p className="text-gray-400 text-xs mt-1">{event.location}</p>
        </div>
        <span className="text-5xl opacity-80 ml-2 flex-shrink-0">{event.coverEmoji}</span>
        {daysUntil <= 7 && (
          <div className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil} DAYS`}
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Organizer row */}
        <div className="flex items-center gap-2 mb-2" onClick={onOpen}>
          <span className="text-base">{event.organizerAvatar}</span>
          <span className="text-gray-300 text-xs font-medium">{event.organizerName}</span>
          <div className="flex gap-1">
            {event.organizerBadges.slice(0, 2).map(b => <BadgeChip key={b} badge={b} size="xs" />)}
          </div>
        </div>

        {/* Date + ticket row */}
        <div className="flex items-center justify-between mb-3" onClick={onOpen}>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={10} />
            <span>{format(event.date, 'd MMM · HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2">
            {event.ticketType === 'paid' && event.ticketPrice ? (
              <span className="text-accent-amber font-bold text-xs">{formatIDR(event.ticketPrice)}</span>
            ) : (
              <span className="text-moto-green font-bold text-xs">FREE</span>
            )}
          </div>
        </div>

        {/* Stats + actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>👀 {event.interestedCount.toLocaleString()}</span>
            <span>✓ {event.attendingCount.toLocaleString()} going</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); toggleInterest(event.id) }}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all ${
                isInterested ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-gray-400'
              }`}
            >
              ★ {isInterested ? 'Saved' : 'Interested'}
            </button>
            <button
              onClick={onOpen}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all ${
                isAttending
                  ? 'bg-moto-green/20 text-moto-green'
                  : 'bg-accent text-white'
              }`}
            >
              {isAttending ? '✅ Going' : event.ticketType === 'paid' ? 'Buy →' : 'Join →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ product, size = 'full' }: { product: ShopProduct; size?: 'full' | 'compact' }) {
  const handleBuy = () => {
    const url = product.buyUrl ?? (product.whatsappNumber
      ? `https://wa.me/${product.whatsappNumber}?text=${encodeURIComponent(`Halo, saya tertarik dengan: ${product.name}`)}`
      : null)
    if (url) window.open(url, '_blank', 'noopener noreferrer')
  }

  if (size === 'compact') {
    return (
      <div className="flex-shrink-0 w-40 bg-bg-card rounded-2xl p-3 border border-white/5">
        <div className="w-full h-20 bg-bg-surface rounded-xl flex items-center justify-center text-4xl mb-2">
          {product.imageEmoji ?? '📦'}
        </div>
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
        <p className="text-accent font-bold text-sm mt-1">{formatIDR(product.priceIDR)}</p>
        {product.originalPriceIDR && (
          <p className="text-gray-500 text-xs line-through">{formatIDR(product.originalPriceIDR)}</p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Star size={9} className="text-accent-amber fill-accent-amber" />
          <span className="text-gray-400 text-[10px]">{product.rating} ({product.reviewCount})</span>
        </div>
        <button onClick={handleBuy} className="w-full mt-2 bg-accent text-white text-xs font-bold py-1.5 rounded-xl">
          Buy
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-bg-card rounded-2xl border overflow-hidden ${product.isOfficialStore ? 'border-accent/20' : 'border-white/5'}`}>
      <div className="flex gap-3 p-4">
        {/* Image */}
        <div className="w-20 h-20 bg-bg-surface rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
          {product.imageEmoji ?? '📦'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {product.isOfficialStore && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[9px] text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20">
                ✓ Official Store
              </span>
            </div>
          )}
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>

          {/* Seller + badges */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-gray-500 text-xs">{product.sellerName}</span>
            {product.sellerBadges.slice(0, 1).map(b => <BadgeChip key={b} badge={b} size="xs" />)}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <Star size={9} className="text-accent-amber fill-accent-amber" />
            <span className="text-gray-400 text-xs">{product.rating}</span>
            <span className="text-gray-600 text-xs">({product.reviewCount.toLocaleString()})</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{product.soldCount.toLocaleString()} sold</span>
          </div>
        </div>
      </div>

      {/* Price + action */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">{formatIDR(product.priceIDR)}</span>
            {product.isNew && (
              <span className="text-[9px] text-moto-green font-bold bg-moto-green/10 px-1.5 py-0.5 rounded-full border border-moto-green/20">NEW</span>
            )}
          </div>
          {product.originalPriceIDR && (
            <span className="text-gray-500 text-xs line-through">{formatIDR(product.originalPriceIDR)}</span>
          )}
        </div>
        <button
          onClick={handleBuy}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-all"
        >
          <ShoppingBag size={13} /> Buy
        </button>
      </div>
    </div>
  )
}

// ─── CommunityModCard ─────────────────────────────────────────────────────────

function CommunityModCard({ mod }: { mod: CommunityMod }) {
  return (
    <div className="flex-shrink-0 w-44 bg-bg-card rounded-2xl p-3 border border-white/5">
      <div className="w-full h-16 bg-bg-surface rounded-xl flex items-center justify-center text-4xl mb-2">
        {mod.imageEmoji}
      </div>
      <p className="text-white text-xs font-bold leading-tight">{mod.name}</p>
      <p className="text-gray-500 text-[10px] mt-0.5">{mod.brand} · {mod.category}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-moto-green font-semibold">{mod.riderCount.toLocaleString()} riders</span>
        <span className="text-gray-600 text-[10px]">·</span>
        <Star size={9} className="text-accent-amber fill-accent-amber" />
        <span className="text-gray-400 text-[10px]">{mod.avgRating}</span>
      </div>
      <p className="text-accent text-xs font-semibold mt-1">{mod.priceRange}</p>
      {mod.buyUrl && (
        <button
          onClick={() => window.open(mod.buyUrl, '_blank', 'noopener noreferrer')}
          className="w-full mt-2 text-xs text-gray-400 bg-bg-surface py-1.5 rounded-xl flex items-center justify-center gap-1"
        >
          Shop <ExternalLink size={9} />
        </button>
      )}
    </div>
  )
}

// ─── Top Destination Card ─────────────────────────────────────────────────────

function TopDestinationCard({ attraction }: { attraction: Attraction }) {
  const icons: Record<string, string> = {
    viewpoint: '🌄', temple: '🛕', food: '🍽️', fuel: '⛽',
    beach: '🏖️', waterfall: '💧', market: '🏪', mechanic: '🔧',
  }
  return (
    <div className="flex-shrink-0 w-40 bg-bg-card rounded-2xl overflow-hidden border border-white/5">
      <div className="h-20 bg-bg-surface flex items-center justify-center text-4xl"
           style={{ background: 'linear-gradient(135deg, #ff6b3515 0%, #0a84ff15 100%)' }}>
        {icons[attraction.type]}
      </div>
      <div className="p-2.5">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{attraction.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={9} className="text-accent-amber fill-accent-amber" />
          <span className="text-accent-amber text-[10px] font-semibold">{attraction.rating}</span>
          {attraction.distanceKm !== undefined && (
            <span className="text-gray-500 text-[10px] ml-1">{attraction.distanceKm} km</span>
          )}
        </div>
        <p className="text-gray-500 text-[10px] mt-0.5 capitalize">{attraction.type.replace('_', ' ')}</p>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub, onSeeAll }: { title: string; sub?: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h3 className="text-white font-bold text-base">{title}</h3>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} className="flex items-center gap-1 text-accent text-xs font-semibold">
          See all <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

// ─── TripCard ────────────────────────────────────────────────────────────────

function TripCard({ trip, saved, onLike, onSave }: { trip: TripTemplate; saved: boolean; onLike: () => void; onSave: () => void }) {
  const diffColors = { easy: 'bg-moto-green/20 text-moto-green', moderate: 'bg-accent-amber/20 text-accent-amber', hard: 'bg-moto-red/20 text-moto-red' }
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <p className="text-white font-semibold text-sm mb-1">{trip.title}</p>
          <p className="text-gray-500 text-xs line-clamp-2">{trip.description}</p>
        </div>
        <button onClick={onSave} className={`p-2 rounded-xl transition-all ${saved ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-gray-400'}`}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColors[trip.difficulty]}`}>{trip.difficulty}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">{trip.distanceKm} km</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">~{trip.estimatedHours}h</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">{trip.region}</span>
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {trip.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">#{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{trip.authorAvatar}</span>
          <span className="text-gray-400 text-xs">{trip.authorName}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLike} className="flex items-center gap-1 text-gray-400 hover:text-moto-red transition-colors">
            <Heart size={14} />
            <span className="text-xs">{trip.likes}</span>
          </button>
          <span className="text-gray-500 text-xs">{trip.saves} saves</span>
        </div>
      </div>
    </div>
  )
}

// ─── Ride feed card ───────────────────────────────────────────────────────────

function RideFeedCard({ ride }: { ride: typeof RIDE_HISTORY[0] }) {
  const [isPrivate, setIsPrivate] = useState(ride.isPrivate)
  const durationH = Math.floor(ride.durationMin / 60)
  const durationM = ride.durationMin % 60
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center text-2xl">{ride.emoji}</div>
            <div>
              <p className="text-white font-semibold text-sm">{ride.title}</p>
              <p className="text-gray-500 text-xs">{formatDistanceToNow(ride.date, { addSuffix: true })}</p>
            </div>
          </div>
          <button onClick={() => setIsPrivate(!isPrivate)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${isPrivate ? 'bg-gray-600/20 text-gray-400' : 'bg-moto-green/20 text-moto-green'}`}>
            {isPrivate ? <EyeOff size={11} /> : <Eye size={11} />}
            {isPrivate ? 'Hidden' : 'Public'}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
          <MapPin size={10} className="text-accent flex-shrink-0" />{ride.route}
        </p>
      </div>
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { icon: '📏', label: 'Distance', value: `${ride.distanceKm} km` },
            { icon: '⏱️', label: 'Time',     value: `${durationH}h ${durationM}m` },
            { icon: '⚡', label: 'Avg',       value: `${ride.avgSpeedKmh} km/h` },
            { icon: '🔥', label: 'Top',       value: `${ride.maxSpeedKmh} km/h` },
            { icon: '🌤️', label: 'Weather',  value: ride.weather.split(',')[0] },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center bg-bg-surface rounded-xl px-3 py-2 min-w-[72px] flex-shrink-0">
              <span className="text-base mb-0.5">{s.icon}</span>
              <span className="text-white font-bold text-xs leading-none">{s.value}</span>
              <span className="text-gray-500 text-[10px] mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      {ride.riders.length > 0 ? (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Users size={12} className="text-gray-500" />
          <p className="text-gray-400 text-xs">Rode with <span className="text-white font-medium">{ride.riders.join(', ')}</span></p>
        </div>
      ) : (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Zap size={12} className="text-gray-500" />
          <p className="text-gray-400 text-xs">Solo ride</p>
        </div>
      )}
    </div>
  )
}

// ─── Attraction detail modal ──────────────────────────────────────────────────

const ATTRACTION_ICONS: Record<string, string> = {
  viewpoint: '🌄', temple: '🛕', food: '🍽️', fuel: '⛽',
  beach: '🏖️', waterfall: '💧', market: '🏪', mechanic: '🔧',
}

function AttractionDetailModal({ attraction, onClose, onShowOnMap }: {
  attraction: Attraction
  onClose: () => void
  onShowOnMap: (attraction: Attraction) => void
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${attraction.position.lat},${attraction.position.lng}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-bg-card rounded-2xl flex items-center justify-center text-2xl border border-white/10">
                {ATTRACTION_ICONS[attraction.type]}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">{attraction.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-xs capitalize">{attraction.type.replace('_', ' ')}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <Star size={9} className="text-accent-amber fill-accent-amber" />
                  <span className="text-accent-amber text-xs font-semibold">{attraction.rating}</span>
                  {attraction.distanceKm !== undefined && (
                    <>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-accent text-xs font-semibold">{attraction.distanceKm} km away</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-gray-400">
              <X size={18} />
            </button>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-5">{attraction.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onShowOnMap(attraction); onClose() }}
              className="flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 rounded-2xl text-sm"
            >
              🗺️ Show on Map
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-bg-card border border-white/10 text-white font-semibold py-3 rounded-2xl text-sm"
            >
              <ExternalLink size={14} /> Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttractionCard({ attraction, onOpen }: { attraction: Attraction; onOpen: () => void }) {
  return (
    <button className="w-full bg-bg-card rounded-2xl p-4 border border-white/5 text-left active:scale-[0.98] transition-all" onClick={onOpen}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {ATTRACTION_ICONS[attraction.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="text-white font-semibold text-sm">{attraction.name}</p>
            <div className="flex items-center gap-0.5 ml-2">
              <Star size={10} className="text-accent-amber fill-accent-amber" />
              <span className="text-accent-amber text-xs font-semibold">{attraction.rating}</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-0.5 capitalize">{attraction.type.replace('_', ' ')}</p>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{attraction.description}</p>
          {attraction.distanceKm !== undefined && (
            <p className="text-accent text-xs mt-1">{attraction.distanceKm} km away</p>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}

// ─── Instagram Brand Bubble ───────────────────────────────────────────────────

function BrandBubble({ account, isActive, onToggle }: {
  account: InstagramAccount
  isActive: boolean
  onToggle: () => void
}) {
  const cfg = BADGE_CONFIG[account.badge]
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center gap-1 flex-shrink-0 group"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
        isActive
          ? 'ring-2 ring-offset-2 ring-offset-bg-primary scale-105'
          : 'ring-1 ring-white/10'
      }`}
        style={isActive ? { boxShadow: `0 0 0 2px ${cfg?.color ?? '#ff6b35'}` } : undefined}
      >
        <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
          isActive ? 'bg-bg-card' : 'bg-bg-surface'
        }`}>
          {account.avatarEmoji}
        </span>
      </div>
      <span className={`text-[10px] font-medium max-w-[56px] truncate ${isActive ? 'text-white' : 'text-gray-500'}`}>
        @{account.username.replace('_', '')}
      </span>
    </button>
  )
}

// ─── Instagram Post Card ──────────────────────────────────────────────────────

const IG_MEDIA_GRADIENTS: Record<string, string> = {
  yamaha:   'from-blue-900/60 to-gray-900',
  honda:    'from-red-900/60 to-gray-900',
  kawasaki: 'from-green-900/60 to-gray-900',
  ktm:      'from-orange-900/60 to-gray-900',
  verified: 'from-gray-800/80 to-gray-900',
}

function IgPostCard({ post }: { post: InstagramPost }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = BADGE_CONFIG[post.badge]
  const grad = IG_MEDIA_GRADIENTS[post.badge] ?? 'from-gray-800 to-gray-900'
  const timeAgo = formatDistanceToNow(post.timestamp, { addSuffix: true })
  const isLong = (post.caption?.length ?? 0) > 120

  return (
    <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-xl flex-shrink-0 ring-1 ring-white/10">
          {post.avatarEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white font-bold text-sm">{post.displayName}</span>
            {cfg && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}40` }}>
                {cfg.label}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[10px]">@{post.username} · {timeAgo}</p>
        </div>
        {/* Media type badge */}
        {post.mediaType === 'CAROUSEL_ALBUM' && (
          <span className="text-[9px] text-gray-500 bg-bg-surface rounded-md px-1.5 py-0.5 flex-shrink-0">📷 Album</span>
        )}
        {post.mediaType === 'VIDEO' && (
          <span className="text-[9px] text-gray-500 bg-bg-surface rounded-md px-1.5 py-0.5 flex-shrink-0">▶ Video</span>
        )}
      </div>

      {/* Media area */}
      {post.mediaUrl ? (
        <img src={post.mediaUrl} alt={post.caption} className="w-full aspect-square object-cover" />
      ) : (
        <div className={`w-full aspect-square bg-gradient-to-b ${grad} flex items-center justify-center`}>
          <span className="text-8xl opacity-60 select-none">{post.mediaEmoji}</span>
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-2.5 pb-1">
          <p className={`text-gray-300 text-sm leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
            {post.caption}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-accent text-xs font-semibold mt-0.5">
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}

      {/* Engagement row */}
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <div className="flex items-center gap-4 text-gray-500 text-xs">
          {post.likeCount !== undefined && (
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{post.likeCount.toLocaleString('en-US')}</span>
            </span>
          )}
          {post.commentCount !== undefined && (
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{post.commentCount.toLocaleString('en-US')}</span>
            </span>
          )}
        </div>
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-accent text-xs font-semibold"
        >
          View on Instagram <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}

// ─── Main ExplorePanel ────────────────────────────────────────────────────────

export default function ExplorePanel() {
  const [tab, setTab]                   = useState<ExploreTab>('discover')
  const [selectedEvent, setSelectedEvent] = useState<MotoEvent | null>(null)
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null)
  const [igFilter, setIgFilter]         = useState<string | null>(null)
  const tripTemplates       = useStore(s => s.tripTemplates)
  const savedTripIds        = useStore(s => s.savedTripIds)
  const likeTrip            = useStore(s => s.likeTrip)
  const saveTrip            = useStore(s => s.saveTrip)
  const events              = useStore(s => s.events)
  const products            = useStore(s => s.products)
  const setActiveTab        = useStore(s => s.setActiveTab)
  const instagramAccounts   = useStore(s => s.instagramAccounts)
  const instagramPosts      = useStore(s => s.instagramPosts)

  const handleShowOnMap = (attraction: Attraction) => {
    // Store the target in localStorage so RideMap can pick it up (simple cross-component comms)
    localStorage.setItem('mototrack-map-target', JSON.stringify({ lat: attraction.position.lat, lng: attraction.position.lng, name: attraction.name }))
    setActiveTab('map')
  }

  const tabs: { id: ExploreTab; label: string; icon: string }[] = [
    { id: 'discover', label: 'Discover', icon: '🔭' },
    { id: 'events',   label: 'Events',   icon: '🎫' },
    { id: 'shop',     label: 'Shop',     icon: '🛒' },
    { id: 'routes',   label: 'Routes',   icon: '🗺️' },
    { id: 'brands',   label: 'Brands',   icon: '📸' },
    { id: 'feed',     label: 'My Rides', icon: '📊' },
  ]

  const topAttractions    = [...MOCK_ATTRACTIONS].sort((a, b) => b.rating - a.rating).slice(0, 6)
  const upcomingEvents    = events.filter(e => e.date > new Date()).sort((a, b) => a.date.getTime() - b.date.getTime())
  const featuredProducts  = [...products].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
  const filteredIgPosts   = igFilter
    ? instagramPosts.filter(p => p.accountId === igFilter).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    : [...instagramPosts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h2 className="text-white font-bold text-xl mb-3">Explore</h2>

        {/* Scrollable tab bar */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-accent text-white' : 'bg-bg-card text-gray-400'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* ── DISCOVER TAB ── */}
        {tab === 'discover' && (
          <div className="space-y-6">
            {/* Top Destinations */}
            <div>
              <SectionHeader
                title="🌄 Top Destinations"
                sub="Highest-rated spots around Bali"
                onSeeAll={() => setTab('routes')}
              />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {topAttractions.map(a => <TopDestinationCard key={a.id} attraction={a} />)}
              </div>
            </div>

            {/* Top Modifications */}
            <div>
              <SectionHeader
                title="🔧 Top Modifications"
                sub="Most popular mods in the community"
              />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {MOCK_COMMUNITY_MODS.map(m => <CommunityModCard key={m.id} mod={m} />)}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <SectionHeader
                title="🛒 Top Products"
                sub="Best sellers in MotoTrack Shop"
                onSeeAll={() => setTab('shop')}
              />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {featuredProducts.slice(0, 4).map(p => <ProductCard key={p.id} product={p} size="compact" />)}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <SectionHeader
                title="🎫 Upcoming Events"
                sub="Events & gatherings near you"
                onSeeAll={() => setTab('events')}
              />
              <div className="space-y-3">
                {upcomingEvents.slice(0, 2).map(e => (
                  <EventCard key={e.id} event={e} onOpen={() => setSelectedEvent(e)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {tab === 'events' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs">Upcoming events & community gatherings</p>

            {/* Map showing event pins */}
            {upcomingEvents.length > 0 && (
              <EventsMapPanel events={upcomingEvents} onEventOpen={(e) => setSelectedEvent(e)} />
            )}

            {upcomingEvents.map(e => (
              <EventCard key={e.id} event={e} onOpen={() => setSelectedEvent(e)} />
            ))}
            {upcomingEvents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🎫</p>
                <p className="text-white font-semibold">No upcoming events</p>
                <p className="text-gray-500 text-sm mt-1">Check back soon!</p>
              </div>
            )}
          </div>
        )}

        {/* ── SHOP TAB ── */}
        {tab === 'shop' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs">Official & community seller products</p>
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* ── ROUTES TAB ── */}
        {tab === 'routes' && (
          <>
            <p className="text-gray-500 text-xs mb-3">Community route templates around Bali</p>
            <div className="space-y-3">
              {tripTemplates.map(trip => (
                <TripCard key={trip.id} trip={trip} saved={savedTripIds.includes(trip.id)}
                  onLike={() => likeTrip(trip.id)} onSave={() => saveTrip(trip.id)} />
              ))}
            </div>
            <div className="mt-6">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">📍 Points of Interest</p>
              <div className="space-y-3">
                {MOCK_ATTRACTIONS.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).map(a => (
                  <AttractionCard key={a.id} attraction={a} onOpen={() => setSelectedAttraction(a)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── BRANDS TAB ── */}
        {tab === 'brands' && (
          <div>
            {/* Brand bubbles — YouTube Subscriptions style */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
              {/* All */}
              <button
                onClick={() => setIgFilter(null)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                  igFilter === null
                    ? 'bg-accent/20 ring-2 ring-accent scale-105'
                    : 'bg-bg-surface ring-1 ring-white/10'
                }`}>
                  <span>✨</span>
                </div>
                <span className={`text-[10px] font-medium ${igFilter === null ? 'text-white' : 'text-gray-500'}`}>All</span>
              </button>

              {instagramAccounts.map(acc => (
                <BrandBubble
                  key={acc.id}
                  account={acc}
                  isActive={igFilter === acc.id}
                  onToggle={() => setIgFilter(prev => prev === acc.id ? null : acc.id)}
                />
              ))}
            </div>

            {/* Active filter label */}
            {igFilter && (() => {
              const acc = instagramAccounts.find(a => a.id === igFilter)
              return acc ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 text-xs">Showing</span>
                  <span className="text-white text-xs font-semibold">@{acc.username}</span>
                  <span className="text-gray-500 text-xs">· {acc.followerCount.toLocaleString('en-US')} followers</span>
                </div>
              ) : null
            })()}

            {/* Posts feed */}
            <div className="space-y-4">
              {filteredIgPosts.map(post => (
                <IgPostCard key={post.id} post={post} />
              ))}
              {filteredIgPosts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">📸</p>
                  <p className="text-white font-semibold">No posts yet</p>
                  <p className="text-gray-500 text-sm mt-1">Check back soon</p>
                </div>
              )}
            </div>

            {/* Instagram connect callout */}
            <div className="mt-6 bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-orange-900/30 border border-purple-500/20 rounded-2xl p-4">
              <p className="text-white font-bold text-sm mb-1">📲 Are you a brand or community?</p>
              <p className="text-gray-400 text-xs leading-relaxed">Connect your Instagram Business account in the admin portal to have your posts appear here automatically.</p>
              <p className="text-purple-400 text-xs font-semibold mt-2">admin.mototrack.id →</p>
            </div>
          </div>
        )}

        {/* ── MY RIDES TAB ── */}
        {tab === 'feed' && (
          <>
            <p className="text-gray-500 text-xs mb-3">Your completed rides · Tap the eye to hide from friends</p>
            <div className="space-y-3">
              {RIDE_HISTORY.map(ride => <RideFeedCard key={ride.id} ride={ride} />)}
            </div>
          </>
        )}

      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Attraction detail modal */}
      {selectedAttraction && (
        <AttractionDetailModal
          attraction={selectedAttraction}
          onClose={() => setSelectedAttraction(null)}
          onShowOnMap={handleShowOnMap}
        />
      )}
    </div>
  )
}
