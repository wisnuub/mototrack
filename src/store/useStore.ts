import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Rider, Group, Bike, MaintenanceRecord, WeatherData, TabId, TripTemplate, ChatMessage, Conversation, VoiceChannelParticipant, MusicTrack, BikeModification, ModCategory, ActivityPost, ActivityType, BadgeType, RideSession, RideWaypoint, MotoEvent, ShopProduct, EventInteraction } from '../types'
import {
  MOCK_RIDERS, MOCK_GROUPS, MOCK_BIKES, MOCK_MAINTENANCE, MOCK_TRIP_TEMPLATES,
  MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_EVENTS, MOCK_PRODUCTS,
} from '../data/mockData'
import { isSupabaseReady } from '../lib/supabase'
import {
  dbSignIn, dbSignUp, dbSignInWithGoogle, dbSignOut, dbGetProfile, dbUpdateProfile,
  dbGetBikes, dbInsertBike, dbGetMaintenance, dbInsertMaintenance, dbUpdateOdometer,
  dbGetModifications, dbInsertModification, dbDeleteModification,
  dbGetConversations, dbGetMessages, dbSendMessage, dbMarkRead, dbToggleReaction,
  dbUpsertRider, dbUpdateLocation, dbSetRiderOffline,
  dbGetActivityPosts, dbInsertActivityPost, dbDeleteActivityPost, dbTogglePostLike,
  dbGetRideSessions, dbInsertRideSession,
} from '../lib/db'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  provider: 'email' | 'google'
  location?: string
  badges?: BadgeType[]
}

let locationInterval: ReturnType<typeof setInterval> | null = null

interface AppState {
  // Auth
  user: AuthUser | null
  isAuthLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
  loadUserData: (userId: string) => Promise<void>
  startLocationBroadcast: () => void
  stopLocationBroadcast: () => void
  setupCompletedForUserId: string | null
  completeSetup: (name: string, avatar: string, location: string, firstBike?: Omit<Bike, 'id'>) => Promise<void>

  // Navigation
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Riders / real-time tracking
  riders: Rider[]
  updateRiderPosition: (riderId: string, lat: number, lng: number, speed: number) => void

  // Groups
  groups: Group[]
  activeGroupId: string | null
  setActiveGroup: (groupId: string | null) => void
  createGroup: (name: string, emoji: string, description: string) => void
  deleteGroup: (groupId: string) => void
  setDestination: (groupId: string, lat: number, lng: number, name: string) => void

  // Bikes & Maintenance
  bikes: Bike[]
  maintenance: MaintenanceRecord[]
  mods: BikeModification[]
  activeBikeId: string | null
  addBike: (bike: Omit<Bike, 'id'>) => Promise<void>
  updateBike: (bikeId: string, updates: Partial<Bike>) => void
  deleteBike: (bikeId: string) => void
  setActiveBike: (bikeId: string) => void
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => Promise<void>
  updateOdometer: (bikeId: string, km: number) => Promise<void>
  addMod: (bikeId: string, mod: Omit<BikeModification, 'id' | 'bikeId' | 'createdAt'>) => Promise<void>
  removeMod: (id: string) => Promise<void>

  // Activity / Posts
  activityPosts: ActivityPost[]
  addActivityPost: (post: Omit<ActivityPost, 'id' | 'userId' | 'userName' | 'userAvatar' | 'badges' | 'createdAt' | 'likes' | 'likedBy'>) => Promise<void>
  deleteActivityPost: (id: string) => Promise<void>
  togglePostLike: (postId: string) => void

  // Ride Sessions
  rideSessions: RideSession[]
  activeRideSession: RideSession | null
  startRideSession: () => void
  stopRideSession: () => void
  recordRideWaypoint: (lat: number, lng: number, speed: number, heading: number, leanAngle?: number) => void

  // Explore
  tripTemplates: TripTemplate[]
  likeTrip: (tripId: string) => void
  saveTrip: (tripId: string) => void
  savedTripIds: string[]

  // Events & Shop
  events: MotoEvent[]
  products: ShopProduct[]
  eventInteractions: EventInteraction[]
  toggleEventInterest: (eventId: string) => void
  markEventAttending: (eventId: string) => void

  // Weather
  weather: WeatherData | null
  weatherLoading: boolean
  fetchWeather: (lat: number, lng: number) => Promise<void>

