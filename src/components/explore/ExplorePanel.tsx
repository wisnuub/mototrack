import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Heart, Bookmark, MapPin, Clock, Zap, Users, Eye, EyeOff, Star, ChevronRight } from 'lucide-react'
import type { TripTemplate, Attraction } from '../../types'
import { MOCK_ATTRACTIONS } from '../../data/mockData'
import { formatDistanceToNow } from 'date-fns'

// Mock ride history (completed rides feed)
const RIDE_HISTORY = [
  {
    id: 'ride-h1',
    title: 'Kintamani Sunrise Ride',
    date: new Date('2024-04-10T05:30:00'),
    distanceKm: 68.4,
    durationMin: 185,
    avgSpeedKmh: 58,
    maxSpeedKmh: 87,
    weather: 'Partly cloudy, 22°C',
    traffic: 'Light',
    riders: ['Sato', 'Rizal', 'Iqbal'],
    isPrivate: false,
    route: 'Jimbaran → Denpasar → Ubud → Kintamani',
    emoji: '🌋',
  },
  {
    id: 'ride-h2',
    title: 'Solo Morning Run — Uluwatu',
    date: new Date('2024-04-07T06:00:00'),
    distanceKm: 41.2,
    durationMin: 70,
    avgSpeedKmh: 64,
    maxSpeedKmh: 92,
    weather: 'Clear, 28°C',
    traffic: 'Very light',
    riders: [],
    isPrivate: true,
    route: 'Jimbaran → Pecatu → Uluwatu',
    emoji: '🌊',
  },
  {
    id: 'ride-h3',
    title: 'Tanah Lot Sunset Group Run',
    date: new Date('2024-04-03T15:00:00'),
    distanceKm: 38.9,
    durationMin: 95,
    avgSpeedKmh: 52,
    maxSpeedKmh: 78,
    weather: 'Sunny, 31°C',
    traffic: 'Moderate',
    riders: ['Sato', 'Wayan'],
    isPrivate: false,
    route: 'Denpasar → Tabanan → Tanah Lot',
    emoji: '🌅',
  },
]

type ExploreTab = 'feed' | 'routes' | 'nearby'

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-bg-surface rounded-xl px-3 py-2 min-w-[72px]">
      <span className="text-base mb-0.5">{icon}</span>
      <span className="text-white font-bold text-sm leading-none">{value}</span>
      <span className="text-gray-500 text-[10px] mt-0.5">{label}</span>
    </div>
  )
}

