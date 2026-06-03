import { supabase } from './supabase'
import type { Bike, MaintenanceRecord, Conversation, ChatMessage, MusicTrack, BikeModification, ModCategory, GarageShareData, ActivityPost, ActivityType, RideSession, RideWaypoint } from '../types'

// ─── Auth ─────────────────────────────────────────────────────

export async function dbSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user!
}

export async function dbSignUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) throw error
  return data.user!
}

export async function dbSignInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function dbSignOut() {
  await supabase.auth.signOut()
}

export async function dbGetSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function dbGetProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function dbGetProfilesByIds(ids: string[]): Promise<{ id: string; name: string; avatar: string }[]> {
  if (!ids.length) return []
  const { data } = await supabase.from('profiles').select('id, name, avatar').in('id', ids)
  return data ?? []
}

export async function dbUpdateProfile(userId: string, name: string, avatar: string, location?: string) {
  await supabase.from('profiles').upsert({ id: userId, name, avatar, location })
}

export async function dbSetUsername(userId: string, username: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update({ username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') }).eq('id', userId)
  if (error?.code === '23505') return { error: 'Username already taken' }
  return { error: error ? error.message : null }
}

export async function dbFindUsersByUsername(query: string): Promise<{ id: string; name: string; avatar: string; username: string }[]> {
  if (!query.trim()) return []
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar, username')
    .ilike('username', `%${query.trim()}%`)
    .not('username', 'is', null)
    .limit(10)
  return data ?? []
}

export async function dbUploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

// ─── Rider location ───────────────────────────────────────────

export async function dbUpsertRider(userId: string, riderId: string, name: string, avatar: string, color: string) {
  await supabase.from('riders').upsert({
    id: riderId,
    user_id: userId,
    name,
    avatar,
    color,
    status: 'riding',
    updated_at: new Date().toISOString(),
  })
}

export async function dbUpdateLocation(riderId: string, lat: number, lng: number, speed: number, heading: number) {
  await supabase.from('riders').update({
    lat, lng, speed, heading,
    status: speed > 2 ? 'riding' : 'stopped',
    updated_at: new Date().toISOString(),
  }).eq('id', riderId)
}

export async function dbSetRiderOffline(riderId: string) {
  await supabase.from('riders').update({ status: 'offline', speed: 0 }).eq('id', riderId)
}

export async function dbGetAllRiders() {
  const { data } = await supabase.from('riders').select('*')
  return data ?? []
}

// ─── Groups ───────────────────────────────────────────────────

export async function dbGetGroups(userId: string) {
  const { data } = await supabase
    .from('groups')
    .select('*, group_members!inner(user_id)')
    .eq('group_members.user_id', userId)
  return data ?? []
}

export async function dbCreateGroup(ownerId: string, name: string, emoji: string, description: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, emoji, description, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error
  await supabase.from('group_members').insert({ group_id: data.id, user_id: ownerId })
  return data
}

// ─── Bikes ────────────────────────────────────────────────────

export async function dbGetBikes(userId: string): Promise<Bike[]> {
  const { data } = await supabase.from('bikes').select('*').eq('user_id', userId).order('created_at')
  return (data ?? []).map(dbRowToBike)
}

export async function dbInsertBike(userId: string, bike: Omit<Bike, 'id'>): Promise<Bike> {
  const { data, error } = await supabase
    .from('bikes')
    .insert({
      user_id: userId,
      nickname: bike.nickname,
      brand: bike.brand,
      model: bike.model,
      year: bike.year,
      type: bike.type,
      cc: bike.cc,
      color: bike.color,
      plate_number: bike.plateNumber,
      odometer: bike.odometer,
      is_favorite: bike.isFavorite,
      photo: bike.photo,
      image_url: bike.imageUrl,
      notes: bike.notes,
      oil_brand: bike.oilBrand,
      oil_type: bike.oilType,
      oil_sae: bike.oilSAE,
      tire_front_brand: bike.tireFrontBrand,
      tire_front_health: bike.tireFrontHealth,
      tire_rear_brand: bike.tireRearBrand,
      tire_rear_health: bike.tireRearHealth,
      drive_type: bike.driveType,
      drive_brand: bike.driveBrand,
      drive_health: bike.driveHealth,
    })
    .select()
    .single()
  if (error) throw error
  return dbRowToBike(data)
}

export async function dbUpdateOdometer(bikeId: string, km: number) {
  await supabase.from('bikes').update({ odometer: km }).eq('id', bikeId)
}

function dbRowToBike(row: any): Bike {
  return {
    id: row.id,
    riderId: row.user_id,
    nickname: row.nickname ?? '',
    brand: row.brand,
    model: row.model,
    year: row.year,
    type: row.type,
    cc: row.cc,
    color: row.color ?? '#ff6b35',
    plateNumber: row.plate_number ?? '',
    odometer: row.odometer ?? 0,
    isFavorite: row.is_favorite ?? false,
    photo: row.photo,
    imageUrl: row.image_url,
    notes: row.notes,
    oilBrand: row.oil_brand,
    oilType: row.oil_type,
    oilSAE: row.oil_sae,
    tireFrontBrand: row.tire_front_brand,
    tireFrontHealth: row.tire_front_health,
    tireRearBrand: row.tire_rear_brand,
    tireRearHealth: row.tire_rear_health,
    driveType: row.drive_type,
    driveBrand: row.drive_brand,
    driveHealth: row.drive_health,
  }
}

// ─── Maintenance ──────────────────────────────────────────────

export async function dbGetMaintenance(bikeIds: string[]): Promise<MaintenanceRecord[]> {
  if (!bikeIds.length) return []
  const { data } = await supabase
    .from('maintenance_records')
    .select('*')
    .in('bike_id', bikeIds)
    .order('date', { ascending: false })
  return (data ?? []).map((row: any): MaintenanceRecord => ({
    id: row.id,
    bikeId: row.bike_id,
    type: row.type,
    date: new Date(row.date),
    odometer: row.odometer ?? 0,
    notes: row.notes ?? '',
    nextServiceKm: row.next_service_km,
    nextServiceDate: row.next_service_date ? new Date(row.next_service_date) : undefined,
    cost: row.cost,
  }))
}

// ─── Bike Modifications ───────────────────────────────────────

export async function dbGetModifications(bikeIds: string[]): Promise<BikeModification[]> {
  if (!bikeIds.length) return []
  const { data } = await supabase
    .from('bike_modifications')
    .select('*')
    .in('bike_id', bikeIds)
    .order('created_at', { ascending: false })
  return (data ?? []).map((row: any): BikeModification => ({
    id: row.id,
    bikeId: row.bike_id,
    category: row.category as ModCategory,
    name: row.name,
    brand: row.brand ?? undefined,
    notes: row.notes ?? undefined,
    shopUrl: row.shop_url ?? undefined,
    price: row.price ?? undefined,
    installedAt: row.installed_at ? new Date(row.installed_at) : undefined,
    createdAt: new Date(row.created_at),
  }))
}

export async function dbInsertModification(
  bikeId: string,
  mod: Omit<BikeModification, 'id' | 'bikeId' | 'createdAt'>
): Promise<BikeModification> {
  const { data, error } = await supabase
    .from('bike_modifications')
    .insert({
      bike_id: bikeId,
      category: mod.category,
      name: mod.name,
      brand: mod.brand ?? null,
      notes: mod.notes ?? null,
      shop_url: mod.shopUrl ?? null,
      price: mod.price ?? null,
      installed_at: mod.installedAt ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    bikeId: data.bike_id,
    category: data.category,
    name: data.name,
    brand: data.brand ?? undefined,
    notes: data.notes ?? undefined,
    shopUrl: data.shop_url ?? undefined,
    price: data.price ?? undefined,
    installedAt: data.installed_at ? new Date(data.installed_at) : undefined,
    createdAt: new Date(data.created_at),
  }
}

export async function dbDeleteModification(id: string) {
  await supabase.from('bike_modifications').delete().eq('id', id)
}

export async function dbInsertMaintenance(record: Omit<MaintenanceRecord, 'id'>) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({
      bike_id: record.bikeId,
      type: record.type,
      date: record.date,
      odometer: record.odometer,
      notes: record.notes,
      next_service_km: record.nextServiceKm,
      next_service_date: record.nextServiceDate,
      cost: record.cost,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Conversations ────────────────────────────────────────────

export async function dbGetConversations(userId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_participants!inner(user_id, unread_count),
      messages(id, content, type, sender_name, created_at, music_data)
    `)
    .eq('conversation_participants.user_id', userId)
    .order('created_at', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' })
  return (data ?? []).map((row: any): Conversation => ({
    id: row.id,
    type: row.type,
    name: row.name,
    emoji: row.emoji,
    groupId: row.group_id,
    participantIds: [],
    unreadCount: row.conversation_participants?.[0]?.unread_count ?? 0,
    isPinned: row.is_pinned ?? false,
    lastMessage: row.messages?.[0] ? rowToMessage(row.messages[0]) : undefined,
  }))
}

export async function dbGetMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('messages')
    .select('*, message_reactions(emoji, user_id)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)
  return (data ?? []).map(rowToMessage)
}

export async function dbSendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  content: string,
  type: ChatMessage['type'],
  extra: Partial<ChatMessage> = {}
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content,
      type,
      ride_data: extra.rideData ?? null,
      location_data: extra.locationData ?? null,
      music_data: extra.musicData ?? null,
      garage_data: extra.garageData ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return rowToMessage(data)
}

export async function dbCreateConversation(
  type: 'group' | 'dm',
  name: string,
  emoji: string,
  participantIds: string[]
): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ type, name, emoji })
    .select('id')
    .single()
  if (error) throw error
  const convId: string = data.id
  await supabase.from('conversation_participants').insert(
    participantIds.map(uid => ({ conversation_id: convId, user_id: uid, unread_count: 0 }))
  )
  return convId
}

export async function dbMarkRead(conversationId: string, userId: string) {
  await supabase
    .from('conversation_participants')
    .update({ unread_count: 0, last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
}

export async function dbToggleReaction(messageId: string, userId: string, emoji: string) {
  const { data } = await supabase
    .from('message_reactions')
    .select()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (data) {
    await supabase.from('message_reactions').delete()
      .eq('message_id', messageId).eq('user_id', userId).eq('emoji', emoji)
  } else {
    await supabase.from('message_reactions').insert({ message_id: messageId, user_id: userId, emoji })
  }
}

// ─── Activity Posts ───────────────────────────────────────────

export async function dbGetActivityPosts(userId: string): Promise<ActivityPost[]> {
  const { data } = await supabase
    .from('activity_posts')
    .select('*')
    .eq('user_id', userId)
    .order('display_time', { ascending: false })
    .limit(50)
  return (data ?? []).map(rowToActivityPost)
}

export async function dbGetPublicFeed(limit = 30): Promise<ActivityPost[]> {
  const { data } = await supabase
    .from('activity_posts')
    .select('*')
    .eq('is_public', true)
    .order('display_time', { ascending: false })
    .limit(limit)
  return (data ?? []).map(rowToActivityPost)
}

export async function dbInsertActivityPost(
  userId: string,
  userName: string,
  userAvatar: string,
  badges: string[],
  post: Omit<ActivityPost, 'id' | 'userId' | 'userName' | 'userAvatar' | 'badges' | 'createdAt' | 'likes' | 'likedBy'>
): Promise<ActivityPost> {
  const { data, error } = await supabase
    .from('activity_posts')
    .insert({
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      badges,
      bike_id: post.bikeId ?? null,
      bike_name: post.bikeName ?? null,
      activity_type: post.activityType,
      title: post.title,
      description: post.description ?? null,
      image_url: post.imageUrl ?? null,
      display_time: post.displayTime.toISOString(),
      is_public: post.isPublic,
      location: post.location ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return rowToActivityPost(data)
}

export async function dbDeleteActivityPost(id: string) {
  await supabase.from('activity_posts').delete().eq('id', id)
}

export async function dbTogglePostLike(postId: string, userId: string): Promise<void> {
  const { data } = await supabase
    .from('activity_posts')
    .select('liked_by, likes')
    .eq('id', postId)
    .single()
  if (!data) return
  const likedBy: string[] = data.liked_by ?? []
  const already = likedBy.includes(userId)
  await supabase.from('activity_posts').update({
    liked_by: already ? likedBy.filter(id => id !== userId) : [...likedBy, userId],
    likes: already ? Math.max(0, data.likes - 1) : data.likes + 1,
  }).eq('id', postId)
}

function rowToActivityPost(row: any): ActivityPost {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? '',
    userAvatar: row.user_avatar ?? '🤙',
    badges: row.badges ?? [],
    bikeId: row.bike_id ?? undefined,
    bikeName: row.bike_name ?? undefined,
    activityType: row.activity_type as ActivityType,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    displayTime: new Date(row.display_time),
    createdAt: new Date(row.created_at),
    isPublic: row.is_public ?? true,
    location: row.location ?? undefined,
    likes: row.likes ?? 0,
    likedBy: row.liked_by ?? [],
  }
}

// ─── Ride Sessions ────────────────────────────────────────────

export async function dbInsertRideSession(userId: string, session: Omit<RideSession, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('ride_sessions')
    .insert({
      user_id: userId,
      bike_id: session.bikeId ?? null,
      bike_name: session.bikeName ?? null,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime?.toISOString() ?? null,
      duration_ms: session.durationMs ?? null,
      distance_km: session.distanceKm,
      max_speed_kmh: session.maxSpeedKmh,
      avg_speed_kmh: session.avgSpeedKmh,
      max_lean_angle: session.maxLeanAngle ?? null,
      route: session.route,
      start_location: session.startLocation ?? null,
      end_location: session.endLocation ?? null,
      is_active: session.isActive,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function dbGetRideSessions(userId: string): Promise<RideSession[]> {
  const { data } = await supabase
    .from('ride_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(20)
  return (data ?? []).map((row: any): RideSession => ({
    id: row.id,
    userId: row.user_id,
    bikeId: row.bike_id ?? undefined,
    bikeName: row.bike_name ?? undefined,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    durationMs: row.duration_ms ?? undefined,
    distanceKm: row.distance_km ?? 0,
    maxSpeedKmh: row.max_speed_kmh ?? 0,
    avgSpeedKmh: row.avg_speed_kmh ?? 0,
    maxLeanAngle: row.max_lean_angle ?? undefined,
    route: row.route ?? [],
    startLocation: row.start_location ?? undefined,
    endLocation: row.end_location ?? undefined,
    isActive: row.is_active ?? false,
  }))
}

// ─── Badge Applications ───────────────────────────────────────

export interface BadgeApplication {
  id: string
  userId: string
  userName: string
  userAvatar: string
  badgeType: 'influencer'
  instagramUrl: string
  youtubeUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  reviewedAt?: Date
}

export async function dbApplyForBadge(
  userId: string,
  userName: string,
  userAvatar: string,
  instagramUrl: string,
  youtubeUrl: string
): Promise<void> {
  const { error } = await supabase.from('badge_applications').upsert({
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    badge_type: 'influencer',
    instagram_url: instagramUrl,
    youtube_url: youtubeUrl || null,
    status: 'pending',
  }, { onConflict: 'user_id,badge_type' })
  if (error) throw error
}

export async function dbGetBadgeApplications(): Promise<BadgeApplication[]> {
  const { data } = await supabase
    .from('badge_applications')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []).map((row: any): BadgeApplication => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    badgeType: row.badge_type,
    instagramUrl: row.instagram_url,
    youtubeUrl: row.youtube_url ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
  }))
}

export async function dbReviewBadgeApplication(
  applicationId: string,
  userId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  await supabase.from('badge_applications').update({
    status,
    reviewed_at: new Date().toISOString(),
  }).eq('id', applicationId)

  if (status === 'approved') {
    // Add badge to user profile
    const { data: profile } = await supabase.from('profiles').select('badges').eq('id', userId).single()
    const existing: string[] = profile?.badges ?? []
    if (!existing.includes('influencer')) {
      await supabase.from('profiles').update({ badges: [...existing, 'influencer'] }).eq('id', userId)
    }
  }
}

export async function dbBanUser(userId: string): Promise<void> {
  await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
}

export async function dbGetAdminProfile(userId: string): Promise<{ isAdmin: boolean; badges: string[] }> {
  const { data } = await supabase.from('profiles').select('is_admin, badges').eq('id', userId).single()
  return { isAdmin: data?.is_admin ?? false, badges: data?.badges ?? [] }
}

function rowToMessage(row: any): ChatMessage {
  const reactions: ChatMessage['reactions'] = []
  for (const r of row.message_reactions ?? []) {
    const existing = reactions.find(x => x.emoji === r.emoji)
    if (existing) existing.userIds.push(r.user_id)
    else reactions.push({ emoji: r.emoji, userIds: [r.user_id] })
  }
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id ?? 'system',
    senderName: row.sender_name ?? '',
    senderAvatar: row.sender_avatar ?? '🤙',
    content: row.content ?? '',
    type: row.type ?? 'text',
    timestamp: new Date(row.created_at),
    reactions,
    rideData: row.ride_data ?? undefined,
    locationData: row.location_data ?? undefined,
    musicData: row.music_data as MusicTrack | undefined,
    garageData: row.garage_data as GarageShareData | undefined,
  }
}