  // Tracking
  isTracking: boolean
  setTracking: (on: boolean) => void

  // Chat
  conversations: Conversation[]
  messages: ChatMessage[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => Promise<void>
  sendMessage: (convId: string, content: string, type?: ChatMessage['type'], extra?: Partial<ChatMessage>) => Promise<void>
  markRead: (convId: string) => void
  addReaction: (messageId: string, emoji: string, userId: string) => void

  // Voice channel
  voiceConvId: string | null
  voiceParticipants: VoiceChannelParticipant[]
  joinVoice: (convId: string) => void
  leaveVoice: () => void
  setVoiceSpeaking: (riderId: string, isSpeaking: boolean) => void
  setVoiceMuted: (riderId: string, isMuted: boolean) => void

  // Music
  musicQueue: MusicTrack[]
  musicIndex: number
  isMusicPlaying: boolean
  musicVolume: number
  musicConvId: string | null
  musicLoop: boolean
  isListeningAlong: boolean
  playTrack: (track: MusicTrack, convId: string) => void
  queueTrack: (track: MusicTrack) => void
  removeFromQueue: (index: number) => void
  skipTrack: () => void
  prevTrack: () => void
  pauseMusic: () => void
  resumeMusic: () => void
  stopMusic: () => void
  setMusicVolume: (v: number) => void
  toggleLoop: () => void
  setListeningAlong: (on: boolean) => void
}

let nextId = 100

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm',
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthLoading: false,

      signIn: async (email, password) => {
        set({ isAuthLoading: true })
        try {
          if (isSupabaseReady) {
            const sbUser = await dbSignIn(email, password)
            const profile = await dbGetProfile(sbUser.id)
            const user: AuthUser = {
              id: sbUser.id,
              name: profile?.name ?? email.split('@')[0],
              email: sbUser.email!,
              avatar: profile?.avatar ?? '🤙',
              provider: 'email',
            }
            set({ user, isAuthLoading: false })
            await get().loadUserData(sbUser.id)
          } else {
            // Mock fallback (no Supabase configured)
            await new Promise(r => setTimeout(r, 800))
            set({
              user: {
                id: 'rider-1',
                name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                email, avatar: '🤙', provider: 'email',
              },
              isAuthLoading: false,
            })
          }
        } catch (e) {
          set({ isAuthLoading: false })
          throw e
        }
      },

      signInWithGoogle: async () => {
        set({ isAuthLoading: true })
        try {
          if (isSupabaseReady) {
            await dbSignInWithGoogle()
            // Page redirects to Supabase OAuth — session handled in App.tsx on return
            set({ isAuthLoading: false })
          } else {
            await new Promise(r => setTimeout(r, 1000))
            set({
              user: { id: 'rider-1', name: 'Rider', email: 'rider@gmail.com', avatar: '🤙', provider: 'google' },
              isAuthLoading: false,
            })
          }
        } catch (e) {
          set({ isAuthLoading: false })
          throw e
        }
      },

      signUp: async (name, email, password) => {
        set({ isAuthLoading: true })
        try {
          if (isSupabaseReady) {
            const sbUser = await dbSignUp(name, email, password)
            set({
              user: { id: sbUser.id, name, email: sbUser.email!, avatar: '🤙', provider: 'email' },
              isAuthLoading: false,
            })
          } else {
            await new Promise(r => setTimeout(r, 1000))
            set({
              user: { id: 'rider-1', name, email, avatar: '🤙', provider: 'email' },
              isAuthLoading: false,
            })
          }
        } catch (e) {
          set({ isAuthLoading: false })
          throw e
        }
      },

      signOut: async () => {
        if (locationInterval) { clearInterval(locationInterval); locationInterval = null }
        if (isSupabaseReady) {
          const user = get().user
          if (user) await dbSetRiderOffline(`rider-${user.id.slice(0, 8)}`)
          await dbSignOut()
        }
        set({
          user: null,
          bikes: isSupabaseReady ? [] : MOCK_BIKES,
          maintenance: isSupabaseReady ? [] : MOCK_MAINTENANCE,
          mods: [],
          conversations: isSupabaseReady ? [] : MOCK_CONVERSATIONS,
          messages: isSupabaseReady ? [] : MOCK_MESSAGES,
          riders: isSupabaseReady ? [] : MOCK_RIDERS,
          activityPosts: [],
          rideSessions: [],
          activeRideSession: null,
        })
      },

