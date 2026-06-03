import { useEffect, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useRealtimeRiders() {
  const upsertRider = useStore(s => s.upsertRider)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isSupabaseReady) return

    channelRef.current = supabase
      .channel('riders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'riders' },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          upsertRider(payload.new as Record<string, any>)
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [])
}
