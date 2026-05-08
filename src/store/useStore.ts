import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Rider, Group, Bike, MaintenanceRecord, WeatherData, TabId, TripTemplate, ChatMessage, Conversation, VoiceChannelParticipant, MusicTrack } from '../types'
import {
  MOCK_RIDERS, MOCK_GROUPS, MOCK_BIKES, MOCK_MAINTENANCE, MOCK_TRIP_TEMPLATES,
  MOCK_CONVERSATIONS, MOCK_MESSAGES,
} from '../data/mockData'
import { isSupabaseReady } from '../lib/supabase'
import {
  dbSignIn, dbSignUp, dbSignInWithGoogle, dbSignOut, dbGetProfile,
  dbGetBikes, dbInsertBike, dbGetMaintenance, dbInsertMaintenance, dbUpdateOdometer,
  dbGetConversations, dbGetMessages, dbSendMessage, dbMarkRead, dbToggleReaction,
  dbUpsertRider, dbUpdateLocation, dbSetRiderOffline,
} from '../lib/db'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  provider: 'email' | 'google'
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
  activeBikeId: string | null
  addBike: (bike: Omit<Bike, 'id'>) => Promise<void>
  setActiveBike: (bikeId: string) => void
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => Promise<void>
  updateOdometer: (bikeId: string, km: number) => Promise<void>

  // Explore
  tripTemplates: TripTemplate[]
  likeTrip: (tripId: string) => void
  saveTrip: (tripId: string) => void
  savedTripIds: string[]

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
        set({ user: null, bikes: MOCK_BIKES, maintenance: MOCK_MAINTENANCE })
      },

      loadUserData: async (userId: string) => {
        if (!isSupabaseReady) return
        try {
          const [bikes, convs] = await Promise.all([
            dbGetBikes(userId),
            dbGetConversations(userId),
          ])
          const maintenance = bikes.length ? await dbGetMaintenance(bikes.map(b => b.id)) : []
          set({
            bikes: bikes.length ? bikes : MOCK_BIKES,
            maintenance: maintenance.length ? maintenance : MOCK_MAINTENANCE,
            conversations: convs.length ? convs : MOCK_CONVERSATIONS,
          })

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
      riders: MOCK_RIDERS,
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
      bikes: MOCK_BIKES,
      maintenance: MOCK_MAINTENANCE,
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

      setActiveBike: (bikeId) => set({ activeBikeId: bikeId }),

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
            const { latitude: lat, longitude: lng, speed } = pos.coords
            dbUpdateLocation(riderId, lat, lng, Math.round((speed ?? 0) * 3.6), 0).catch(() => {})
            get().updateRiderPosition(riderId, lat, lng, Math.round((speed ?? 0) * 3.6))
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
      conversations: MOCK_CONVERSATIONS,
      messages: MOCK_MESSAGES,
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
      }),
    }
  )
)
