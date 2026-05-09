import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../../store/useStore'
import { useRideSimulation } from '../../hooks/useRideSimulation'
import { BALI_CENTER, KINTAMANI_ROUTE } from '../../data/mockData'
import type { Rider } from '../../types'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl

function createRiderIcon(color: string, isYou: boolean) {
  const size = isYou ? 44 : 36
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      ${isYou ? `<circle cx="22" cy="22" r="21" fill="${color}22" stroke="${color}" stroke-width="1.5"/>` : ''}
      <circle cx="22" cy="22" r="${isYou ? 16 : 14}" fill="${color}" />
      <text x="22" y="27" text-anchor="middle" font-size="${isYou ? '14' : '12'}" fill="white">🏍️</text>
      ${isYou ? `<circle cx="32" cy="12" r="5" fill="#30d158"/><text x="32" y="16" text-anchor="middle" font-size="8" fill="white">●</text>` : ''}
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function createDestinationIcon() {
  const svg = `
    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C9 0 0 9 0 20c0 14 20 28 20 28S40 34 40 20C40 9 31 0 20 0z" fill="#ff6b35"/>
      <text x="20" y="25" text-anchor="middle" font-size="16">🏁</text>
    </svg>
  `
  return L.divIcon({ html: svg, className: '', iconSize: [40, 48], iconAnchor: [20, 48], popupAnchor: [0, -48] })
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function RiderCard({ rider }: { rider: Rider }) {
  const bike = useStore(s => s.bikes.find(b => b.id === rider.bikeId))
  return (
    <div className="flex-shrink-0 bg-bg-card rounded-2xl p-3 w-44 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{rider.avatar}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{rider.name}</p>
          <p className="text-gray-500 text-xs truncate">{bike?.model ?? 'Unknown'}</p>
        </div>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          rider.status === 'riding' ? 'bg-moto-green' :
          rider.status === 'stopped' ? 'bg-accent-amber' : 'bg-gray-500'
        }`} />
      </div>
      <div className="flex justify-between text-xs">
        <div className="text-center">
          <p className="text-white font-bold">{rider.speed}</p>
          <p className="text-gray-500">km/h</p>
        </div>
        <div className="text-center">
          <p className={`font-semibold capitalize ${
            rider.status === 'riding' ? 'text-moto-green' :
            rider.status === 'stopped' ? 'text-accent-amber' : 'text-gray-400'
          }`}>{rider.status}</p>
          <p className="text-gray-500">status</p>
        </div>
      </div>
    </div>
  )
}

interface LiveStatProps { label: string; value: string; sub?: string }
function LiveStat({ label, value, sub }: LiveStatProps) {
  return (
    <div className="text-center">
      <p className="text-white font-bold text-lg leading-none">{value}</p>
      {sub && <p className="text-accent text-xs">{sub}</p>}
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}

export default function RideMap() {
  const riders = useStore(s => s.riders)
  const groups = useStore(s => s.groups)
  const activeGroupId = useStore(s => s.activeGroupId)
  const isTracking = useStore(s => s.isTracking)
  const setTracking = useStore(s => s.setTracking)

  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState<number>(Date.now() - 12 * 60 * 1000)
  const [gpsState, setGpsState] = useState<'idle' | 'granted' | 'denied' | 'asking'>('idle')

  useRideSimulation(true)

  // Request GPS permission — browser shows native prompt
  const requestGps = () => {
    if (!navigator.geolocation) { setGpsState('denied'); return }
    setGpsState('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsState('granted')
        // In a real app: send pos.coords to the server to update rider position
        console.log('GPS granted:', pos.coords.latitude, pos.coords.longitude)
      },
      () => setGpsState('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const activeGroup = groups.find(g => g.id === activeGroupId)
  const me = riders.find(r => r.id === 'rider-1')
  const center: [number, number] = me
    ? [me.position.lat, me.position.lng]
    : BALI_CENTER

  const distanceTraveled = 14.2 // km simulated
  const avgSpeed = 58 // km/h simulated
  const maxSpeed = 82 // km/h simulated
  const distRemaining = 53.8

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const routePositions = (activeGroup?.route ?? KINTAMANI_ROUTE).map(
    p => [p.lat, p.lng] as [number, number]
  )

  const riderPositions = riders.filter(r => r.position).map(r => [r.position.lat, r.position.lng] as [number, number])

  return (
    <div className="relative h-full flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={BALI_CENTER}
          zoom={11}
          className="w-full h-full z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Route polyline */}
          {routePositions.length > 0 && (
            <>
              {/* Shadow */}
              <Polyline
                positions={routePositions}
                pathOptions={{ color: '#000', weight: 6, opacity: 0.3 }}
              />
              {/* Main route */}
              <Polyline
                positions={routePositions}
                pathOptions={{ color: '#ff6b35', weight: 4, opacity: 0.9, dashArray: '0' }}
              />
            </>
          )}

          {/* Ridden portion (dashed for traveled) */}
          {routePositions.length > 0 && (
            <Polyline
              positions={routePositions.slice(0, 3)}
              pathOptions={{ color: '#ffffff', weight: 3, opacity: 0.4, dashArray: '8 8' }}
            />
          )}

          {/* Rider markers */}
          {riders.filter(r => r.position).map(rider => (
            <Marker
              key={rider.id}
              position={[rider.position.lat, rider.position.lng]}
              icon={createRiderIcon(rider.color, rider.id === 'rider-1')}
            >
              <Popup className="moto-popup">
                <div className="bg-bg-card rounded-xl p-3 min-w-[160px]">
                  <p className="text-white font-semibold">{rider.avatar} {rider.name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {rider.speed} km/h · {rider.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destination marker */}
          {activeGroup?.destination && (
            <Marker
              position={[activeGroup.destination.lat, activeGroup.destination.lng]}
              icon={createDestinationIcon()}
            >
              <Popup>
                <div className="bg-bg-card rounded-xl p-3">
                  <p className="text-white font-semibold">🏁 Destination</p>
                  <p className="text-gray-400 text-xs mt-1">{activeGroup.destinationName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          <RecenterMap center={isTracking ? center : BALI_CENTER} />
        </MapContainer>

        {/* Top overlay - group + destination */}
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-bg-primary/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{activeGroup?.emoji} {activeGroup?.name ?? 'No active group'}</p>
                <p className="text-gray-400 text-xs truncate max-w-[200px]">
                  {activeGroup?.destinationName ? `🏁 ${activeGroup.destinationName}` : 'No destination set'}
                </p>
              </div>
              <div className="pointer-events-auto">
                <span className="bg-moto-green/20 text-moto-green text-xs font-semibold px-2 py-1 rounded-full">
                  {riders.filter(r => r.status !== 'offline').length} riding
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GPS permission button */}
        {gpsState === 'idle' && (
          <button
            onClick={requestGps}
            className="absolute bottom-20 right-4 z-10 bg-bg-primary/90 border border-accent/40 text-accent rounded-2xl px-3 py-2 flex items-center gap-2 text-xs font-semibold shadow-lg backdrop-blur-sm"
          >
            📍 Enable GPS
          </button>
        )}
        {gpsState === 'asking' && (
          <div className="absolute bottom-20 right-4 z-10 bg-bg-primary/90 border border-white/10 text-gray-400 rounded-2xl px-3 py-2 flex items-center gap-2 text-xs shadow-lg">
            <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Waiting…
          </div>
        )}
        {gpsState === 'granted' && (
          <div className="absolute bottom-20 right-4 z-10 bg-moto-green/20 border border-moto-green/30 text-moto-green rounded-2xl px-3 py-2 flex items-center gap-2 text-xs font-semibold shadow-lg">
            ✅ GPS Active
          </div>
        )}
        {gpsState === 'denied' && (
          <div className="absolute bottom-20 right-4 z-10 bg-moto-red/20 border border-moto-red/30 text-moto-red rounded-2xl px-3 py-2 text-xs font-semibold shadow-lg">
            GPS blocked — check browser settings
          </div>
        )}

        {/* Track/center button */}
        <button
          className="absolute bottom-4 right-4 z-10 bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-xl"
          onClick={() => setTracking(!isTracking)}
        >
          {isTracking ? '📍' : '🧭'}
        </button>
      </div>

      {/* Live stats bar */}
      <div className="bg-bg-secondary border-t border-white/5 px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Live Stats</span>
          <span className="text-xs text-moto-green font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-moto-green rounded-full animate-pulse" />
            Active Ride
          </span>
        </div>
        <div className="flex justify-between">
          <LiveStat label="Distance" value={`${distanceTraveled}`} sub="km" />
          <LiveStat label="Time" value={formatTime(elapsed)} />
          <LiveStat label="Avg Speed" value={`${avgSpeed}`} sub="km/h" />
          <LiveStat label="Top Speed" value={`${maxSpeed}`} sub="km/h" />
          <LiveStat label="Remaining" value={`${distRemaining}`} sub="km" />
        </div>
      </div>

      {/* Rider cards scroll */}
      <div className="bg-bg-secondary border-t border-white/5 py-3">
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
          {riders.map(rider => (
            <RiderCard key={rider.id} rider={rider} />
          ))}
        </div>
      </div>
    </div>
  )
}
