export interface LatLng {
  lat: number
  lng: number
}

export type RiderStatus = 'riding' | 'stopped' | 'offline'
export type BikeType = 'sport' | 'naked' | 'matic' | 'cruiser' | 'adventure' | 'touring'
export type MaintenanceType = 'oil_change' | 'vbelt' | 'tire_front' | 'tire_rear' | 'brake_front' | 'brake_rear' | 'chain' | 'full_service' | 'other'
export type ModCategory =
  | 'rims' | 'lamp' | 'phone_holder' | 'ecu_cdi' | 'spark_plug'
  | 'shockbreaker' | 'stabilizer' | 'exhaust' | 'brake' | 'air_filter'
  | 'handle_bar' | 'seat' | 'windshield' | 'body_kit' | 'other'

export interface BikeModification {
  id: string
  bikeId: string
  category: ModCategory
  name: string
  brand?: string
  notes?: string
  shopUrl?: string
  price?: number
  installedAt?: Date
  createdAt: Date
}
export type TabId = 'map' | 'chat' | 'garage' | 'explore' | 'weather'

export interface GarageShareData {
  bikeId: string
  bikeName: string
  bikeImage?: string
  brandColor?: string
  mod?: { id: string; name: string; brand?: string; category: string }
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: 'text' | 'location' | 'ride_invite' | 'system' | 'now_playing' | 'garage_share'
  timestamp: Date
  reactions: { emoji: string; userIds: string[] }[]
  rideData?: { groupName: string; destination: string; departureTime: string }
  locationData?: { lat: number; lng: number; name?: string }
  musicData?: MusicTrack
  garageData?: GarageShareData
}

export interface Conversation {
  id: string
  type: 'group' | 'dm'
  name: string
  emoji?: string
  participantIds: string[]
  groupId?: string
  unreadCount: number
  isPinned: boolean
  lastMessage?: ChatMessage
}

export interface VoiceChannelParticipant {
  riderId: string
  name: string
  avatar: string
  isMuted: boolean
  isSpeaking: boolean
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  artworkUrl: string
  previewUrl: string
  durationMs: number
  source?: 'youtube' | 'itunes'
}

export interface Rider {
  id: string
  name: string
  avatar: string // emoji or initials
  color: string  // hex for marker
  position: LatLng
  heading: number
  speed: number
  status: RiderStatus
  bikeId: string
  lastSeen: Date
  routeProgress: number // 0-1 along current route
}

export interface Group {
  id: string
  name: string
  emoji: string
  description: string
  members: string[]
  ownerId: string
  destination?: LatLng
  destinationName?: string
  route?: LatLng[]
  meetPoint?: LatLng
  meetPointName?: string
  isActive: boolean
  createdAt: Date
}

export type OilType = 'mineral' | 'semi-synthetic' | 'fully-synthetic'
export type DriveType = 'vbelt' | 'chain' | 'shaft'

export interface Bike {
  id: string
  riderId: string
  nickname: string
  brand: string
  model: string
  year: number
  type: BikeType
  cc: number
  color: string
  plateNumber: string
  odometer: number
  // New fields
  isFavorite: boolean
  photo?: string          // base64 data URL (user-uploaded)
  imageUrl?: string       // manufacturer/CDN image URL
  notes?: string
  // Oil
  oilBrand?: string
  oilType?: OilType
  oilSAE?: string
  // Tires
  tireFrontBrand?: string
  tireFrontHealth?: number  // 0–100
  tireRearBrand?: string
  tireRearHealth?: number   // 0–100
  // Drive system
  driveType?: DriveType
  driveBrand?: string
  driveHealth?: number      // 0–100
}

export interface MaintenanceRecord {
  id: string
  bikeId: string
  type: MaintenanceType
  date: Date
  odometer: number
  notes: string
  nextServiceKm?: number
  nextServiceDate?: Date
  cost?: number
}

export interface WeatherPoint {
  hour: number
  temp: number
  precipProb: number
  weatherCode: number
}

export interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  uvIndex: number
  hourly: WeatherPoint[]
  fetchedAt: Date
}

