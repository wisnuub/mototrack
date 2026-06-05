import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../../store/useStore'
import { isSupabaseReady } from '../../lib/supabase'
import { useRideSimulation } from '../../hooks/useRideSimulation'
import { INDONESIA_CENTER, KINTAMANI_ROUTE } from '../../data/mockData'
import { planRoute } from '../../lib/routing'
import type { NavStep } from '../../lib/routing'
import { detectTolls, formatTollSummary } from '../../lib/tolls'
import type { Rider } from '../../types'

type RideMode = 'idle' | 'solo' | 'group' | 'paused'

interface RideStop {
  id: string
  name: string
  emoji: string
  coords: [number, number]
  arrived: boolean
}

const DEMO_STOPS: RideStop[] = [
  { id: 's1', name: 'Ubud',       emoji: '🌿', coords: [-8.4166, 115.2713], arrived: false },
  { id: 's2', name: 'Kintamani',  emoji: '🌋', coords: [-8.2386, 115.3763], arrived: false },
  { id: 's3', name: 'Bedugul',    emoji: '🌊', coords: [-8.2748, 115.1669], arrived: false },
]

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl

function createRiderIcon(color: string, isYou: boolean, avatar = '🏍️', uid = 'r') {
  const W = isYou ? 64 : 52
  const R = isYou ? 23 : 19          // inner photo/avatar circle radius
  const BORDER = isYou ? 3.5 : 3     // white border ring width
  const rOuter = R + BORDER
  const CX = W / 2
  const CY = 6 + rOuter              // circle center, with top padding for shadow
  const triHW = 7                    // triangle half-width at base
  const triBase = CY + rOuter - 4    // triangle base y, overlaps circle to avoid gap
  const tipY = CY + rOuter + 12      // tip of the teardrop point
  const H = tipY + 5

  const isPhoto = avatar.startsWith('http') || avatar.startsWith('data:')
  const borderColor = isYou ? '#ff6b35' : '#ffffff'
  const shadowId = `rs${uid}`
  const clipId = `rc${uid}`

  // Avatar content: photo (clipped image) or emoji (text)
  const avatarContent = isPhoto
    ? `<image href="${avatar}" x="${CX - R}" y="${CY - R}" width="${R * 2}" height="${R * 2}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
    : `<text x="${CX}" y="${CY + R * 0.38}" text-anchor="middle" font-size="${Math.round(R * 1.05)}">${avatar}</text>`

  // Green GPS dot for "you" (top-right of circle)
  const gpsDot = isYou
    ? `<circle cx="${CX + R - 2}" cy="${CY - R + 5}" r="6.5" fill="#30d158" stroke="white" stroke-width="2"/>`
    : ''

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <defs>
    <filter id="${shadowId}" x="-40%" y="-20%" width="180%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
    <clipPath id="${clipId}"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  </defs>
  <!-- Teardrop border: outer circle + triangle -->
  <circle cx="${CX}" cy="${CY}" r="${rOuter}" fill="${borderColor}" filter="url(#${shadowId})"/>
  <polygon points="${CX - triHW},${triBase} ${CX + triHW},${triBase} ${CX},${tipY}" fill="${borderColor}" filter="url(#${shadowId})"/>
  <!-- White inner fill -->
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="white"/>
  ${avatarContent}
  ${gpsDot}
</svg>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [W, H],
    iconAnchor: [CX, tipY + 3],
    popupAnchor: [0, -(tipY + 3)],
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

function createStopIcon(emoji: string, arrived: boolean, num: number) {
  const color = arrived ? '#30d158' : '#ffd60a'
  const label = arrived ? '✓' : String(num)
  const svg = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 11.5 17 25 17 25S34 28.5 34 17C34 7.6 26.4 0 17 0z" fill="${color}"/>
      <circle cx="17" cy="16" r="11" fill="#0c0d13"/>
      <text x="17" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="white">${label}</text>
    </svg>
  `
  return L.divIcon({ html: svg, className: '', iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -42] })
}

function maneuverArrow(type: string, modifier: string): string {
  if (type === 'arrive') return '🏁'
  if (type === 'roundabout' || type === 'rotary' || type === 'exit roundabout' || type === 'exit rotary') return '↻'
  if (modifier === 'uturn') return '↩'
  if (modifier === 'sharp left') return '↰'
  if (modifier === 'left') return '←'
  if (modifier === 'slight left') return '↖'
  if (modifier === 'slight right') return '↗'
  if (modifier === 'sharp right') return '↱'
  if (modifier === 'right') return '→'
  return '↑'
}

