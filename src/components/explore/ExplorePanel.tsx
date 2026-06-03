import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Heart, Bookmark, MapPin, Clock, Zap, Users, Eye, EyeOff, Star, ChevronRight, ExternalLink, Ticket, ShoppingBag, X, Globe, Lock } from 'lucide-react'
import type { TripTemplate, Attraction, MotoEvent, ShopProduct, CommunityMod, BadgeType, InstagramPost, InstagramAccount } from '../../types'
import { MOCK_ATTRACTIONS, MOCK_COMMUNITY_MODS, RIDE_HISTORY } from '../../data/mockData'
import EventsMapPanel from './EventsMapPanel'
import { formatDistanceToNow, format } from 'date-fns'
import { fetchPlaceDetails, isPlacesReady } from '../../lib/places'
import type { PlaceDetails } from '../../lib/places'

// ─── Ride History ──────────────────────────────────────────────────────────────

type ExploreTab = 'discover' | 'events' | 'shop' | 'routes' | 'brands'

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

// ─── Mod Detail Sheet ─────────────────────────────────────────────────────────

function ModDetailSheet({ mod, onClose }: { mod: CommunityMod; onClose: () => void }) {
  const stars = Math.round(mod.avgRating)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header banner */}
        <div className="h-36 flex items-center justify-center text-7xl relative"
             style={{ background: 'linear-gradient(135deg,#ff6b3518,#0a84ff18)' }}>
          {mod.imageEmoji}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Title + meta */}
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{mod.name}</h3>
            <p className="text-gray-400 text-sm mt-0.5">{mod.brand} · <span className="capitalize">{mod.category.replace(/_/g, ' ')}</span></p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-card rounded-2xl p-3 text-center border border-white/5">
              <p className="text-moto-green font-black text-base leading-none">{mod.riderCount.toLocaleString()}</p>
              <p className="text-gray-500 text-[10px] mt-1">Riders using</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-3 text-center border border-white/5">
              <div className="flex justify-center mb-0.5">
                <StarRow rating={mod.avgRating} size={10} />
              </div>
              <p className="text-accent-amber font-bold text-sm">{mod.avgRating}</p>
              <p className="text-gray-500 text-[10px]">Rating</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-3 text-center border border-white/5">
              <p className="text-accent font-bold text-sm leading-tight">{mod.priceRange}</p>
              <p className="text-gray-500 text-[10px] mt-1">Price range</p>
            </div>
          </div>

          {/* Community verdict */}
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
            <p className="text-white font-semibold text-sm mb-2">Community Verdict</p>
            <div className="flex items-center gap-2 mb-2">
              <StarRow rating={mod.avgRating} size={14} />
              <span className="text-accent-amber font-black text-lg">{mod.avgRating}</span>
              <span className="text-gray-500 text-xs">/ 5.0</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {mod.riderCount.toLocaleString()} MotoTrack riders have installed this mod.{' '}
              {stars >= 5 ? 'Overwhelmingly recommended by the community.' :
               stars >= 4 ? 'Highly rated with great community feedback.' :
               stars >= 3 ? 'Solid choice with generally positive reviews.' :
               'Mixed reviews — check the shop for more details.'}
            </p>
          </div>

          {/* Action */}
          {mod.buyUrl ? (
            <button
              onClick={() => window.open(mod.buyUrl, '_blank', 'noopener noreferrer')}
              className="w-full bg-accent text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
            >
              <ShoppingBag size={16} /> Shop This Mod
            </button>
          ) : (
            <div className="bg-bg-card border border-white/5 rounded-2xl py-4 text-center">
              <p className="text-gray-500 text-sm">No shop link available</p>
            </div>
          )}
          <div className="h-2 pb-safe" />
        </div>
      </div>
    </div>
  )
}

// ─── CommunityModCard ─────────────────────────────────────────────────────────

function CommunityModCard({ mod, onClick }: { mod: CommunityMod; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-bg-card rounded-2xl p-3 border border-white/5 text-left active:scale-95 transition-all"
    >
      <div className="w-full h-16 bg-bg-surface rounded-xl flex items-center justify-center text-4xl mb-2"
           style={{ background: 'linear-gradient(135deg,#ff6b3510,#0a84ff10)' }}>
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
      <p className="text-gray-600 text-[10px] mt-1">Tap for details →</p>
    </button>
  )
}