      setupCompletedForUserId: null,

      completeSetup: async (name, avatar, location, firstBike) => {
        const user = get().user
        if (!user) return
        // Mark setup complete immediately so the user is never stuck
        set(state => ({ user: { ...state.user!, name, avatar, location }, setupCompletedForUserId: user.id }))
        // Background Supabase sync — failures are non-blocking
        try {
          if (isSupabaseReady) await dbUpdateProfile(user.id, name, avatar, location)
          if (firstBike) await get().addBike(firstBike)
          await get().loadUserData(user.id)
        } catch (e) {
          console.warn('Setup sync error (non-fatal):', e)
        }
      },

      loadUserData: async (userId: string) => {
        if (!isSupabaseReady) return
        try {
          const [bikes, convs, activityPosts, rideSessions] = await Promise.all([
            dbGetBikes(userId),
            dbGetConversations(userId),
            dbGetActivityPosts(userId),
            dbGetRideSessions(userId),
          ])
          const bikeIds = bikes.map(b => b.id)
          const [maintenance, mods] = bikeIds.length
            ? await Promise.all([dbGetMaintenance(bikeIds), dbGetModifications(bikeIds)])
            : [[], []]
          set({ bikes, maintenance, mods, conversations: convs, activityPosts, rideSessions })

          // Upsert this user's rider row
          const user = get().user
          if (user) {
            const riderId = `rider-${user.id.slice(0, 8)}`
            await dbUpsertRider(userId, riderId, user.name, user.avatar, '#ff6b35')
          }
        } catch (e) {
          console.warn('loadUserData failed, using mock data', e)
        }
      },

      // Navigation
      activeTab: 'map',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Riders
      riders: isSupabaseReady ? [] : MOCK_RIDERS,
      updateRiderPosition: (riderId, lat, lng, speed) => {
        set(state => ({
          riders: state.riders.map(r =>
            r.id === riderId ? { ...r, position: { lat, lng }, speed, lastSeen: new Date() } : r
          )
        }))
      },

      // Groups
      groups: MOCK_GROUPS,
      activeGroupId: 'group-1',
      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      createGroup: (name, emoji, description) => {
        const newGroup = {
          id: `group-${nextId++}`,
          name, emoji, description,
          members: ['rider-1'],
          ownerId: 'rider-1',
          isActive: true,
          createdAt: new Date(),
        }
        set(state => ({ groups: [...state.groups, newGroup] }))
      },

      deleteGroup: (groupId) => {
        set(state => ({ groups: state.groups.filter(g => g.id !== groupId) }))
      },