function fmtDist(metres: number): string {
  if (metres >= 10000) return `${Math.round(metres / 1000)} km`
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`
  if (metres >= 100) return `${Math.round(metres / 100) * 100} m`
  return `${Math.round(metres / 10) * 10} m`
}

// Shared following ref passed down from RideMap — avoids fighting between
// GPS updates, fitBounds, and button presses.
type FollowingRef = React.MutableRefObject<boolean>

function RecenterMap({ center, gpsGranted, forceTick, followingRef }: {
  center: [number, number]
  gpsGranted: boolean
  forceTick: number
  followingRef: FollowingRef
}) {
  const map = useMap()
  const firstGrant = useRef(false)
  // True while a programmatic setView/fitBounds animation is in flight,
  // so zoomstart/movestart from that animation doesn't disable following.
  const programmatic = useRef(false)

  useEffect(() => {
    const onInteract = () => {
      if (!programmatic.current) followingRef.current = false
    }
    map.on('dragstart', onInteract)
    map.on('zoomstart', onInteract)
    return () => { map.off('dragstart', onInteract); map.off('zoomstart', onInteract) }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  // GPS update: instant pan (no animation) so rapid updates don't stack animations
  useEffect(() => {
    if (gpsGranted && !firstGrant.current) {
      firstGrant.current = true
      // Initial grant: animate once to show the user where they are, don't auto-follow
      programmatic.current = true
      map.setView(center, 14, { animate: true })
      map.once('moveend', () => { programmatic.current = false })
    } else if (firstGrant.current && followingRef.current) {
      // During a ride or after button press: instant pan, no animation jitter
      map.panTo(center, { animate: false })
    }
  }, [center, gpsGranted, map]) // eslint-disable-line react-hooks/exhaustive-deps

  // Target button: snap to user, enable following
  useEffect(() => {
    if (forceTick <= 0) return
    followingRef.current = true
    programmatic.current = true
    map.setView(center, Math.max(map.getZoom(), 14), { animate: true })
    map.once('moveend', () => { programmatic.current = false })
  }, [forceTick]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function FitBounds({ positions, tick, followingRef }: {
  positions: [number, number][]
  tick: number
  followingRef: FollowingRef
}) {
  const map = useMap()
  useEffect(() => {
    if (tick > 0 && positions.length > 1) {
      // Disable GPS following so it doesn't immediately steal the view back
      followingRef.current = false
      map.fitBounds(positions, { padding: [60, 60], animate: true, maxZoom: 14 })
    }
  }, [tick]) // eslint-disable-line react-hooks/exhaustive-deps
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

// ─── Route → SVG path helper ─────────────────────────────────────────────────

function routeToSvgPath(positions: [number, number][], w: number, h: number, pad = 16): string {
  if (positions.length < 2) return ''
  const lats = positions.map(p => p[0])
  const lngs = positions.map(p => p[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latR = maxLat - minLat || 0.001
  const lngR = maxLng - minLng || 0.001
  const aw = w - pad * 2, ah = h - pad * 2
  return positions
    .map(([lat, lng], i) => {
      const x = (pad + ((lng - minLng) / lngR) * aw).toFixed(1)
      const y = ((h - pad) - ((lat - minLat) / latR) * ah).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
}

function routeEndpoints(positions: [number, number][], w: number, h: number, pad = 16) {
  if (positions.length < 2) return null
  const lats = positions.map(p => p[0]), lngs = positions.map(p => p[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latR = maxLat - minLat || 0.001, lngR = maxLng - minLng || 0.001
  const toXY = ([lat, lng]: [number, number]): [number, number] => [
    pad + ((lng - minLng) / lngR) * (w - pad * 2),
    (h - pad) - ((lat - minLat) / latR) * (h - pad * 2),
  ]
  return { start: toXY(positions[0]), end: toXY(positions[positions.length - 1]) }
}

function roundRectCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ─── Ride Share Modal (Strava-style) ─────────────────────────────────────────

interface ShareModalProps {
  elapsed: number
  distanceTraveled: number
  avgSpeed: number
  maxSpeed: number
  stops: RideStop[]
  routePositions: [number, number][]
  myAvatar: string
  userName: string
  formatTime: (s: number) => string
  onClose: () => void
}

function RideShareModal({ elapsed, distanceTraveled, avgSpeed, maxSpeed, stops, routePositions, myAvatar, userName, formatTime, onClose }: ShareModalProps) {
  const [mode, setMode] = useState<'story' | 'camera'>('story')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [shared, setShared] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cameraContainerRef = useRef<HTMLDivElement>(null)
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null)
  const dragData = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const overlay = overlayRef.current
    const container = cameraContainerRef.current
    if (!overlay || !container) return
    const oRect = overlay.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    const posX = oRect.left - cRect.left
    const posY = oRect.top - cRect.top
    dragData.current = { startX: e.clientX, startY: e.clientY, posX, posY }
    setOverlayPos({ x: posX, y: posY })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragData.current || !overlayRef.current || !cameraContainerRef.current) return
    const d = dragData.current
    const cRect = cameraContainerRef.current.getBoundingClientRect()
    const oRect = overlayRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(cRect.width - oRect.width, d.posX + e.clientX - d.startX))
    const newY = Math.max(0, Math.min(cRect.height - oRect.height, d.posY + e.clientY - d.startY))
    setOverlayPos({ x: newX, y: newY })
  }

  const handleDragEnd = () => { dragData.current = null }

  const arrivedCount = stops.filter(s => s.arrived).length
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const storyPath  = routeToSvgPath(routePositions, 280, 140, 16)
  const storyPts   = routeEndpoints(routePositions, 280, 140, 16)
  const overlayPath = routeToSvgPath(routePositions, 160, 56, 8)

  // Start camera when switching to camera mode
  useEffect(() => {
    if (mode !== 'camera') return
    let active = true
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        setCameraStream(stream)
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      })
      .catch(() => setMode('story'))
    return () => { active = false }
  }, [mode])

  // Stop camera when leaving camera mode
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach(t => t.stop()) }
  }, [cameraStream])

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream) return
    setCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    const VW = video.videoWidth || 1080
    const VH = video.videoHeight || 1920
    canvas.width = VW; canvas.height = VH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, VW, VH)

    // Overlay card dimensions — position from drag state or default top-right
    const OW = Math.min(VW * 0.40, 300)
    const pad = 16
    const fs = OW / 10
    const statRows = 2
    const OHContent = pad + fs * 1.6 + fs * 0.8 + (statRows * fs * 2.2) + OW * 0.42 + pad
    let OX: number, OY: number
    if (overlayPos && cameraContainerRef.current) {
      const cRect = cameraContainerRef.current.getBoundingClientRect()
      OX = overlayPos.x * (VW / cRect.width)
      OY = overlayPos.y * (VH / cRect.height)
    } else {
      OX = VW - OW - 20
      OY = 20
    }

    // Card background
    ctx.fillStyle = 'rgba(12,13,19,0.88)'
    roundRectCanvas(ctx, OX, OY, OW, OHContent, OW * 0.06)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    roundRectCanvas(ctx, OX, OY, OW, OHContent, OW * 0.06)
    ctx.stroke()

    // Top accent line
    const grad = ctx.createLinearGradient(OX, OY, OX + OW, OY)
    grad.addColorStop(0, '#ff6b35'); grad.addColorStop(0.5, '#ffd60a'); grad.addColorStop(1, '#ff6b35')
    ctx.fillStyle = grad
    roundRectCanvas(ctx, OX, OY, OW, 3, 1.5)
    ctx.fill()

    // Logo
    ctx.textBaseline = 'alphabetic'
    ctx.font = `bold ${fs}px -apple-system, system-ui`
    ctx.fillStyle = '#ffffff'; ctx.fillText('Moto', OX + pad, OY + pad + fs * 1.1)
    ctx.fillStyle = '#ff6b35'; ctx.fillText('Track', OX + pad + ctx.measureText('Moto').width, OY + pad + fs * 1.1)
    ctx.font = `${fs * 0.65}px -apple-system, system-ui`
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText(dateStr, OX + pad, OY + pad + fs * 2.1)

    // Stats 2×2 grid
    const statData = [
      { label: 'DIST',  value: `${distanceTraveled} km` },
      { label: 'TIME',  value: formatTime(elapsed) },
      { label: 'AVG',   value: `${avgSpeed} km/h` },
      { label: 'TOP',   value: `${maxSpeed} km/h` },
    ]
    const col = OW / 2
    statData.forEach((s, i) => {
      const cx = OX + pad + (i % 2) * col
      const cy = OY + pad + fs * 2.9 + Math.floor(i / 2) * (fs * 2.3)
      ctx.font = `bold ${fs * 1.05}px -apple-system, system-ui`
      ctx.fillStyle = '#ffffff'; ctx.fillText(s.value, cx, cy)
      ctx.font = `${fs * 0.6}px -apple-system, system-ui`
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText(s.label, cx, cy + fs * 0.85)
    })

    // Mini route
    const routeBoxY = OY + pad + fs * 2.9 + 2 * fs * 2.3 + fs * 0.4
    const routeBoxH = OW * 0.38
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRectCanvas(ctx, OX + pad, routeBoxY, OW - pad * 2, routeBoxH, 8)
    ctx.fill()
    const rPath = routeToSvgPath(routePositions, OW - pad * 2, routeBoxH, 8)
    if (rPath) {
      ctx.save()
      ctx.translate(OX + pad, routeBoxY)
      ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.stroke(new Path2D(rPath))
      ctx.restore()
    }

    setCapturing(false)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'mototrack-ride.jpg', { type: 'image/jpeg' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Ride · MotoTrack' })
        setShared(true)
      } else {
        const a = document.createElement('a'); a.href = dataUrl; a.download = 'mototrack-ride.jpg'; a.click()
      }
    } catch { /* user cancelled */ }
  }

  const handleShareText = async () => {
    const text = [
      `🏍️ Ride Complete!`,
      `📏 ${distanceTraveled} km  ⏱️ ${formatTime(elapsed)}`,
      `⚡ Avg ${avgSpeed} km/h  🔝 Top ${maxSpeed} km/h`,
      arrivedCount > 0 ? `📍 ${arrivedCount}/${stops.length} stops completed` : '',
      `📅 ${dateStr}`,
      `\nTracked with MotoTrack 🏁`,
    ].filter(Boolean).join('\n')
    try {
      if (navigator.share) { await navigator.share({ title: 'My Ride', text }); setShared(true) }
      else { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2000) }
    } catch { /* cancelled */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 flex-shrink-0 bg-black">
        <div className="flex gap-2">
          {(['story', 'camera'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'}`}>
              {m === 'story' ? '📊 Stats Card' : '📷 Camera'}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-gray-400">✕</button>
      </div>

      {/* ── Story mode ── */}
      {mode === 'story' && (
        <>
          <div className="flex-1 flex items-center justify-center px-5 py-2 overflow-hidden">
            {/* 9:16 card */}
            <div className="relative bg-gray-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                 style={{ width: '100%', maxWidth: 340, aspectRatio: '9/16' }}>
              {/* Top accent stripe */}
              <div className="h-1 flex-shrink-0 bg-gradient-to-r from-accent via-accent-amber to-accent" />

              <div className="flex-1 flex flex-col p-5 min-h-0">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div>
                    <p className="text-white font-black text-lg tracking-tight leading-none">
                      Moto<span className="text-accent">Track</span>
                    </p>
                    <p className="text-gray-500 text-[11px] mt-1">{dateStr}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-xl">{myAvatar}</div>
                    <p className="text-gray-500 text-[9px] mt-0.5 truncate max-w-[72px]">{userName}</p>
                  </div>
                </div>

                {/* Route map */}
                <div className="flex-1 bg-gray-900 rounded-2xl relative overflow-hidden mb-3 min-h-0">
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.12) 0%, transparent 65%)' }} />
                  {routePositions.length >= 2 ? (
                    <svg viewBox="0 0 280 140" className="w-full h-full p-3" preserveAspectRatio="xMidYMid meet">
                      <path d={storyPath} fill="none" stroke="#ff6b35" strokeWidth="5" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={storyPath} fill="none" stroke="#ff6b35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {storyPts && <>
                        <circle cx={storyPts.start[0]} cy={storyPts.start[1]} r="5" fill="#30d158" />
                        <circle cx={storyPts.end[0]}   cy={storyPts.end[1]}   r="5" fill="#ff453a" />
                        <circle cx={storyPts.end[0]}   cy={storyPts.end[1]}   r="9" fill="none" stroke="#ff453a" strokeWidth="1.5" strokeOpacity="0.5" />
                      </>}
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-5xl opacity-20">🗺️</div>
                  )}
                </div>

                {/* Stats 2×2 */}
                <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
                  {[
                    { icon: '📏', label: 'Distance',  val: `${distanceTraveled}`,  unit: 'km'   },
                    { icon: '⏱️', label: 'Time',      val: formatTime(elapsed),    unit: ''     },
                    { icon: '⚡', label: 'Avg Speed', val: `${avgSpeed}`,           unit: 'km/h' },
                    { icon: '🔝', label: 'Top Speed', val: `${maxSpeed}`,           unit: 'km/h' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-2xl px-3 py-2.5">
                      <p className="text-gray-500 text-[10px] mb-0.5">{s.icon} {s.label}</p>
                      <p className="text-white font-black text-lg leading-none">
                        {s.val}<span className="text-gray-500 text-xs font-normal ml-1">{s.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Stops progress */}
                {stops.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                    <span className="text-gray-500 text-[10px] flex-shrink-0">Stops</span>
                    <div className="flex items-center gap-1 flex-1">
                      {stops.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-1 flex-1">
                          {i > 0 && <div className={`h-px flex-1 ${stops[i-1].arrived ? 'bg-moto-green/60' : 'bg-white/10'}`} />}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${s.arrived ? 'bg-moto-green text-white' : 'bg-white/10 text-gray-500'}`}>
                            {s.arrived ? '✓' : i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-gray-400 text-xs font-semibold flex-shrink-0">{arrivedCount}/{stops.length}</span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-shrink-0">
                  <p className="text-gray-600 text-[9px]">mototrack.id</p>
                  <p className="text-gray-600 text-[9px]">🏁 Ride Complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* Share button */}
          <div className="px-5 pb-8 flex-shrink-0">
            <button onClick={handleShareText}
              className="w-full bg-accent text-white font-bold py-4 rounded-2xl text-sm active:scale-95 transition-all flex items-center justify-center gap-2">
              {shared ? '✓ Shared!' : '↗ Share Stats'}
            </button>
          </div>
        </>
      )}

      {/* ── Camera mode ── */}
      {mode === 'camera' && (
        <div ref={cameraContainerRef} className="flex-1 relative overflow-hidden bg-gray-950"
             onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerLeave={handleDragEnd}>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm font-semibold">Camera access needed</p>
                <p className="text-xs mt-1 text-gray-600">Allow camera in browser settings</p>
              </div>
            </div>
          )}

          {/* Stats overlay — draggable */}
          <div
            ref={overlayRef}
            onPointerDown={handleDragStart}
            className="absolute w-44 rounded-2xl overflow-hidden shadow-2xl border border-white/15 cursor-grab active:cursor-grabbing select-none touch-none"
            style={overlayPos
              ? { background: 'rgba(12,13,19,0.85)', backdropFilter: 'blur(12px)', left: overlayPos.x, top: overlayPos.y }
              : { background: 'rgba(12,13,19,0.85)', backdropFilter: 'blur(12px)', top: 16, right: 16 }
            }
          >
            <div className="h-0.5 bg-gradient-to-r from-accent via-accent-amber to-accent" />
            <div className="p-3">
              <p className="text-white font-black text-sm tracking-tight leading-none mb-0.5">
                Moto<span className="text-accent">Track</span>
              </p>
              <p className="text-gray-500 text-[9px] mb-2">{dateStr}</p>

              {/* Mini route */}
              {routePositions.length >= 2 && (
                <div className="bg-black/30 rounded-xl mb-2 overflow-hidden" style={{ height: 52 }}>
                  <svg viewBox="0 0 160 52" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <path d={overlayPath} fill="none" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { v: `${distanceTraveled} km`, l: 'Distance' },
                  { v: formatTime(elapsed),       l: 'Time'     },
                  { v: `${avgSpeed} km/h`,        l: 'Avg'      },
                  { v: `${maxSpeed} km/h`,        l: 'Top'      },
                ].map(s => (
                  <div key={s.l} className="bg-white/8 rounded-xl p-1.5">
                    <p className="text-white font-bold text-xs leading-none">{s.v}</p>
                    <p className="text-gray-500 text-[9px] mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-28 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-black/40 text-white/40 text-[10px] rounded-full px-3 py-1 backdrop-blur-sm">
              Drag the overlay to reposition
            </span>
          </div>

          {/* Shutter button */}
          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3">
            <button
              onClick={handleCapture}
              disabled={capturing || !cameraStream}
              className="w-18 h-18 rounded-full border-4 border-white/80 flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 shadow-2xl"
              style={{ width: 72, height: 72 }}
            >
              {capturing
                ? <span className="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                : <span className="w-14 h-14 bg-white rounded-full" style={{ width: 56, height: 56 }} />
              }
            </button>
            <p className="text-white/50 text-xs">Tap to capture with overlay</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── RideMap ──────────────────────────────────────────────────────────────────

export default function RideMap({ rideMode = 'idle', rideStyle = 'wind', userDestinations = [], onStartRide, onPauseRide, onResumeRide, onEndRide }: {
  rideMode?: RideMode
  rideStyle?: 'routed' | 'wind'
  userDestinations?: string[]
  onStartRide?: () => void
  onPauseRide?: () => void
  onResumeRide?: () => void
  onEndRide?: () => void
}) {
  const riders = useStore(s => s.riders)
  const groups = useStore(s => s.groups)
  const activeGroupId = useStore(s => s.activeGroupId)
  const isTracking = useStore(s => s.isTracking)
  const setTracking = useStore(s => s.setTracking)
  const user = useStore(s => s.user)

  // Compute my rider ID — Supabase uses 'rider-{first8ofUID}', mock uses 'rider-1'
  const myRiderId = user && isSupabaseReady ? `rider-${user.id.slice(0, 8)}` : 'rider-1'
  const myAvatar = user?.avatar ?? '🏍️'

  const [elapsed, setElapsed] = useState(0)
  const [lapElapsed, setLapElapsed] = useState(0)
  const [lapCount, setLapCount] = useState(0)
  const [showShareCard, setShowShareCard] = useState(false)
  const [pendingEnd, setPendingEnd] = useState(false)
  const [traveledSplitIdx, setTraveledSplitIdx] = useState(1)
  const [forceCenterTick, setForceCenterTick] = useState(0)
  const mapFollowingRef = useRef(false)  // shared between RecenterMap + FitBounds
  const [stops, setStops] = useState<RideStop[]>(DEMO_STOPS)
  const [arrivalNotif, setArrivalNotif] = useState<string | null>(null)
  const prevRideModeRef = useRef<RideMode>('idle')
  // Start as 'granted' if we've had permission before (avoids "requesting GPS" flash on every map visit)
  const [gpsState, setGpsState] = useState<'idle' | 'granted' | 'denied' | 'asking'>(
    () => localStorage.getItem('mototrack-gps-granted') === '1' ? 'granted' : 'asking'
  )
  const [gpsErrorCode, setGpsErrorCode] = useState<number | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [hasGyro, setHasGyro] = useState(false)
  const [realPosition, setRealPosition] = useState<[number, number] | null>(null)
  const [mapTarget, setMapTarget] = useState<{ coords: [number, number]; name: string } | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Route preview state (from Explore "Show on Map")
  const [previewPolyline, setPreviewPolyline] = useState<[number, number][]>([])
  const [previewStops, setPreviewStops] = useState<{ coords: [number, number]; name: string; isEnd: boolean }[]>([])
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [previewDistM, setPreviewDistM] = useState(0)
  const [previewDurS, setPreviewDurS] = useState(0)
  const [previewToll, setPreviewToll] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fitBoundsTick, setFitBoundsTick] = useState(0)

  // Navigation state
  const [navRoute, setNavRoute] = useState<[number, number][]>([])
  const [navSteps, setNavSteps] = useState<NavStep[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [navLoading, setNavLoading] = useState(false)
  const [navError, setNavError] = useState<string | null>(null)
  const [navTotalDistance, setNavTotalDistance] = useState(0)
  const [navTotalDuration, setNavTotalDuration] = useState(0)

  useRideSimulation(true)

  // Pick up "show on map" requests from ExplorePanel
  useEffect(() => {
    // Single attraction pin
    const rawTarget = localStorage.getItem('mototrack-map-target')
    if (rawTarget) {
      try {
        const t = JSON.parse(rawTarget)
        setMapTarget({ coords: [t.lat, t.lng], name: t.name })
        localStorage.removeItem('mototrack-map-target')
      } catch {}
    }

    // Full route preview (from Explore Routes → Show on Map)
    const rawRoute = localStorage.getItem('mototrack-route-preview')
    if (rawRoute) {
      try {
        const { name, waypoints } = JSON.parse(rawRoute) as {
          name: string
          waypoints: { lat: number; lng: number; name: string }[]
        }
        localStorage.removeItem('mototrack-route-preview')
        if (waypoints.length >= 2) {
          setPreviewName(name)
          setPreviewLoading(true)
          // Fetch real road-following route from OSRM
          import('../../lib/routing').then(({ planRoute }) => {
            planRoute(waypoints[0].lat, waypoints[0].lng, waypoints.slice(1).map(w => w.name))
              .then(res => {
                if (res) {
                  setPreviewPolyline(res.route.routeGeometry)
                  setPreviewDistM(res.route.totalDistance)
                  setPreviewDurS(res.route.totalDuration)
                  setPreviewToll(formatTollSummary(detectTolls(res.route.routeGeometry)))
                  setPreviewStops(waypoints.map((w, i) => ({
                    coords: [w.lat, w.lng] as [number, number],
                    name: w.name,
                    isEnd: i === waypoints.length - 1,
                  })))
                } else {
                  // Fallback: draw straight lines between waypoints
                  setPreviewPolyline(waypoints.map(w => [w.lat, w.lng] as [number, number]))
                  setPreviewStops(waypoints.map((w, i) => ({
                    coords: [w.lat, w.lng] as [number, number],
                    name: w.name,
                    isEnd: i === waypoints.length - 1,
                  })))
                }
                setFitBoundsTick(t => t + 1)
              })
              .catch(() => {
                setPreviewPolyline(waypoints.map(w => [w.lat, w.lng] as [number, number]))
                setPreviewStops(waypoints.map((w, i) => ({
                  coords: [w.lat, w.lng] as [number, number],
                  name: w.name,
                  isEnd: i === waypoints.length - 1,
                })))
                setFitBoundsTick(t => t + 1)
              })
              .finally(() => setPreviewLoading(false))
          })
        }
      } catch {}
    }
  }, [])

  const startGpsWatch = (highFreq = false) => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (!navigator.geolocation) { setGpsState('denied'); setGpsErrorCode(0); return }
    // Only show 'asking' if we've never had permission — avoids the spinner on every map visit
    if (localStorage.getItem('mototrack-gps-granted') !== '1') setGpsState('asking')
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setRealPosition(coords)
        setGpsState('granted')
        setGpsErrorCode(null)
        setGpsAccuracy(Math.round(pos.coords.accuracy))
        localStorage.setItem('mototrack-gps-granted', '1')
      },
      (err) => { setGpsState('denied'); setGpsErrorCode(err.code) },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        // Idle: allow 3s cached position; riding: always fresh for smooth tracking
        maximumAge: highFreq ? 0 : 3000,
      }
    )
    watchIdRef.current = watchId
  }

  // Switch GPS frequency when ride starts/stops
  useEffect(() => {
    const riding = rideMode === 'solo' || rideMode === 'group'
    startGpsWatch(riding)
  }, [rideMode === 'idle' ? 'idle' : 'active']) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    startGpsWatch(false)
    const onOrient = () => { setHasGyro(true); window.removeEventListener('deviceorientation', onOrient) }
    window.addEventListener('deviceorientation', onOrient)
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeGroup = groups.find(g => g.id === activeGroupId)
  const me = riders.find(r => r.id === myRiderId)
  // Prefer real GPS, fall back to rider position from store, then Indonesia-wide center
  const center: [number, number] = realPosition ?? (me ? [me.position.lat, me.position.lng] : INDONESIA_CENTER)

  const distanceTraveled = 14.2 // km simulated
  const avgSpeed = 58 // km/h simulated
  const maxSpeed = 82 // km/h simulated
  const distRemaining = 53.8

  // Timer: ticks only during active riding — pauses when rideMode is paused, idle, or share card is open
  useEffect(() => {
    if (rideMode === 'idle' || rideMode === 'paused' || showShareCard) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [rideMode, showShareCard])

  // Reset on ride start; capture lap time on pause; tear down nav on end
  useEffect(() => {
    const prev = prevRideModeRef.current
    if (prev === 'idle' && (rideMode === 'solo' || rideMode === 'group')) {
      setElapsed(0)
      setLapCount(0)
      setCurrentStepIdx(0)
      setNavRoute([])
      setNavSteps([])
      setNavError(null)

      if (rideStyle === 'routed' && userDestinations.length > 0) {
        // Start with empty stops — populated after geocoding
        setStops([])
        setNavLoading(true)
        const startPos = realPosition ?? INDONESIA_CENTER
        let cancelled = false
        planRoute(startPos[0], startPos[1], userDestinations)
          .then(res => {
            if (cancelled) return
            if (!res) {
              setNavError("Couldn't find route — check destination names")
              setStops(DEMO_STOPS.map(s => ({ ...s, arrived: false })))
              return
            }
            setNavRoute(res.route.routeGeometry)
            setNavSteps(res.route.steps)
            setNavTotalDistance(res.route.totalDistance)
            setNavTotalDuration(res.route.totalDuration)
            const stopIcons = ['📍', '🏁', '⭐', '🎯', '🔵'] as const
            setStops(res.stops.map((coords, i) => ({
              id: `gs-${i}`,
              name: userDestinations[i] ?? `Stop ${i + 1}`,
              emoji: stopIcons[i % stopIcons.length],
              coords,
              arrived: false,
            })))
          })
          .catch(() => {
            if (!cancelled) {
              setNavError('Navigation unavailable — riding without guidance')
              setStops(DEMO_STOPS.map(s => ({ ...s, arrived: false })))
            }
          })
          .finally(() => { if (!cancelled) setNavLoading(false) })
        return () => { cancelled = true }
      } else {
        setStops(DEMO_STOPS.map(s => ({ ...s, arrived: false })))
      }
    }
    if ((prev === 'solo' || prev === 'group') && rideMode === 'paused') {
      setLapElapsed(elapsed)
      setLapCount(c => c + 1)
    }
    if (rideMode === 'idle') {
      setNavRoute([])
      setNavSteps([])
      setCurrentStepIdx(0)
      setNavLoading(false)
      setNavError(null)
      mapFollowingRef.current = false
    } else if (rideMode === 'solo' || rideMode === 'group') {
      mapFollowingRef.current = true  // follow GPS during an active ride
    }
    prevRideModeRef.current = rideMode
  }, [rideMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Geofence: auto-pause + check-in when within 100m of the next stop
  // Also advances nav steps when within 40m of the next maneuver point
  useEffect(() => {
    if (!realPosition || rideMode === 'idle' || rideMode === 'paused') return

    // Stop geofence check-in
    const nextStop = stops.find(s => !s.arrived)
    if (nextStop) {
      if (haversineMeters(realPosition, nextStop.coords) <= 100) {
        setStops(prev => prev.map(s => s.id === nextStop.id ? { ...s, arrived: true } : s))
        setArrivalNotif(nextStop.name)
        onPauseRide?.()
        const t = setTimeout(() => setArrivalNotif(null), 4000)
        return () => clearTimeout(t)
      }
    }

    // Nav step advancement
    if (rideStyle === 'routed' && navSteps.length > 0) {
      const nextStep = navSteps[currentStepIdx + 1]
      if (nextStep && haversineMeters(realPosition, nextStep.location) <= 40) {
        setCurrentStepIdx(i => i + 1)
      }
    }
  }, [realPosition]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const routePositions: [number, number][] =
    rideStyle === 'routed' && navRoute.length > 1
      ? navRoute
      : (activeGroup?.route ?? KINTAMANI_ROUTE).map(p => [p.lat, p.lng] as [number, number])

  // Remaining distance for the live stats bar
  const navDistanceRemaining =
    rideStyle === 'routed' && navSteps.length > 0
      ? navSteps.slice(currentStepIdx).reduce((sum, s) => sum + s.distance, 0)
      : null

  const riderPositions = riders.filter(r => r.position).map(r => [r.position.lat, r.position.lng] as [number, number])

  return (
    <div className="relative h-full flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={INDONESIA_CENTER}
          zoom={5}
          className="w-full h-full z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          {/* Route polylines — Google Maps style: orange past, grey future (group only) */}
          {rideMode !== 'idle' && routePositions.length > 1 && (() => {
            const ROUTE_DURATION_S = 1800
            const progress = Math.min(elapsed / ROUTE_DURATION_S, 1)
            const splitIdx = Math.max(1, Math.min(Math.floor(progress * routePositions.length), routePositions.length - 1))
            if (splitIdx !== traveledSplitIdx) setTraveledSplitIdx(splitIdx)
            const pastRoute = routePositions.slice(0, splitIdx + 1)
            const futureRoute = routePositions.slice(splitIdx)
            return (
              <>
                {/* Future route — only in group/routed mode */}
                {rideMode === 'group' && futureRoute.length > 1 && <>
                  <Polyline positions={futureRoute} pathOptions={{ color: '#1f2937', weight: 8, opacity: 0.9 }} />
                  <Polyline positions={futureRoute} pathOptions={{ color: '#6b7280', weight: 5, opacity: 0.7, dashArray: '12 6' }} />
                </>}
                {/* Traveled route — orange, solid */}
                {pastRoute.length > 1 && <>
                  <Polyline positions={pastRoute} pathOptions={{ color: '#c2410c', weight: 8, opacity: 0.8 }} />
                  <Polyline positions={pastRoute} pathOptions={{ color: '#ff6b35', weight: 5, opacity: 1 }} />
                </>}
              </>
            )
          })()}

          {/* Rider markers — other riders from store */}
          {riders.filter(r => r.position && r.id !== myRiderId).map(rider => (
            <Marker
              key={rider.id}
              position={[rider.position.lat, rider.position.lng]}
              icon={createRiderIcon(rider.color, false, rider.avatar, rider.id)}
            >
              <Popup className="moto-popup">
                <div className="bg-bg-card rounded-xl p-3 min-w-[160px]">
                  <p className="text-white font-semibold">{rider.avatar} {rider.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{rider.speed} km/h · {rider.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* "You" marker — use real GPS position if available, else store position */}
          {(realPosition || me) && (
            <Marker
              position={realPosition ?? [me!.position.lat, me!.position.lng]}
              icon={createRiderIcon('#ff6b35', true, myAvatar, 'me')}
            >
              <Popup className="moto-popup">
                <div className="bg-bg-card rounded-xl p-3 min-w-[160px]">
                  <p className="text-white font-semibold">{myAvatar} You</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {gpsState === 'granted' ? '📍 GPS Active' : '📍 Approx. location'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

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

          {/* Destination pin from Explore */}
          {mapTarget && (
            <Marker position={mapTarget.coords} icon={createDestinationIcon()}>
              <Popup>
                <div className="bg-bg-card rounded-xl p-3">
                  <p className="text-white font-semibold text-sm">{mapTarget.name}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapTarget.coords[0]},${mapTarget.coords[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-xs mt-1 block"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Stop geofence circles (100m radius) */}
          {rideMode !== 'idle' && stops.filter(s => !s.arrived).map((stop, _) => {
            const idx = stops.indexOf(stop)
            const isNext = stops.slice(0, idx).every(s => s.arrived)
            return (
              <Circle
                key={`circle-${stop.id}`}
                center={stop.coords}
                radius={100}
                pathOptions={{
                  color: isNext ? '#ffd60a' : '#ffffff30',
                  fillColor: isNext ? '#ffd60a' : '#ffffff',
                  fillOpacity: isNext ? 0.10 : 0.04,
                  weight: isNext ? 1.5 : 1,
                  dashArray: '5 5',
                }}
              />
            )
          })}

          {/* Stop markers */}
          {rideMode !== 'idle' && stops.map((stop, i) => (
            <Marker key={`stop-${stop.id}`} position={stop.coords} icon={createStopIcon(stop.emoji, stop.arrived, i + 1)}>
              <Popup>
                <div className="bg-bg-card rounded-xl p-3 min-w-[140px]">
                  <p className="text-white font-semibold text-sm">{stop.emoji} Stop {i + 1}: {stop.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{stop.arrived ? '✅ Arrived' : '📍 100m auto check-in'}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route preview polyline (from Explore "Show on Map") */}
          {previewPolyline.length > 1 && (
            <>
              <Polyline positions={previewPolyline} pathOptions={{ color: '#7c2d12', weight: 7, opacity: 0.85 }} />
              <Polyline positions={previewPolyline} pathOptions={{ color: '#ff6b35', weight: 4, opacity: 1 }} />
            </>
          )}

          {/* Route preview stop pins */}
          {previewStops.map((stop, i) => {
            const isStart = i === 0
            // Start = green dot, intermediate = orange numbered, end = red pin
            const color = isStart ? '#30d158' : stop.isEnd ? '#ff3b30' : '#ff6b35'
            const label = isStart ? '●' : stop.isEnd ? '🏁' : String(i)
            const size = stop.isEnd ? 34 : 28
            const anchor = stop.isEnd ? 17 : 14
            const icon = L.divIcon({
              html: `<svg width="${size}" height="${Math.round(size * 36/28)}" viewBox="0 0 ${size} ${Math.round(size * 36/28)}" xmlns="http://www.w3.org/2000/svg">
                <path d="M${size/2} 0C${size*0.225} 0 0 ${size*0.225} 0 ${size/2}c0 ${size*0.35} ${size/2} ${size*0.786} ${size/2} ${size*0.786}S${size} ${size*0.85} ${size} ${size/2}C${size} ${size*0.225} ${size*0.775} 0 ${size/2} 0z" fill="${color}"/>
                <circle cx="${size/2}" cy="${size/2}" r="${size*0.29}" fill="white" opacity="0.92"/>
                <text x="${size/2}" y="${size/2 + size*0.115}" text-anchor="middle" font-size="${size*0.32}" font-weight="bold" fill="${color}">${label}</text>
              </svg>`,
              className: '', iconSize: [size, Math.round(size * 36/28)], iconAnchor: [anchor, Math.round(size * 36/28)], popupAnchor: [0, -Math.round(size * 36/28)],
            })
            return (
              <Marker key={`prev-${i}`} position={stop.coords} icon={icon}>
                <Popup><div className="bg-bg-card rounded-xl p-2"><p className="text-white text-xs font-semibold">{stop.name}</p></div></Popup>
              </Marker>
            )
          })}

          <FitBounds positions={previewPolyline.length > 1 ? previewPolyline : previewStops.map(s => s.coords)} tick={fitBoundsTick} followingRef={mapFollowingRef} />
          <RecenterMap center={mapTarget ? mapTarget.coords : center} gpsGranted={gpsState === 'granted'} forceTick={forceCenterTick} followingRef={mapFollowingRef} />
        </MapContainer>

        {/* Navigation banner — routed rides */}
        {rideMode !== 'idle' && rideStyle === 'routed' && (() => {
          const otherRiders = riders.filter(r => r.id !== myRiderId && r.status !== 'offline')
          const isPhoto = (v: string) => v.startsWith('http') || v.startsWith('data:')
          const Avatar = ({ src, size = 'md' }: { src: string; size?: 'sm' | 'md' }) => {
            const cls = size === 'sm'
              ? 'w-6 h-6 rounded-full border border-white/20 bg-bg-card flex items-center justify-center overflow-hidden flex-shrink-0'
              : 'w-12 h-12 rounded-xl border-2 border-blue-400/50 bg-bg-card flex items-center justify-center overflow-hidden flex-shrink-0'
            return (
              <div className={cls}>
                {isPhoto(src)
                  ? <img src={src} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <span className={size === 'sm' ? 'text-xs' : 'text-2xl'}>{src}</span>}
              </div>
            )
          }
          return (
            <div className="absolute top-3 left-3 right-3 z-10">
              {navLoading ? (
                <div className="bg-[#0d2137]/95 backdrop-blur-md rounded-2xl px-4 py-3 border border-blue-500/30 flex items-center gap-3 shadow-lg">
                  <span className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">Calculating route…</p>
                    <p className="text-blue-300 text-xs mt-0.5">Looking up destinations</p>
                  </div>
                </div>
              ) : navError ? (
                <div className="bg-[#2d0a0a]/95 backdrop-blur-md rounded-2xl px-4 py-3 border border-moto-red/30 flex items-center gap-3 shadow-lg">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <p className="text-white text-sm font-medium">{navError}</p>
                </div>
              ) : navSteps.length > 0 && currentStepIdx < navSteps.length ? (
                <div className="bg-[#0d2137]/95 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-xl overflow-hidden">
                  {/* Main instruction row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Rider avatar + direction badge */}
                    <div className="relative flex-shrink-0">
                      <Avatar src={myAvatar} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-[#0d2137] text-white text-[11px] font-bold select-none leading-none">
                        {maneuverArrow(navSteps[currentStepIdx].maneuverType, navSteps[currentStepIdx].maneuverModifier)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-tight line-clamp-2">
                        {navSteps[currentStepIdx].instruction}
                      </p>
                      {navSteps[currentStepIdx + 1] && (
                        <p className="text-blue-300 text-xs mt-0.5 truncate">
                          Then: {navSteps[currentStepIdx + 1].instruction}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-white font-black text-base leading-none">
                        {fmtDist(navSteps[currentStepIdx].distance)}
                      </p>
                    </div>
                  </div>

                  {/* Group members + ETA strip */}
                  <div className="bg-black/25 px-4 py-2 flex items-center gap-2">
                    {otherRiders.length > 0 && (
                      <div className="flex items-center gap-1 mr-1.5">
                        {otherRiders.slice(0, 4).map(r => (
                          <div key={r.id} className="relative">
                            <Avatar src={r.avatar} size="sm" />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0d2137] ${
                              r.status === 'riding' ? 'bg-moto-green' : 'bg-accent-amber'
                            }`} />
                          </div>
                        ))}
                        {otherRiders.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">+{otherRiders.length - 4}</span>
                          </div>
                        )}
                        <span className="text-blue-300/60 text-[10px] ml-1">
                          {otherRiders.length} riding
                        </span>
                      </div>
                    )}
                    <p className="text-blue-300 text-xs">
                      {navSteps[currentStepIdx + 1] ? `${currentStepIdx + 1}/${navSteps.length - 1}` : '🏁 Arriving'}
                    </p>
                    {navDistanceRemaining !== null && (
                      <p className="text-blue-300 text-xs ml-auto">
                        {fmtDist(navDistanceRemaining)} · {Math.ceil(navTotalDuration * (navDistanceRemaining / Math.max(navTotalDistance, 1)) / 60)} min
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })()}

        {/* Group + destination overlay — wind rides only (nav banner handles routed) */}
        {rideMode !== 'idle' && rideStyle !== 'routed' && (
          <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
            <div className="bg-bg-primary/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{activeGroup?.emoji} {activeGroup?.name ?? 'No active group'}</p>
                  <p className="text-gray-400 text-xs truncate max-w-[200px]">
                    {activeGroup?.destinationName ? `🏁 ${activeGroup.destinationName}` : 'No destination set'}
                  </p>
                </div>
                <span className="bg-moto-green/20 text-moto-green text-xs font-semibold px-2 py-1 rounded-full">
                  {riders.filter(r => r.status !== 'offline').length} riding
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Route preview banner */}
        {previewName && rideMode === 'idle' && (
          <div className="absolute top-3 left-3 right-3 z-10">
            <div className="bg-[#0d1f3a]/95 backdrop-blur-md rounded-2xl border border-blue-500/30 shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {previewLoading ? (
                  <span className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 bg-blue-600/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="2,8 6,4 10,8 14,4" /></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{previewName}</p>
                  {previewLoading ? (
                    <p className="text-blue-300 text-xs">Fetching road route…</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {previewDistM > 0 && <span className="text-blue-300 text-xs">{(previewDistM / 1000).toFixed(1)} km</span>}
                      {previewDurS > 0 && <span className="text-blue-300 text-xs">~{Math.ceil(previewDurS / 60)} min</span>}
                      {previewStops.length > 2 && <span className="text-blue-300 text-xs">{previewStops.length - 2} stop{previewStops.length - 2 > 1 ? 's' : ''}</span>}
                      {previewToll && (
                        <span className="text-accent-amber text-xs font-semibold">{previewToll}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setPreviewName(null); setPreviewPolyline([]); setPreviewStops([]); setPreviewDistM(0); setPreviewDurS(0); setPreviewToll(null) }}
                  className="text-gray-400 text-lg leading-none ml-1 flex-shrink-0"
                >✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Destination banner (Explore pin) */}
        {mapTarget && rideMode === 'idle' && !previewName && (
          <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
            <div className="bg-bg-primary/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-accent/30 flex items-center justify-between pointer-events-auto">
              <div>
                <p className="text-accent text-xs font-semibold">Pinned location</p>
                <p className="text-white font-bold text-sm">{mapTarget.name}</p>
              </div>
              <button onClick={() => setMapTarget(null)} className="text-gray-400 text-lg leading-none ml-3">✕</button>
            </div>
          </div>
        )}

        {/* Arrival notification toast */}
        {arrivalNotif && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-moto-green text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3 whitespace-nowrap animate-slide-up">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-bold text-sm">Arrived at {arrivalNotif}!</p>
              <p className="text-xs opacity-80">Ride paused · tap Resume when ready</p>
            </div>
          </div>
        )}

        {/* Stops progress strip */}
        {rideMode !== 'idle' && (
          <div className="absolute bottom-[4.5rem] left-3 right-16 z-10">
            <div className="bg-bg-primary/90 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {stops.map((stop, i) => {
                const isNext = !stop.arrived && stops.slice(0, i).every(s => s.arrived)
                return (
                  <div key={stop.id} className="flex items-center gap-1.5 flex-shrink-0">
                    {i > 0 && (
                      <div className={`h-px w-4 flex-shrink-0 ${stops[i - 1].arrived ? 'bg-moto-green/60' : 'bg-white/15'}`} />
                    )}
                    <div className={`flex items-center gap-1 transition-opacity ${stop.arrived ? 'opacity-50' : isNext ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        stop.arrived ? 'bg-moto-green text-white' : isNext ? 'bg-accent-amber text-black ring-2 ring-accent-amber/40' : 'bg-white/10 text-gray-400'
                      }`}>
                        {stop.arrived ? '✓' : i + 1}
                      </div>
                      <span className="text-[10px] text-white/80 whitespace-nowrap">{stop.emoji} {stop.name}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* GPS status badges */}
        {gpsState === 'asking' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-bg-primary/90 border border-white/10 text-gray-400 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-xs shadow-lg backdrop-blur-sm whitespace-nowrap">
            <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
            Requesting GPS…
          </div>
        )}
        {gpsState === 'denied' && (
          <div className="absolute top-16 left-3 right-3 z-10 bg-bg-primary/95 border border-moto-red/30 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
            <p className="text-moto-red font-bold text-sm mb-1">
              {gpsErrorCode === 2 ? '📡 GPS signal unavailable' : gpsErrorCode === 3 ? '⏱️ GPS timed out' : '📍 Location access blocked'}
            </p>
            {gpsErrorCode === 1 || gpsErrorCode == null ? (
              <div className="text-gray-400 text-xs space-y-1 mb-3">
                <p className="font-semibold text-gray-300">How to fix:</p>
                <p>📱 <strong className="text-white">iOS Safari:</strong> Settings → Privacy &amp; Security → Location Services → Safari → Allow</p>
                <p>🤖 <strong className="text-white">Android Chrome:</strong> Tap the 🔒 lock icon in the address bar → Permissions → Location → Allow</p>
                <p>🖥️ <strong className="text-white">Desktop Chrome:</strong> Click the lock icon → Site settings → Location → Allow</p>
                <p>📲 <strong className="text-white">PWA / Home screen:</strong> Delete &amp; re-add to Home Screen, then allow location when prompted</p>
              </div>
            ) : (
              <p className="text-gray-400 text-xs mb-3">
                {gpsErrorCode === 2 ? 'Move to an open area or check that Location Services is on for this app.' : 'GPS took too long. Make sure you are outdoors or near a window.'}
              </p>
            )}
            <button
              onClick={() => startGpsWatch(false)}
              className="w-full bg-accent text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {/* Ride control buttons — bottom-left */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          {rideMode === 'idle' && (
            <button onClick={onStartRide}
              className="bg-moto-green text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 text-sm shadow-lg active:scale-95 transition-all">
              ▶ Start Ride
            </button>
          )}
          {(rideMode === 'solo' || rideMode === 'group') && (
            <>
              <button onClick={() => { onPauseRide?.(); setShowShareCard(true) }}
                className="bg-accent-amber text-black font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 text-sm shadow-lg active:scale-95 transition-all">
                ⏸ Pause
              </button>
              <button onClick={() => { setShowShareCard(true); setPendingEnd(true) }}
                className="bg-moto-red text-white font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 text-sm shadow-lg active:scale-95 transition-all">
                ■ Stop
              </button>
            </>
          )}
          {rideMode === 'paused' && (
            <>
              <button onClick={onResumeRide}
                className="bg-moto-green text-white font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 text-sm shadow-lg active:scale-95 transition-all">
                ▶ Resume
              </button>
              <button onClick={() => { setShowShareCard(true); setPendingEnd(true) }}
                className="bg-moto-red text-white font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 text-sm shadow-lg active:scale-95 transition-all">
                ■ End
              </button>
            </>
          )}
        </div>

        {/* GPS accuracy badge — top left */}
        {gpsState === 'granted' && gpsAccuracy !== null && (
          <div className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border backdrop-blur-sm ${
            (gpsAccuracy <= 20 || hasGyro)
              ? 'bg-moto-green/20 border-moto-green/30 text-moto-green'
              : gpsAccuracy <= 100
              ? 'bg-accent-amber/20 border-accent-amber/30 text-accent-amber'
              : 'bg-moto-red/20 border-moto-red/30 text-moto-red'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${(gpsAccuracy <= 20 || hasGyro) ? 'bg-moto-green' : gpsAccuracy <= 100 ? 'bg-accent-amber' : 'bg-moto-red'}`} />
            {hasGyro ? '📱 Phone · GPS' : gpsAccuracy <= 20 ? '📍 GPS' : gpsAccuracy <= 100 ? `±${gpsAccuracy}m` : `±${gpsAccuracy}m · weak`}
          </div>
        )}

        {/* Center button — bottom right only */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1.5">
          <button
            className="bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            onClick={() => { if (!isTracking) setTracking(true); setForceCenterTick(t => t + 1) }}
            title="Center to my location"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="5.5" />
              <line x1="11" y1="1" x2="11" y2="5" />
              <line x1="11" y1="17" x2="11" y2="21" />
              <line x1="1" y1="11" x2="5" y2="11" />
              <line x1="17" y1="11" x2="21" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      {/* Live stats — active ride */}
      {(rideMode === 'solo' || rideMode === 'group') && (
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
            <LiveStat
              label="Remaining"
              value={navDistanceRemaining !== null ? (navDistanceRemaining / 1000).toFixed(1) : `${distRemaining}`}
              sub="km"
            />
          </div>
        </div>
      )}

      {/* Ride share modal */}
      {showShareCard && (
        <RideShareModal
          elapsed={elapsed}
          distanceTraveled={distanceTraveled}
          avgSpeed={avgSpeed}
          maxSpeed={maxSpeed}
          stops={stops}
          routePositions={routePositions.slice(0, traveledSplitIdx + 1)}
          myAvatar={myAvatar}
          userName={user?.name ?? 'Rider'}
          formatTime={formatTime}
          onClose={() => {
            setShowShareCard(false)
            if (pendingEnd) {
              setPendingEnd(false)
              onEndRide?.()
            }
          }}
        />
      )}

      {/* Lap summary — shown when paused */}
      {rideMode === 'paused' && (
        <div className="bg-bg-secondary border-t border-accent-amber/30 px-4 py-3">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <span className="text-xs text-accent-amber uppercase tracking-wider font-bold">
                ⏸ Lap {lapCount} Summary
              </span>
              <span className="text-gray-500 text-xs ml-2">this segment: {formatTime(lapElapsed)}</span>
            </div>
            <span className="text-xs text-gray-500">Total: {formatTime(elapsed)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <LiveStat label="Distance"  value={`${distanceTraveled}`}       sub="km"  />
            <LiveStat label="Top Speed" value={`${maxSpeed}`}               sub="km/h" />
            <LiveStat label="Avg Speed" value={`${avgSpeed}`}               sub="km/h" />
            <LiveStat label="Lean Angle" value="28°"                        sub="max"  />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { icon: '🛑', label: 'Hard Braking',  value: '2x',  color: '#ff453a' },
              { icon: '⚡', label: 'Rapid Accel',   value: '3x',  color: '#ffd60a' },
              { icon: '📱', label: 'Phone Alerts',  value: '1x',  color: '#0a84ff' },
              { icon: '⛽', label: 'Fuel Est.',     value: '~0.8L', color: '#30d158' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-bg-card rounded-xl px-3 py-1.5 flex-shrink-0 border border-white/5">
                <span className="text-sm">{s.icon}</span>
                <div>
                  <p className="font-bold text-xs leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-gray-500 text-[9px] mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
