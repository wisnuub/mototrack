import { useEffect, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useRealtimeMessages(conversationId: string | null) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isSupabaseReady || !conversationId) return

    channelRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as any
          // Avoid adding own messages twice (already added optimistically)
          const myId = useStore.getState().user?.id
          if (msg.sender_id === myId) return

          const mapped = {
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

          useStore.setState(state => ({
            messages: [...state.messages, mapped as any],
            conversations: state.conversations.map(c =>
              c.id === conversationId
                ? { ...c, lastMessage: mapped as any, unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount + 1 }
                : c
            ),
          }))
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [conversationId])
}