// ─── Place Detail Sheet ───────────────────────────────────────────────────────

const PLACE_ICONS: Record<string, string> = {
  viewpoint: '🌄', temple: '🛕', food: '🍽️', fuel: '⛽',
  beach: '🏖️', waterfall: '💧', market: '🏪', mechanic: '🔧',
}

const TYPE_GRADIENTS: Record<string, string> = {
  viewpoint: 'linear-gradient(135deg,#1a3a2a,#0d2137)',
  temple:    'linear-gradient(135deg,#2a1a3a,#1a0d37)',
  food:      'linear-gradient(135deg,#3a2a0d,#2a1a00)',
  fuel:      'linear-gradient(135deg,#1a2a3a,#0d1a2a)',
  beach:     'linear-gradient(135deg,#0d2a3a,#001a2a)',
  waterfall: 'linear-gradient(135deg,#0d1a3a,#001030)',
  market:    'linear-gradient(135deg,#2a1a0d,#1a0d00)',
  mechanic:  'linear-gradient(135deg,#1a1a1a,#0d0d0d)',
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-accent-amber fill-accent-amber' : 'text-gray-600'}
        />
      ))}
    </div>
  )
}

function PlaceDetailSheet({
  attraction,
  onClose,
  onShowOnMap,
}: {
  attraction: Attraction
  onClose: () => void
  onShowOnMap: (a: Attraction) => void
}) {
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(isPlacesReady())
  const [photoIdx, setPhotoIdx] = useState(0)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${attraction.position.lat},${attraction.position.lng}`

  useEffect(() => {
    if (!isPlacesReady()) return
    setLoading(true)
    fetchPlaceDetails(attraction.name, attraction.position.lat, attraction.position.lng)
      .then(d => setDetails(d))
      .finally(() => setLoading(false))
  }, [attraction.id])

  const photos = details?.photos ?? []
  const reviews = details?.reviews ?? []
  const displayRating = details?.rating ?? attraction.rating
  const totalRatings = details?.totalRatings

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up overflow-hidden max-h-[92vh] flex flex-col">

        {/* Photo carousel / placeholder */}
        <div className="relative flex-shrink-0 h-52 overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"
                 style={{ background: TYPE_GRADIENTS[attraction.type] ?? TYPE_GRADIENTS.viewpoint }}>
              <span className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : photos.length > 0 ? (
            <>
              <img
                key={photoIdx}
                src={photos[photoIdx]}
                className="w-full h-full object-cover"
                alt={attraction.name}
              />
              {/* Photo dots */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white scale-125' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
              {/* Prev / next */}
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white text-sm">‹</button>
                  <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white text-sm">›</button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl"
                 style={{ background: TYPE_GRADIENTS[attraction.type] ?? TYPE_GRADIENTS.viewpoint }}>
              {PLACE_ICONS[attraction.type]}
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-secondary to-transparent" />
          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="text-white font-bold text-xl leading-tight">{details?.name ?? attraction.name}</h3>
              <span className="text-gray-500 text-xs capitalize mt-0.5 block">{attraction.type.replace('_', ' ')}</span>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 justify-end">
                <StarRow rating={displayRating} size={11} />
                <span className="text-accent-amber font-bold text-sm ml-1">{displayRating.toFixed(1)}</span>
              </div>
              {totalRatings !== undefined && (
                <p className="text-gray-500 text-[10px] mt-0.5">{totalRatings.toLocaleString()} reviews</p>
              )}
            </div>
          </div>

          {details?.address && (
            <p className="text-gray-400 text-xs mb-4 flex items-center gap-1.5">
              <MapPin size={11} className="text-accent flex-shrink-0" />
              {details.address}
            </p>
          )}

          {!details?.address && attraction.distanceKm !== undefined && (
            <p className="text-accent text-xs font-semibold mb-4">{attraction.distanceKm} km away</p>
          )}

          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed mb-5">{attraction.description}</p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => { onShowOnMap(attraction); onClose() }}
              className="flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 rounded-2xl text-sm active:scale-95 transition-all"
            >
              🗺️ Show on Map
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-bg-card border border-white/10 text-white font-semibold py-3 rounded-2xl text-sm"
            >
              <ExternalLink size={14} /> Google Maps
            </a>
          </div>

          {/* Reviews */}
          {!isPlacesReady() ? (
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-gray-400 text-sm font-medium mb-1">Google Reviews</p>
              <p className="text-gray-600 text-xs">Add <code className="text-accent">VITE_GOOGLE_PLACES_KEY</code> in Vercel environment variables to show real reviews and photos.</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-bg-card rounded-2xl p-4 border border-white/5 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-32 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-full mb-1" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div>
              <p className="text-white font-semibold text-sm mb-3">Google Reviews</p>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-bg-card rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2.5 mb-2">
                      {r.authorAvatar ? (
                        <img src={r.authorAvatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
                          {r.author[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{r.author}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StarRow rating={r.rating} size={9} />
                          <span className="text-gray-500 text-[10px]">{r.relativeTime}</span>
                        </div>
                      </div>
                    </div>
                    {r.text && <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{r.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-gray-500 text-sm">No reviews found for this location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Top Destination Card ─────────────────────────────────────────────────────

function TopDestinationCard({ attraction, onClick }: { attraction: Attraction; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-40 bg-bg-card rounded-2xl overflow-hidden border border-white/5 text-left active:scale-95 transition-all"
    >
      <div className="h-20 flex items-center justify-center text-4xl"
           style={{ background: TYPE_GRADIENTS[attraction.type] ?? 'linear-gradient(135deg,#1a1a1a,#0d0d0d)' }}>
        {PLACE_ICONS[attraction.type]}
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
        <p className="text-accent text-[10px] font-semibold mt-1">Tap for details →</p>
      </div>
    </button>
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

// ─── Route Detail Sheet ───────────────────────────────────────────────────────

const DIFF_COLORS = {
  easy: 'bg-moto-green/20 text-moto-green',
  moderate: 'bg-accent-amber/20 text-accent-amber',
  hard: 'bg-moto-red/20 text-moto-red',
}

const WAYPOINT_ICONS: Record<string, string> = {
  attraction: '🌄', fuel: '⛽', food: '🍽️', rest: '☕', photo: '📸',
}

const ROUTE_REACTIONS = ['❤️', '🔥', '👍', '🏍️', '⭐']

function routeSvgPath(pts: { lat: number; lng: number }[], w: number, h: number, pad = 10): string {
  if (pts.length < 2) return ''
  const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latR = maxLat - minLat || 0.001, lngR = maxLng - minLng || 0.001
  return pts.map(({ lat, lng }, i) => {
    const x = (pad + ((lng - minLng) / lngR) * (w - pad * 2)).toFixed(1)
    const y = ((h - pad) - ((lat - minLat) / latR) * (h - pad * 2)).toFixed(1)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
}

function RouteDetailSheet({
  trip,
  saved,
  onSave,
  onClose,
  onShowOnMap,
  onRideSolo,
}: {
  trip: TripTemplate
  saved: boolean
  onSave: () => void
  onClose: () => void
  onShowOnMap: (trip: TripTemplate) => void
  onRideSolo: (trip: TripTemplate) => void
}) {
  const [isPublic, setIsPublic] = useState(true)
  const [reactions, setReactions] = useState<Record<string, number>>(() => ({
    '❤️': trip.likes, '🔥': Math.floor(trip.likes * 0.6), '👍': Math.floor(trip.saves * 1.2),
    '🏍️': Math.floor(trip.saves * 0.8), '⭐': Math.floor(trip.likes * 0.4),
  }))
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set())
  const path = routeSvgPath(trip.route, 280, 100)
  const first = trip.route[0], last = trip.route[trip.route.length - 1]

  const toggleReaction = (emoji: string) => {
    setMyReactions(prev => {
      const next = new Set(prev)
      if (next.has(emoji)) { next.delete(emoji); setReactions(r => ({ ...r, [emoji]: r[emoji] - 1 })) }
      else { next.add(emoji); setReactions(r => ({ ...r, [emoji]: r[emoji] + 1 })) }
      return next
    })
  }

  const handleShare = async () => {
    const text = `🏍️ ${trip.title}\n📏 ${trip.distanceKm} km · ~${trip.estimatedHours}h · ${trip.difficulty}\n📍 ${trip.region}\n#MotoTrack`
    if (navigator.share) await navigator.share({ title: trip.title, text }).catch(() => {})
    else await navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up overflow-hidden max-h-[92vh] flex flex-col">

        {/* Route mini-map header */}
        <div className="relative flex-shrink-0 bg-bg-card h-28 overflow-hidden">
          <svg viewBox="0 0 280 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <path d={path} fill="none" stroke="#ff6b35" strokeWidth="6" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="#ff6b35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {first && last && (
              <>
                <circle cx={parseFloat(path.slice(1).split('L')[0].split(',')[0])} cy={parseFloat(path.slice(1).split('L')[0].split(',')[1])} r="5" fill="#30d158" />
                <circle cx={parseFloat(path.split('L').pop()!.split(',')[0])} cy={parseFloat(path.split('L').pop()!.split(',')[1])} r="5" fill="#ff453a" />
              </>
            )}
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-secondary" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <X size={16} />
          </button>
          {/* Public/Private toggle */}
          <button
            onClick={() => setIsPublic(p => !p)}
            className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${
              isPublic ? 'bg-moto-green/20 text-moto-green border border-moto-green/30' : 'bg-gray-600/30 text-gray-400 border border-white/10'
            }`}
          >
            {isPublic ? <><Globe size={11} /> Public</> : <><Lock size={11} /> Private</>}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <h3 className="text-white font-bold text-xl leading-tight">{trip.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFF_COLORS[trip.difficulty]}`}>{trip.difficulty}</span>
                <span className="text-gray-400 text-xs">{trip.distanceKm} km</span>
                <span className="text-gray-600 text-xs">·</span>
                <span className="text-gray-400 text-xs">~{trip.estimatedHours}h</span>
                <span className="text-gray-600 text-xs">·</span>
                <span className="text-gray-400 text-xs">{trip.region}</span>
              </div>
            </div>
            <button onClick={onSave} className={`p-2 rounded-xl flex-shrink-0 ${saved ? 'bg-accent/20 text-accent' : 'bg-bg-card text-gray-400'}`}>
              <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-4">{trip.description}</p>

          {/* Emoji reactions */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {ROUTE_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-90 ${
                  myReactions.has(emoji)
                    ? 'bg-accent/20 border border-accent/40 text-white'
                    : 'bg-bg-card border border-white/10 text-gray-300'
                }`}
              >
                {emoji} <span className="text-xs text-gray-400">{reactions[emoji]}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-5">
            {trip.tags.slice(0, 5).map(tag => (
              <span key={tag} className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>

          {/* Waypoints */}
          {trip.waypoints.length > 0 && (
            <div className="mb-5">
              <p className="text-white font-semibold text-sm mb-3">Waypoints</p>
              <div className="space-y-2">
                {trip.waypoints.map((wp, i) => (
                  <div key={i} className="flex items-center gap-3 bg-bg-card rounded-xl px-3 py-2.5 border border-white/5">
                    <span className="text-lg flex-shrink-0">{WAYPOINT_ICONS[wp.type] ?? '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{wp.name}</p>
                      <p className="text-gray-500 text-[10px] truncate">{wp.description}</p>
                    </div>
                    <span className="text-gray-600 text-[10px] capitalize flex-shrink-0">{wp.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">{trip.authorAvatar}</span>
            <span className="text-gray-400 text-xs">by {trip.authorName}</span>
            <span className="text-gray-600 text-xs ml-auto">{trip.likes} likes · {trip.saves} saves</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => { onShowOnMap(trip); onClose() }}
              className="flex flex-col items-center gap-1.5 bg-bg-card border border-white/10 text-white py-3 rounded-2xl text-xs font-semibold active:scale-95 transition-all"
            >
              <span className="text-xl">🗺️</span> Show Map
            </button>
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 bg-bg-card border border-white/10 text-white py-3 rounded-2xl text-xs font-semibold active:scale-95 transition-all"
            >
              <span className="text-xl">↗️</span> Share
            </button>
            <button
              onClick={() => { onRideSolo(trip); onClose() }}
              className="flex flex-col items-center gap-1.5 bg-moto-green text-white py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all"
            >
              <span className="text-xl">🏍️</span> Ride Solo
            </button>
          </div>
          <div className="h-2 pb-safe" />
        </div>
      </div>
    </div>
  )
}

// ─── Trip card (route list item) ──────────────────────────────────────────────

function TripCard({ trip, saved, onLike, onSave, onClick }: {
  trip: TripTemplate; saved: boolean; onLike: () => void; onSave: () => void; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full bg-bg-card rounded-2xl border border-white/5 p-4 text-left active:scale-[0.98] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <p className="text-white font-semibold text-sm mb-1">{trip.title}</p>
          <p className="text-gray-500 text-xs line-clamp-2">{trip.description}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onSave() }}
          className={`p-2 rounded-xl transition-all flex-shrink-0 ${saved ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-gray-400'}`}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[trip.difficulty]}`}>{trip.difficulty}</span>
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
          <button onClick={e => { e.stopPropagation(); onLike() }} className="flex items-center gap-1 text-gray-400">
            <Heart size={14} /><span className="text-xs">{trip.likes}</span>
          </button>
          <span className="text-gray-500 text-xs">{trip.saves} saves</span>
        </div>
      </div>
    </button>
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
  const [selectedMod, setSelectedMod]   = useState<CommunityMod | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<TripTemplate | null>(null)
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
    localStorage.setItem('mototrack-map-target', JSON.stringify({ lat: attraction.position.lat, lng: attraction.position.lng, name: attraction.name }))
    setActiveTab('map')
  }

  const handleShowRouteOnMap = (trip: TripTemplate) => {
    if (trip.waypoints.length > 0) {
      const wp = trip.waypoints[0]
      localStorage.setItem('mototrack-map-target', JSON.stringify({ lat: wp.position.lat, lng: wp.position.lng, name: trip.title }))
    } else if (trip.route.length > 0) {
      const pt = trip.route[0]
      localStorage.setItem('mototrack-map-target', JSON.stringify({ lat: pt.lat, lng: pt.lng, name: trip.title }))
    }
    setActiveTab('map')
  }

  const handleRideSolo = (trip: TripTemplate) => {
    const destinations = trip.waypoints.map(wp => wp.name)
    localStorage.setItem('mototrack-launch-route', JSON.stringify({ destinations }))
    setActiveTab('map')
  }

  const tabs: { id: ExploreTab; label: string; icon: string }[] = [
    { id: 'discover', label: 'Discover', icon: '🔭' },
    { id: 'events',   label: 'Events',   icon: '🎫' },
    { id: 'shop',     label: 'Shop',     icon: '🛒' },
    { id: 'routes',   label: 'Routes',   icon: '🗺️' },
    { id: 'brands',   label: 'Brands',   icon: '📸' },
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
                {topAttractions.map(a => <TopDestinationCard key={a.id} attraction={a} onClick={() => setSelectedAttraction(a)} />)}
              </div>
            </div>

            {/* Top Modifications */}
            <div>
              <SectionHeader
                title="🔧 Top Modifications"
                sub="Most popular mods in the community"
              />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {MOCK_COMMUNITY_MODS.map(m => <CommunityModCard key={m.id} mod={m} onClick={() => setSelectedMod(m)} />)}
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
                  onLike={() => likeTrip(trip.id)} onSave={() => saveTrip(trip.id)}
                  onClick={() => setSelectedTrip(trip)} />
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

      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Attraction detail modal (legacy, still used by AttractionCard in routes tab) */}
      {selectedAttraction && (
        <PlaceDetailSheet
          attraction={selectedAttraction}
          onClose={() => setSelectedAttraction(null)}
          onShowOnMap={handleShowOnMap}
        />
      )}

      {/* Mod detail sheet */}
      {selectedMod && (
        <ModDetailSheet mod={selectedMod} onClose={() => setSelectedMod(null)} />
      )}

      {/* Route detail sheet */}
      {selectedTrip && (
        <RouteDetailSheet
          trip={selectedTrip}
          saved={savedTripIds.includes(selectedTrip.id)}
          onSave={() => saveTrip(selectedTrip.id)}
          onClose={() => setSelectedTrip(null)}
          onShowOnMap={handleShowRouteOnMap}
          onRideSolo={handleRideSolo}
        />
      )}
    </div>
  )
}
