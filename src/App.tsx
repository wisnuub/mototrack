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

function RideLauncher({ onStart }: { onStart: (mode: RideMode) => void }) {
  return (
    <div className="fixed inset-0 z-20 bg-bg-primary/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-bg-secondary rounded-t-3xl w-full max-w-lg p-6 animate-slide-up pb-safe">
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🏍️</p>
          <h2 className="text-white font-bold text-xl">Start a Ride</h2>
          <p className="text-gray-400 text-sm mt-1">Choose how you want to ride today</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onStart('group')}
            className="w-full flex items-center gap-4 bg-accent/10 border border-accent/30 rounded-2xl p-4 text-left hover:bg-accent/15 transition-all"
          >
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              👥
            </div>
            <div>
              <p className="text-white font-bold">Group Ride</p>
              <p className="text-gray-400 text-sm">Ride with your crew. Share live location with your group.</p>
            </div>
          </button>

          <button
            onClick={() => onStart('solo')}
            className="w-full flex items-center gap-4 bg-bg-card border border-white/10 rounded-2xl p-4 text-left hover:border-white/20 transition-all"
          >
            <div className="w-12 h-12 bg-bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              ⚡
            </div>
            <div>
              <p className="text-white font-bold">Solo Ride</p>
              <p className="text-gray-400 text-sm">Ride alone. Track your stats, route, and ride time.</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => onStart('idle')}
          className="w-full text-gray-500 text-sm mt-4 py-2"
        >
          Maybe later
        </button>
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

  const handleStartRide = (mode: RideMode) => {
    setRideMode(mode)
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
        {activeTab === 'map'     && <RideMap rideMode={rideMode} onStartRide={() => setRideMode('solo')} onPauseRide={() => setRideMode('paused')} onResumeRide={() => setRideMode('solo')} onEndRide={() => setRideMode('idle')} />}
        {activeTab === 'chat'    && <div className="h-full overflow-hidden"><ChatPanel /></div>}
        {activeTab === 'explore' && <div className="h-full overflow-hidden"><ExplorePanel /></div>}
        {activeTab === 'garage'  && <div className="h-full overflow-hidden"><GaragePanel /></div>}
        {activeTab === 'weather' && <div className="h-full overflow-hidden"><WeatherPanel /></div>}
      </main>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Ride launcher overlay */}
      {showLauncher && <RideLauncher onStart={handleStartRide} />}

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
