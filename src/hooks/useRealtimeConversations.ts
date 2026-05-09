import { useEffect, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { dbGetConversations } from '../lib/db'

// Maps a raw Supabase message row → ChatMessage-compatible object
function mapMsg(msg: any) {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id ?? 'system',
    senderName: msg.sender_name ?? '',
    senderAvatar: msg.sender_avatar ?? '🤙',
    content: msg.content ?? '',
    type: msg.type ?? 'text',
    timestamp: new Date(msg.created_at),
    reactions: [],
    rideData: msg.ride_data ?? undefined,
    locationData: msg.location_data ?? undefined,
    musicData: msg.music_data ?? undefined,
  }
}

export function useRealtimeConversations() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isSupabaseReady) return

    // Single channel with two listeners:
    // 1. Any new message → update lastMessage + unreadCount in the right conversation
    // 2. Any new conversation_participant row for this user → reload conversation list
    channelRef.current = supabase
      .channel('chat-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any
          const { user, activeConversationId, conversations } = useStore.getState()
          const myId = user?.id
          // Skip own messages (already added optimistically)
          if (msg.sender_id === myId) return
          // Only update if we're a participant in this conversation
          const inConv = conversations.some(c => c.id === msg.conversation_id)
          if (!inConv) return

          const mapped = mapMsg(msg)
          useStore.setState(state => ({
            messages: [...state.messages, mapped as any],
            conversations: state.conversations.map(c =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    lastMessage: mapped as any,
                    unreadCount: activeConversationId === c.id ? 0 : c.unreadCount + 1,
                  }
                : c
            ),
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants' },
        async (payload) => {
          const row = payload.new as any
          const myId = useStore.getState().user?.id
          if (row.user_id !== myId) return
          // Someone added us to a new conversation — reload the full list
          try {
            const convs = await dbGetConversations(myId!)
            useStore.setState(state => {
              // Merge: keep any local-only convs (temp IDs not yet in DB)
              const dbIds = new Set(convs.map(c => c.id))
              const localOnly = state.conversations.filter(c => !dbIds.has(c.id) && c.id.startsWith('conv-'))
              return { conversations: [...convs, ...localOnly] }
            })
          } catch {}
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, []) // mount once — user change handled by loadUserData
}
