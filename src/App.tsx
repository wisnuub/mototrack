import { useState, useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { supabase, isSupabaseReady } from './lib/supabase'
import { dbGetProfile, dbGetAdminProfile } from './lib/db'
import { useRealtimeRiders } from './hooks/useRealtimeRiders'
import { useRealtimeMessages } from './hooks/useRealtimeMessages'
import BottomNav from './components/layout/BottomNav'
import AuthScreen from './components/auth/AuthScreen'
import OnboardingScreen from './components/auth/OnboardingScreen'
import RideMap from './components/map/RideMap'
import ChatPanel from './components/chat/ChatPanel'
import MusicPlayer from './components/chat/MusicPlayer'
import ExplorePanel from './components/explore/ExplorePanel'
import GaragePanel from './components/garage/GaragePanel'
import WeatherPanel from './components/weather/WeatherPanel'
import ProfileSheet from './components/profile/ProfileSheet'
import type { TabId, BadgeType } from './types'

type RideMode = 'idle' | 'solo' | 'group' | 'paused'
type RideStyle = 'routed' | 'wind'

interface LaunchDest { id: string; name: string }
type LaunchStep = 'mode' | 'style' | 'route' | 'caution'

// ── 4-step Ride Launcher ─────────────────────────────────────────────────────

function RideLauncher({
  onStart,
  onDismiss,
}: {
  onStart: (mode: RideMode, style: RideStyle, dests: LaunchDest[]) => void
  onDismiss: () => void
}) {
  const [step, setStep] = useState<LaunchStep>('mode')
  const [mode, setMode] = useState<'group' | 'solo'>('solo')
  const [style, setStyle] = useState<RideStyle>('wind')
  const [dests, setDests] = useState<LaunchDest[]>([])
  const [destInput, setDestInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addDest = () => {
    if (!destInput.trim()) return
    setDests(prev => [...prev, { id: `d-${Date.now()}`, name: destInput.trim() }])
    setDestInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const moveDest = (idx: number, dir: -1 | 1) => {
    const next = idx + dir
    if (next < 0 || next >= dests.length) return
    setDests(prev => {
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  // ── Step 1: Mode ─────────────────────────────────────────────────────────────
  if (step === 'mode') return (
    <div className="fixed inset-0 z-30 bg-bg-primary/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up">
        <div className="px-6 pt-6 pb-2 text-center">
          <p className="text-3xl mb-2">🏍️</p>
          <h2 className="text-white font-bold text-xl">Start a Ride</h2>
          <p className="text-gray-400 text-sm mt-1">Who's riding today?</p>
        </div>
        <div className="px-6 pb-2 space-y-3">
          {[
            { m: 'group' as const, icon: '👥', label: 'Group Ride', sub: 'Share live location with your crew', accent: true },
            { m: 'solo'  as const, icon: '⚡', label: 'Solo Ride',  sub: 'Track your own stats and route',     accent: false },
          ].map(({ m, icon, label, sub, accent }) => (
            <button key={m} onClick={() => { setMode(m); setStep('style') }}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all border ${
                accent ? 'bg-accent/10 border-accent/30 hover:bg-accent/15' : 'bg-bg-card border-white/10 hover:border-white/20'
              }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accent ? 'bg-accent' : 'bg-bg-surface'}`}>{icon}</div>
              <div>
                <p className="text-white font-bold">{label}</p>
                <p className="text-gray-400 text-sm">{sub}</p>
              </div>
              <span className="ml-auto text-gray-500">›</span>
            </button>
          ))}
        </div>
        <button onClick={onDismiss} className="w-full text-gray-500 text-sm py-4 pb-safe">Maybe later</button>
      </div>
    </div>
  )

  // ── Step 2: Style ─────────────────────────────────────────────────────────────
  if (step === 'style') return (
    <div className="fixed inset-0 z-30 bg-bg-primary/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up">
        <div className="px-6 pt-5 pb-2 flex items-center gap-3">
          <button onClick={() => setStep('mode')} className="text-gray-400 text-lg">←</button>
          <div>
            <h2 className="text-white font-bold text-lg">How do you want to ride?</h2>
            <p className="text-gray-500 text-xs">{mode === 'group' ? '👥 Group Ride' : '⚡ Solo Ride'}</p>
          </div>
        </div>
        <div className="px-6 pb-2 space-y-3">
          <button onClick={() => { setStyle('routed'); setStep('route') }}
            className="w-full flex items-center gap-4 bg-bg-card border border-white/10 rounded-2xl p-4 text-left hover:border-accent/40 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-accent/20 transition-all">🗺️</div>
            <div className="flex-1">
              <p className="text-white font-bold">Routed Tour</p>
              <p className="text-gray-400 text-sm mt-0.5">Plan your route with destinations and waypoints</p>
              <p className="text-accent text-xs mt-1 font-medium">Turn-by-turn guidance · Stop tracking</p>
            </div>
          </button>
          <button onClick={() => { setStyle('wind'); setStep('caution') }}
            className="w-full flex items-center gap-4 bg-bg-card border border-white/10 rounded-2xl p-4 text-left hover:border-white/25 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-white/10 transition-all">💨</div>
            <div className="flex-1">
              <p className="text-white font-bold">Just Feeling the Wind</p>
              <p className="text-gray-400 text-sm mt-0.5">Ride free — no destination, just open road</p>
              <p className="text-gray-500 text-xs mt-1">Stats tracking · No navigation</p>
            </div>
          </button>
        </div>
        <div className="h-6 pb-safe" />
      </div>
    </div>
  )

  // ── Step 3: Route Builder ─────────────────────────────────────────────────────
  if (step === 'route') return (
    <div className="fixed inset-0 z-30 bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-white/5 bg-bg-primary flex-shrink-0">
        <button onClick={() => setStep('style')} className="text-gray-400 text-xl w-8">←</button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">Plan Your Route</h2>
          <p className="text-gray-500 text-xs">{dests.length === 0 ? 'Add at least one destination' : `${dests.length} stop${dests.length > 1 ? 's' : ''} added`}</p>
        </div>
        {dests.length > 0 && (
          <button onClick={() => setStep('caution')}
            className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-all">
            Next →
          </button>
        )}
      </div>

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Start indicator */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-moto-green/20 border-2 border-moto-green flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-moto-green" />
          </div>
          <div className="flex-1 py-2 px-3 bg-moto-green/10 border border-moto-green/20 rounded-xl">
            <p className="text-moto-green text-sm font-semibold">Your current location</p>
            <p className="text-gray-500 text-xs">Starting point</p>
          </div>
        </div>

        {/* Connector line */}
        {dests.length > 0 && <div className="ml-4 w-px h-3 bg-white/15 mb-0" />}

        {/* Destination items */}
        <div className="space-y-0">
          {dests.map((dest, i) => (
            <div key={dest.id}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center flex-shrink-0 text-accent text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 py-2 px-3 bg-bg-card border border-white/8 rounded-xl flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <p className="text-white text-sm font-medium flex-1">{dest.name}</p>
                  <div className="flex gap-1">
                    {i > 0 && (
                      <button onClick={() => moveDest(i, -1)} className="w-6 h-6 rounded-lg bg-white/8 text-gray-400 text-xs flex items-center justify-center">↑</button>
                    )}
                    {i < dests.length - 1 && (
                      <button onClick={() => moveDest(i, 1)} className="w-6 h-6 rounded-lg bg-white/8 text-gray-400 text-xs flex items-center justify-center">↓</button>
                    )}
                    <button onClick={() => setDests(prev => prev.filter(d => d.id !== dest.id))}
                      className="w-6 h-6 rounded-lg bg-moto-red/10 text-moto-red text-xs flex items-center justify-center">✕</button>
                  </div>
                </div>
              </div>
              {i < dests.length - 1 && <div className="ml-4 w-px h-3 bg-white/15 my-0" />}
            </div>
          ))}
        </div>

        {dests.length === 0 && (
          <div className="mt-6 text-center py-8">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-white font-semibold">No stops yet</p>
            <p className="text-gray-500 text-sm mt-1">Add destinations below to plan your tour</p>
          </div>
        )}
      </div>

      {/* Add destination input */}
      <div className="px-4 pb-safe pb-6 pt-3 border-t border-white/5 bg-bg-primary flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={destInput}
            onChange={e => setDestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addDest()}
            placeholder="e.g. Kintamani, Tanah Lot, Seminyak..."
            className="flex-1 bg-bg-card border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent/60"
            autoFocus
          />
          <button onClick={addDest}
            className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white text-xl font-bold active:scale-95 transition-all flex-shrink-0">
            +
          </button>
        </div>
      </div>
    </div>
  )

  // ── Step 4: Caution ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-30 bg-bg-primary/90 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-bg-secondary rounded-t-3xl w-full max-w-lg animate-slide-up">
        <div className="px-6 pt-7 pb-2 text-center">
          <div className="w-16 h-16 bg-accent-amber/15 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🛡️</div>
          <h2 className="text-white font-bold text-xl">Ride Safe</h2>
          <p className="text-gray-400 text-sm mt-1">A quick reminder before you head out</p>
        </div>
        <div className="px-6 pb-4 space-y-2.5">
          {[
            { icon: '⛑️', text: 'Always wear your helmet and riding gear' },
            { icon: '🚦', text: 'Obey traffic signals and local road rules' },
            { icon: '📱', text: 'No phone use while riding — stay focused' },
            { icon: '💡', text: 'Keep your lights on and stay visible' },
            { icon: '⛽', text: 'Check your fuel and tyre pressure before long tours' },
          ].map(r => (
            <div key={r.icon} className="flex items-center gap-3 bg-bg-card rounded-xl px-4 py-2.5 border border-white/5">
              <span className="text-lg flex-shrink-0">{r.icon}</span>
              <p className="text-gray-300 text-sm">{r.text}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-safe pb-6">
          <button
            onClick={() => onStart(mode, style, dests)}
            className="w-full bg-moto-green text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-moto-green/20"
          >
            <span className="text-xl">🏍️</span>
            I'm Ready — Start Riding
          </button>
          <button onClick={() => setStep(style === 'routed' && dests.length > 0 ? 'route' : 'style')}
            className="w-full text-gray-500 text-sm mt-3 py-2">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Install / Add-to-Home-Screen banner ───────────────────────────────────────

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
  const isStandalone = ('standalone' in navigator && (navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches
  const isDismissed = () => {
    const ts = localStorage.getItem('install-dismissed')
    if (!ts) return false
    return Date.now() - Number(ts) < 14 * 24 * 60 * 60 * 1000 // 14 days
  }

  useEffect(() => {
    if (isStandalone || isDismissed()) return

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    // Show after a short delay so user can orient themselves first
    timerRef.current = setTimeout(() => setVisible(true), 6000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('install-dismissed', String(Date.now()))
    setVisible(false)
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (isStandalone || !visible) return null

  // Android / Desktop Chrome — use native install prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-40 animate-slide-up">
        <div className="bg-bg-secondary border border-accent/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏍️</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Install MotoTrack</p>
            <p className="text-gray-400 text-xs mt-0.5">Add to home screen for the best experience</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={dismiss} className="text-gray-500 text-xs px-3 py-2 rounded-xl bg-white/5">Not now</button>
            <button onClick={installAndroid} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl">Install</button>
          </div>
        </div>
      </div>
    )
  }

  // iOS Safari — manual instruction banner
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-40 animate-slide-up">
        <div className="bg-bg-secondary border border-white/15 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-base flex-shrink-0">🏍️</div>
              <div>
                <p className="text-white font-bold text-sm">Add to Home Screen</p>
                <p className="text-gray-500 text-xs">Install MotoTrack for faster access</p>
              </div>
            </div>
            <button onClick={dismiss} className="text-gray-500 text-lg leading-none ml-2">✕</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
              <span className="text-lg flex-shrink-0">⬆️</span>
              <p className="text-gray-300 text-xs">Tap the <strong className="text-white">Share</strong> button at the bottom of Safari</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
              <span className="text-lg flex-shrink-0">➕</span>
              <p className="text-gray-300 text-xs">Tap <strong className="text-white">Add to Home Screen</strong> then <strong className="text-white">Add</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function ActiveRideBadge({ mode, onEnd }: { mode: RideMode; onEnd: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-moto-green/20 rounded-full px-3 py-1 border border-moto-green/30">
      <span className="w-1.5 h-1.5 bg-moto-green rounded-full animate-pulse" />
      <span className="text-moto-green text-xs font-semibold">{mode === 'group' ? 'Group Ride' : 'Solo'}</span>
      <button onClick={onEnd} className="text-moto-green/60 text-xs hover:text-moto-red">✕</button>
    </div>
  )
}

export default function App() {
  const user = useStore(s => s.user)
  const activeTab = useStore(s => s.activeTab)
  const setActiveTab = useStore(s => s.setActiveTab)
  const loadUserData = useStore(s => s.loadUserData)
  const startLocationBroadcast = useStore(s => s.startLocationBroadcast)
  const stopLocationBroadcast = useStore(s => s.stopLocationBroadcast)
  const activeConversationId = useStore(s => s.activeConversationId)
  const setupCompletedForUserId = useStore(s => s.setupCompletedForUserId)
  const [rideMode, setRideMode] = useState<RideMode>('idle')
  const [rideStyle, setRideStyle] = useState<RideStyle>('wind')
  const [rideDestinations, setRideDestinations] = useState<LaunchDest[]>([])
  const [showLauncher, setShowLauncher] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Handle Supabase OAuth redirect (Google sign-in)
  useEffect(() => {
    if (!isSupabaseReady) return
    supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
        const sbUser = session.user
        const [profile, adminProfile] = await Promise.all([
          dbGetProfile(sbUser.id),
          dbGetAdminProfile(sbUser.id).catch(() => ({ isAdmin: false, badges: [] })),
        ])
        useStore.setState({
          user: {
            id: sbUser.id,
            name: profile?.name ?? sbUser.user_metadata?.full_name ?? sbUser.email!.split('@')[0],
            email: sbUser.email!,
            avatar: profile?.avatar ?? '🤙',
            provider: sbUser.app_metadata?.provider === 'google' ? 'google' : 'email',
            badges: (profile?.badges ?? adminProfile.badges) as BadgeType[],
            ...(adminProfile.isAdmin ? { isAdmin: true } : {}),
          },
          // If they have a saved profile name, they completed onboarding — restore on any device
          ...(profile?.name ? { setupCompletedForUserId: sbUser.id } : {}),
        })
        await loadUserData(sbUser.id)
      }
    })
  }, [])

  // Start broadcasting location when logged in
  useEffect(() => {
    if (user && isSupabaseReady) startLocationBroadcast()
    return () => { if (isSupabaseReady) stopLocationBroadcast() }
  }, [user?.id])

  // Real-time hooks
  useRealtimeRiders()
  useRealtimeMessages(activeConversationId)

  if (!user) return <AuthScreen />
  if (setupCompletedForUserId !== user.id) return <OnboardingScreen />

  const handleStartRide = (mode: RideMode, style: RideStyle = 'wind', dests: LaunchDest[] = []) => {
    setRideMode(mode)
    setRideStyle(style)
    setRideDestinations(dests)
    setShowLauncher(false)
    if (mode !== 'idle') setActiveTab('map')
  }

  return (
    <div className="flex flex-col h-screen h-dvh bg-bg-primary overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-bg-primary/95 backdrop-blur-sm border-b border-white/5 px-4 pt-safe flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight"><span className="text-white">Moto</span><span className="text-accent">Track</span></span>
        </div>

        <div className="flex items-center gap-2">
          {rideMode !== 'idle' ? (
            <ActiveRideBadge mode={rideMode} onEnd={() => setRideMode('idle')} />
          ) : (
            <button
              onClick={() => setShowLauncher(true)}
              className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
            >
              ▶ Start Ride
            </button>
          )}

          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm overflow-hidden border border-white/10 hover:border-accent/50 transition-colors"
          >
            {user.avatar?.startsWith('http') || user.avatar?.startsWith('data:')
              ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : user.avatar}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'map'     && <RideMap rideMode={rideMode} rideStyle={rideStyle} userDestinations={rideDestinations.map(d => d.name)} onStartRide={() => setShowLauncher(true)} onPauseRide={() => setRideMode('paused')} onResumeRide={() => setRideMode('solo')} onEndRide={() => { setRideMode('idle'); setRideStyle('wind'); setRideDestinations([]) }} />}
        {activeTab === 'chat'    && <div className="h-full overflow-hidden"><ChatPanel /></div>}
        {activeTab === 'explore' && <div className="h-full overflow-hidden"><ExplorePanel /></div>}
        {activeTab === 'garage'  && <div className="h-full overflow-hidden"><GaragePanel /></div>}
        {activeTab === 'weather' && <div className="h-full overflow-hidden"><WeatherPanel /></div>}
      </main>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Ride launcher overlay */}
      {showLauncher && (
        <RideLauncher
          onStart={(mode, style, dests) => handleStartRide(mode, style, dests)}
          onDismiss={() => setShowLauncher(false)}
        />
      )}

      {/* Profile sheet */}
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

      {/* Floating music player */}
      <MusicPlayer />

      {/* Install / Add-to-Home-Screen prompt */}
      <InstallBanner />

      {/* Global toast */}
      <Toast />
    </div>
  )
}

function Toast() {
  const toast = useStore(s => s.toast)
  const dismiss = useStore(s => s.dismissToast)
  if (!toast) return null
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-bg-secondary border border-white/10 text-white rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-sm animate-slide-up whitespace-nowrap">
      <span className="text-sm font-semibold">✓ {toast}</span>
      <button onClick={dismiss} className="text-gray-400 text-xs font-medium hover:text-white transition-colors ml-1">
        Dismiss
      </button>
    </div>
  )
}