export interface TripTemplate {
  id: string
  title: string
  description: string
  authorName: string
  authorAvatar: string
  difficulty: 'easy' | 'moderate' | 'hard'
  distanceKm: number
  estimatedHours: number
  route: LatLng[]
  waypoints: { position: LatLng; name: string; description: string; type: 'attraction' | 'fuel' | 'food' | 'rest' | 'photo' }[]
  tags: string[]
  likes: number
  saves: number
  region: string
  coverImage?: string
}

export interface Attraction {
  id: string
  name: string
  type: 'viewpoint' | 'temple' | 'food' | 'fuel' | 'beach' | 'waterfall' | 'market' | 'mechanic'
  position: LatLng
  description: string
  rating: number
  distanceKm?: number
}

// ─── Activity / Posts ──────────────────────────────────────────
export type ActivityType = 'post' | 'service' | 'ride' | 'story'
export type BadgeType =
  | 'dev' | 'influencer' | 'founder' | 'verified'
  | 'yamaha' | 'honda' | 'kawasaki' | 'suzuki' | 'ktm'
  | 'bmw' | 'ducati' | 'triumph' | 'brand'

export interface ActivityPost {
  id: string
  userId: string
  userName: string
  userAvatar: string
  badges?: BadgeType[]
  bikeId?: string
  bikeName?: string
  activityType: ActivityType
  title: string
  description?: string
  imageUrl?: string
  displayTime: Date   // when the activity happened (user-set)
  createdAt: Date     // when actually posted
  isPublic: boolean
  location?: string
  likes: number
  likedBy: string[]
}

// ─── Events ────────────────────────────────────────────────────
export type EventCategory = 'track_day' | 'kopdar' | 'touring' | 'competition' | 'workshop' | 'launch' | 'community'
export type TicketType = 'free' | 'paid'

export interface MotoEvent {
  id: string
  organizerName: string
  organizerAvatar: string
  organizerBadges: BadgeType[]
  isVerifiedOrganizer: boolean
  category: EventCategory
  title: string
  description: string
  highlights?: string[]
  coverEmoji: string
  date: Date
  endDate?: Date
  location: string
  locationUrl?: string
  ticketType: TicketType
  ticketPrice?: number        // IDR
  ticketUrl?: string
  whatsappNumber?: string
  interestedCount: number
  attendingCount: number
  maxCapacity?: number
  isNonRefundable: boolean
  tags: string[]
}

// ─── Shop Products ──────────────────────────────────────────────
export type ProductCategory = 'oil' | 'chain_lube' | 'accessories' | 'apparel' | 'parts' | 'tires' | 'gear'

export interface ShopProduct {
  id: string
  sellerName: string
  sellerAvatar: string
  sellerBadges: BadgeType[]
  isOfficialStore: boolean
  category: ProductCategory
  name: string
  description: string
  imageEmoji?: string
  imageUrl?: string
  priceIDR: number
  originalPriceIDR?: number
  rating: number
  reviewCount: number
  soldCount: number
  buyUrl?: string             // Tokopedia/Shopee
  whatsappNumber?: string
  inStock: boolean
  tags: string[]
  isNew?: boolean
  isFeatured?: boolean
}

// ─── Community Mods (aggregated popularity) ────────────────────
export interface CommunityMod {
  id: string
  category: string
  name: string
  brand: string
  riderCount: number
  avgRating: number
  imageEmoji: string
  priceRange: string          // e.g. "Rp 800K – 1.2Jt"
  buyUrl?: string
}

// ─── Event interaction (local state) ───────────────────────────
export interface EventInteraction {
  eventId: string
  type: 'interested' | 'attending'
}

// ─── Ride Sessions ─────────────────────────────────────────────
export interface RideWaypoint {
  lat: number
  lng: number
  timestamp: number
  speed: number      // km/h
  heading: number
  altitude?: number
}

export interface RideSession {
  id: string
  userId: string
  bikeId?: string
  bikeName?: string
  startTime: Date
  endTime?: Date
  durationMs?: number
  distanceKm: number
  maxSpeedKmh: number
  avgSpeedKmh: number
  maxLeanAngle?: number   // degrees, from device gyroscope
  route: RideWaypoint[]
  startLocation?: string
  endLocation?: string
  isActive: boolean
}