function RideFeedCard({ ride }: { ride: typeof RIDE_HISTORY[0] }) {
  const [isPrivate, setIsPrivate] = useState(ride.isPrivate)
  const durationH = Math.floor(ride.durationMin / 60)
  const durationM = ride.durationMin % 60

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bg-surface rounded-xl flex items-center justify-center text-2xl">
              {ride.emoji}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{ride.title}</p>
              <p className="text-gray-500 text-xs">{formatDistanceToNow(ride.date, { addSuffix: true })}</p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
              isPrivate ? 'bg-gray-600/20 text-gray-400' : 'bg-moto-green/20 text-moto-green'
            }`}
          >
            {isPrivate ? <EyeOff size={11} /> : <Eye size={11} />}
            {isPrivate ? 'Hidden' : 'Public'}
          </button>
        </div>

        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
          <MapPin size={10} className="text-accent flex-shrink-0" />
          {ride.route}
        </p>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <StatPill icon="📏" label="Distance" value={`${ride.distanceKm} km`} />
          <StatPill icon="⏱️" label="Time" value={`${durationH}h ${durationM}m`} />
          <StatPill icon="⚡" label="Avg Speed" value={`${ride.avgSpeedKmh} km/h`} />
          <StatPill icon="🔥" label="Top Speed" value={`${ride.maxSpeedKmh} km/h`} />
          <StatPill icon="🌤️" label="Weather" value={ride.weather.split(',')[0]} />
          <StatPill icon="🚦" label="Traffic" value={ride.traffic} />
        </div>
      </div>

      {/* Riding buddies */}
      {ride.riders.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Users size={12} className="text-gray-500" />
          <p className="text-gray-400 text-xs">
            Rode with <span className="text-white font-medium">{ride.riders.join(', ')}</span>
          </p>
        </div>
      )}
      {ride.riders.length === 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Zap size={12} className="text-gray-500" />
          <p className="text-gray-400 text-xs">Solo ride</p>
        </div>
      )}
    </div>
  )
}

function TripCard({ trip, saved, onLike, onSave }: {
  trip: TripTemplate
  saved: boolean
  onLike: () => void
  onSave: () => void
}) {
  const diffColors = {
    easy: 'bg-moto-green/20 text-moto-green',
    moderate: 'bg-accent-amber/20 text-accent-amber',
    hard: 'bg-moto-red/20 text-moto-red',
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <p className="text-white font-semibold text-sm mb-1">{trip.title}</p>
          <p className="text-gray-500 text-xs line-clamp-2">{trip.description}</p>
        </div>
        <button
          onClick={onSave}
          className={`p-2 rounded-xl transition-all ${saved ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-gray-400'}`}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColors[trip.difficulty]}`}>
          {trip.difficulty}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">
          {trip.distanceKm} km
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">
          ~{trip.estimatedHours}h
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface text-gray-400">
          {trip.region}
        </span>
      </div>

      {/* Waypoints */}
      <div className="space-y-1 mb-3">
        {trip.waypoints.map((wp, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <span className="text-base">
              {wp.type === 'fuel' ? '⛽' : wp.type === 'food' ? '🍽️' : wp.type === 'rest' ? '☕' : wp.type === 'photo' ? '📸' : '📍'}
            </span>
            <span className="truncate">{wp.name}</span>
          </div>
        ))}
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

const ATTRACTION_ICONS: Record<string, string> = {
  viewpoint: '🌄', temple: '🛕', food: '🍽️', fuel: '⛽',
  beach: '🏖️', waterfall: '💧', market: '🏪', mechanic: '🔧',
}

function AttractionCard({ attraction }: { attraction: Attraction }) {
  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
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
      </div>
    </div>
  )
}

export default function ExplorePanel() {
  const [tab, setTab] = useState<ExploreTab>('feed')
  const tripTemplates = useStore(s => s.tripTemplates)
  const savedTripIds = useStore(s => s.savedTripIds)
  const likeTrip = useStore(s => s.likeTrip)
  const saveTrip = useStore(s => s.saveTrip)

  const tabs: { id: ExploreTab; label: string; icon: string }[] = [
    { id: 'feed', label: 'My Rides', icon: '📊' },
    { id: 'routes', label: 'Routes', icon: '🗺️' },
    { id: 'nearby', label: 'Nearby', icon: '📍' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-white font-bold text-xl mb-3">Explore</h2>

        {/* Tabs */}
        <div className="flex bg-bg-card rounded-xl p-1 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-accent text-white' : 'text-gray-400'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {tab === 'feed' && (
          <>
            <p className="text-gray-500 text-xs">Your completed rides · Tap the eye to hide from friends</p>
            {RIDE_HISTORY.map(ride => (
              <RideFeedCard key={ride.id} ride={ride} />
            ))}
          </>
        )}

        {tab === 'routes' && (
          <>
            <p className="text-gray-500 text-xs">Community route templates around Bali</p>
            {tripTemplates.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                saved={savedTripIds.includes(trip.id)}
                onLike={() => likeTrip(trip.id)}
                onSave={() => saveTrip(trip.id)}
              />
            ))}
          </>
        )}

        {tab === 'nearby' && (
          <>
            <p className="text-gray-500 text-xs">Places of interest around Bali for riders</p>
            {MOCK_ATTRACTIONS.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).map(a => (
              <AttractionCard key={a.id} attraction={a} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
