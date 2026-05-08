import { supabase } from './supabase'
import type { Bike, MaintenanceRecord, Conversation, ChatMessage, MusicTrack, BikeModification, ModCategory } from '../types'

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

export async function dbUpdateProfile(userId: string, name: string, avatar: string, location?: string) {
  await supabase.from('profiles').upsert({ id: userId, name, avatar, location })
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
    })
    .select()
    .single()
  if (error) throw error
  return rowToMessage(data)
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
  }
}