      setDestination: (groupId, lat, lng, name) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId
              ? { ...g, destination: { lat, lng }, destinationName: name }
              : g
          )
        }))
      },

      // Bikes
      bikes: isSupabaseReady ? [] : MOCK_BIKES,
      maintenance: isSupabaseReady ? [] : MOCK_MAINTENANCE,
      mods: [],
      activeBikeId: 'bike-1',

      addMaintenanceRecord: async (record) => {
        if (isSupabaseReady) {
          try {
            const row = await dbInsertMaintenance(record)
            const newRecord: MaintenanceRecord = { ...record, id: row.id, date: new Date(record.date) }
            set(state => ({ maintenance: [...state.maintenance, newRecord] }))
            return
          } catch (e) { console.warn('dbInsertMaintenance failed', e) }
        }
        const newRecord = { ...record, id: `maint-${nextId++}`, date: new Date(record.date) }
        set(state => ({ maintenance: [...state.maintenance, newRecord] }))
      },

      addBike: async (bikeData) => {
        if (isSupabaseReady) {
          const userId = get().user?.id
          if (userId) {
            try {
              const newBike = await dbInsertBike(userId, bikeData)
              set(state => ({
                bikes: [...state.bikes, newBike],
                activeBikeId: bikeData.isFavorite ? newBike.id : state.activeBikeId,
              }))
              return
            } catch (e) { console.warn('dbInsertBike failed', e) }
          }
        }
        const newBike: Bike = { ...bikeData, id: `bike-${nextId++}` }
        set(state => ({
          bikes: [...state.bikes, newBike],
          activeBikeId: bikeData.isFavorite ? newBike.id : state.activeBikeId,
        }))
      },

      updateBike: (bikeId, updates) => {
        set(state => ({
          bikes: state.bikes.map(b => b.id === bikeId ? { ...b, ...updates } : b)
        }))
      },

      deleteBike: (bikeId) => {
        set(state => {
          const remaining = state.bikes.filter(b => b.id !== bikeId)
          return {
            bikes: remaining,
            activeBikeId: state.activeBikeId === bikeId ? (remaining[0]?.id ?? null) : state.activeBikeId,
          }
        })
      },

      setActiveBike: (bikeId) => set({ activeBikeId: bikeId }),

      addMod: async (bikeId, mod) => {
        const tempMod: BikeModification = {
          ...mod, id: `mod-${nextId++}`, bikeId, createdAt: new Date(),
        }
        set(state => ({ mods: [...state.mods, tempMod] }))
        if (isSupabaseReady) {
          try {
            const saved = await dbInsertModification(bikeId, mod)
            set(state => ({ mods: state.mods.map(m => m.id === tempMod.id ? saved : m) }))
          } catch (e) { console.warn('dbInsertModification failed', e) }
        }
      },

      removeMod: async (id) => {
        set(state => ({ mods: state.mods.filter(m => m.id !== id) }))
        if (isSupabaseReady) dbDeleteModification(id).catch(() => {})
      },

      // Activity Posts
      activityPosts: [],

      addActivityPost: async (postData) => {
        const user = get().user
        const tempPost: ActivityPost = {
          ...postData,
          id: `post-${nextId++}`,
          userId: user?.id ?? 'local',
          userName: user?.name ?? 'Rider',
          userAvatar: user?.avatar ?? '🤙',
          badges: user?.badges ?? [],
          createdAt: new Date(),
          likes: 0,
          likedBy: [],
        }
        set(state => ({ activityPosts: [tempPost, ...state.activityPosts] }))
        if (isSupabaseReady && user) {
          try {
            const saved = await dbInsertActivityPost(user.id, user.name, user.avatar, user.badges ?? [], postData)
            set(state => ({ activityPosts: state.activityPosts.map(p => p.id === tempPost.id ? saved : p) }))
          } catch (e) { console.warn('dbInsertActivityPost failed', e) }
        }
      },

      deleteActivityPost: async (id) => {
        set(state => ({ activityPosts: state.activityPosts.filter(p => p.id !== id) }))
        if (isSupabaseReady) dbDeleteActivityPost(id).catch(() => {})
      },

      togglePostLike: (postId) => {
        const userId = get().user?.id ?? 'local'
        set(state => ({
          activityPosts: state.activityPosts.map(p => {
            if (p.id !== postId) return p
            const liked = p.likedBy.includes(userId)
            return {
              ...p,
              likes: liked ? p.likes - 1 : p.likes + 1,
              likedBy: liked ? p.likedBy.filter(id => id !== userId) : [...p.likedBy, userId],
            }
          }),
        }))
        if (isSupabaseReady) dbTogglePostLike(postId, userId).catch(() => {})
      },

      // Ride Sessions
      rideSessions: [],
      activeRideSession: null,

      startRideSession: () => {
        const user = get().user
        const bikes = get().bikes
        const activeBikeId = get().activeBikeId
        const bike = bikes.find(b => b.id === activeBikeId)
        const session: RideSession = {
          id: `ride-${nextId++}`,
          userId: user?.id ?? 'local',
          bikeId: bike?.id,
          bikeName: bike ? `${bike.year} ${bike.brand} ${bike.model}` : undefined,
          startTime: new Date(),
          distanceKm: 0,
          maxSpeedKmh: 0,
          avgSpeedKmh: 0,
          route: [],
          isActive: true,
        }
        set({ activeRideSession: session })
      },

      stopRideSession: () => {
        const session = get().activeRideSession
        if (!session) return
        const endTime = new Date()
        const durationMs = endTime.getTime() - session.startTime.getTime()
        const totalSpeedReadings = session.route.filter(w => w.speed > 0)
        const avgSpeed = totalSpeedReadings.length
          ? totalSpeedReadings.reduce((sum, w) => sum + w.speed, 0) / totalSpeedReadings.length
          : 0
        const finished: RideSession = { ...session, endTime, durationMs, avgSpeedKmh: Math.round(avgSpeed), isActive: false }
        set(state => ({
          activeRideSession: null,
          rideSessions: [finished, ...state.rideSessions],
        }))
        const userId = get().user?.id
        if (isSupabaseReady && userId) {
          dbInsertRideSession(userId, finished).catch(() => {})
        }
      },

      recordRideWaypoint: (lat, lng, speed, heading, leanAngle) => {
        set(state => {
          const session = state.activeRideSession
          if (!session) return state
          const lastWp = session.route[session.route.length - 1]
          let addedKm = 0
          if (lastWp) {
            const R = 6371
            const dLat = (lat - lastWp.lat) * Math.PI / 180
            const dLng = (lng - lastWp.lng) * Math.PI / 180
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lastWp.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
            addedKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          }
          const waypoint: RideWaypoint = { lat, lng, timestamp: Date.now(), speed, heading }
          return {
            activeRideSession: {
              ...session,
              route: [...session.route, waypoint],
              distanceKm: session.distanceKm + addedKm,
              maxSpeedKmh: Math.max(session.maxSpeedKmh, speed),
              maxLeanAngle: leanAngle !== undefined ? Math.max(session.maxLeanAngle ?? 0, Math.abs(leanAngle)) : session.maxLeanAngle,
            },
          }
        })
      },

      updateOdometer: async (bikeId, km) => {
        if (isSupabaseReady) dbUpdateOdometer(bikeId, km).catch(() => {})
        set(state => ({
          bikes: state.bikes.map(b => b.id === bikeId ? { ...b, odometer: km } : b)
        }))
      },

      startLocationBroadcast: () => {
        if (!isSupabaseReady || locationInterval) return
        const user = get().user
        if (!user) return
        const riderId = `rider-${user.id.slice(0, 8)}`

        locationInterval = setInterval(() => {
          if (!navigator.geolocation) return
          navigator.geolocation.getCurrentPosition(pos => {
            const { latitude: lat, longitude: lng, speed, heading } = pos.coords
            const speedKmh = Math.round((speed ?? 0) * 3.6)
            dbUpdateLocation(riderId, lat, lng, speedKmh, heading ?? 0).catch(() => {})
            get().updateRiderPosition(riderId, lat, lng, speedKmh)
            if (get().activeRideSession) {
              get().recordRideWaypoint(lat, lng, speedKmh, heading ?? 0)
            }
          }, undefined, { enableHighAccuracy: true, maximumAge: 3000 })
        }, 4000)
      },

      stopLocationBroadcast: () => {
        if (locationInterval) { clearInterval(locationInterval); locationInterval = null }
        const user = get().user
        if (user && isSupabaseReady) {
          dbSetRiderOffline(`rider-${user.id.slice(0, 8)}`).catch(() => {})
        }
      },

      // Explore
      tripTemplates: MOCK_TRIP_TEMPLATES,
      savedTripIds: [],

      // Events & Shop
      events: MOCK_EVENTS,
      products: MOCK_PRODUCTS,
      eventInteractions: [],

      toggleEventInterest: (eventId) => {
        set(state => {
          const existing = state.eventInteractions.find(i => i.eventId === eventId && i.type === 'interested')
          const isAdding = !existing
          return {
            eventInteractions: existing
              ? state.eventInteractions.filter(i => !(i.eventId === eventId && i.type === 'interested'))
              : [...state.eventInteractions, { eventId, type: 'interested' }],
            events: state.events.map(e =>
              e.id === eventId ? { ...e, interestedCount: e.interestedCount + (isAdding ? 1 : -1) } : e
            ),
          }
        })
      },

      markEventAttending: (eventId) => {
        set(state => {
          const already = state.eventInteractions.find(i => i.eventId === eventId && i.type === 'attending')
          if (already) return state
          return {
            eventInteractions: [...state.eventInteractions, { eventId, type: 'attending' }],
            events: state.events.map(e =>
              e.id === eventId ? { ...e, attendingCount: e.attendingCount + 1 } : e
            ),
          }
        })
      },

      likeTrip: (tripId) => {
        set(state => ({
          tripTemplates: state.tripTemplates.map(t =>
            t.id === tripId ? { ...t, likes: t.likes + 1 } : t
          )
        }))
      },
      saveTrip: (tripId) => {
        set(state => {
          const already = state.savedTripIds.includes(tripId)
          return {
            savedTripIds: already
              ? state.savedTripIds.filter(id => id !== tripId)
              : [...state.savedTripIds, tripId],
            tripTemplates: state.tripTemplates.map(t =>
              t.id === tripId ? { ...t, saves: already ? t.saves - 1 : t.saves + 1 } : t
            )
          }
        })
      },

      // Weather
      weather: null,
      weatherLoading: false,

      fetchWeather: async (lat, lng) => {
        set({ weatherLoading: true })
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=1`
          const res = await fetch(url)
          const data = await res.json()
          const c = data.current
          const hourly: { hour: number; temp: number; precipProb: number; weatherCode: number }[] = []
          for (let i = 0; i < 12; i++) {
            hourly.push({
              hour: new Date(data.hourly.time[i]).getHours(),
              temp: Math.round(data.hourly.temperature_2m[i]),
              precipProb: data.hourly.precipitation_probability[i],
              weatherCode: data.hourly.weather_code[i],
            })
          }
          set({
            weather: {
              location: 'Bali, Indonesia',
              temperature: Math.round(c.temperature_2m),
              feelsLike: Math.round(c.apparent_temperature),
              humidity: c.relative_humidity_2m,
              windSpeed: Math.round(c.wind_speed_10m),
              weatherCode: c.weather_code,
              description: WEATHER_CODE_DESCRIPTIONS[c.weather_code] ?? 'Unknown',
              uvIndex: c.uv_index ?? 0,
              hourly,
              fetchedAt: new Date(),
            },
            weatherLoading: false,
          })
        } catch {
          set({ weatherLoading: false })
        }
      },

      // Tracking
      isTracking: false,
      setTracking: (on) => set({ isTracking: on }),

      // Chat
      conversations: isSupabaseReady ? [] : MOCK_CONVERSATIONS,
      messages: isSupabaseReady ? [] : MOCK_MESSAGES,
      activeConversationId: null,

      setActiveConversation: async (id) => {
        set({ activeConversationId: id })
        if (!id) return
        get().markRead(id)
        // Load messages from Supabase when opening a conversation
        if (isSupabaseReady) {
          try {
            const msgs = await dbGetMessages(id)
            if (msgs.length) {
              set(state => ({
                messages: [
                  ...state.messages.filter(m => m.conversationId !== id),
                  ...msgs,
                ],
              }))
            }
          } catch {}
        }
      },

      sendMessage: async (convId, content, type = 'text', extra = {}) => {
        const user = get().user
        const tempId = `msg-${nextId++}`
        const newMsg: ChatMessage = {
          id: tempId,
          conversationId: convId,
          senderId: user?.id ?? 'rider-1',
          senderName: extra.senderName ?? user?.name ?? 'You',
          senderAvatar: extra.senderAvatar ?? user?.avatar ?? '🤙',
          content,
          type,
          timestamp: new Date(),
          reactions: [],
          ...extra,
        }
        // Optimistic update
        set(state => ({
          messages: [...state.messages, newMsg],
          conversations: state.conversations.map(c =>
            c.id === convId ? { ...c, lastMessage: newMsg } : c
          ),
        }))

        // Persist to Supabase
        if (isSupabaseReady && user) {
          try {
            const saved = await dbSendMessage(
              convId, user.id,
              newMsg.senderName, newMsg.senderAvatar,
              content, type, extra
            )
            // Replace temp message with real ID
            set(state => ({
              messages: state.messages.map(m => m.id === tempId ? saved : m),
            }))
          } catch (e) { console.warn('sendMessage failed', e) }
        }
      },

      markRead: (convId) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === convId ? { ...c, unreadCount: 0 } : c
          ),
        }))
        if (isSupabaseReady) {
          const userId = get().user?.id
          if (userId) dbMarkRead(convId, userId).catch(() => {})
        }
      },

      addReaction: (messageId, emoji, userId) => {
        if (isSupabaseReady) dbToggleReaction(messageId, userId, emoji).catch(() => {})
        set(state => ({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m
            const existing = m.reactions.find(r => r.emoji === emoji)
            if (existing) {
              return {
                ...m,
                reactions: m.reactions.map(r =>
                  r.emoji === emoji
                    ? r.userIds.includes(userId)
                      ? { ...r, userIds: r.userIds.filter(id => id !== userId) }
                      : { ...r, userIds: [...r.userIds, userId] }
                    : r
                ).filter(r => r.userIds.length > 0),
              }
            }
            return { ...m, reactions: [...m.reactions, { emoji, userIds: [userId] }] }
          }),
        }))
      },

      // Voice channel
      voiceConvId: null,
      voiceParticipants: [],

      joinVoice: (convId) => {
        const conv = get().conversations.find(c => c.id === convId)
        if (!conv) return
        const riders = get().riders
        const participants: VoiceChannelParticipant[] = conv.participantIds.slice(0, 4).map(id => {
          const rider = riders.find(r => r.id === id)
          return {
            riderId: id,
            name: rider?.name ?? id,
            avatar: rider?.avatar ?? '🤙',
            isMuted: false,
            isSpeaking: false,
          }
        })
        set({ voiceConvId: convId, voiceParticipants: participants })
      },

      leaveVoice: () => set({ voiceConvId: null, voiceParticipants: [] }),

      setVoiceSpeaking: (riderId, isSpeaking) => {
        set(state => ({
          voiceParticipants: state.voiceParticipants.map(p =>
            p.riderId === riderId ? { ...p, isSpeaking } : p
          ),
        }))
      },

      setVoiceMuted: (riderId, isMuted) => {
        set(state => ({
          voiceParticipants: state.voiceParticipants.map(p =>
            p.riderId === riderId ? { ...p, isMuted } : p
          ),
        }))
      },

      // Music
      musicQueue: [],
      musicIndex: 0,
      isMusicPlaying: false,
      musicVolume: 0.8,
      musicConvId: null,
      musicLoop: true,
      isListeningAlong: true,

      playTrack: (track, convId) => {
        set(state => {
          const existing = state.musicQueue.findIndex(t => t.id === track.id)
          if (existing >= 0) {
            return { musicIndex: existing, isMusicPlaying: true, musicConvId: convId }
          }
          return {
            musicQueue: [...state.musicQueue, track],
            musicIndex: state.musicQueue.length,
            isMusicPlaying: true,
            musicConvId: convId,
          }
        })
      },

      queueTrack: (track) => {
        set(state => ({ musicQueue: [...state.musicQueue, track] }))
      },

      skipTrack: () => {
        set(state => {
          const next = state.musicIndex + 1
          if (next >= state.musicQueue.length) {
            if (state.musicLoop) return { musicIndex: 0, isMusicPlaying: true }
            return { isMusicPlaying: false }
          }
          return { musicIndex: next, isMusicPlaying: true }
        })
      },

      prevTrack: () => {
        set(state => ({ musicIndex: Math.max(state.musicIndex - 1, 0), isMusicPlaying: true }))
      },

      removeFromQueue: (index) => {
        set(state => {
          const newQueue = state.musicQueue.filter((_, i) => i !== index)
          let newIndex = state.musicIndex
          if (index < state.musicIndex) newIndex = Math.max(0, state.musicIndex - 1)
          else if (index === state.musicIndex) newIndex = Math.min(newIndex, newQueue.length - 1)
          return {
            musicQueue: newQueue,
            musicIndex: Math.max(0, newIndex),
            isMusicPlaying: newQueue.length > 0 && state.isMusicPlaying,
          }
        })
      },

      pauseMusic: () => set({ isMusicPlaying: false }),
      resumeMusic: () => set({ isMusicPlaying: true }),
      stopMusic: () => set({ isMusicPlaying: false, musicQueue: [], musicIndex: 0, musicConvId: null }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      toggleLoop: () => set(state => ({ musicLoop: !state.musicLoop })),
      setListeningAlong: (on) => set({ isListeningAlong: on }),
    }),
    {
      name: 'mototrack-storage',
      partialize: (state) => ({
        user: state.user,
        bikes: state.bikes,
        maintenance: state.maintenance,
        savedTripIds: state.savedTripIds,
        activeBikeId: state.activeBikeId,
        activeGroupId: state.activeGroupId,
        setupCompletedForUserId: state.setupCompletedForUserId,
        eventInteractions: state.eventInteractions,
      }),
    }
  )
)
