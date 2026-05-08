import { useEffect, useRef } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useRealtimeRiders() {
  const updateRiderPosition = useStore(s => s.updateRiderPosition)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isSupabaseReady) return

    channelRef.current = supabase
      .channel('riders-location')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'riders' },
        (payload) => {
          const r = payload.new as any
          updateRiderPosition(r.id, r.lat, r.lng, r.speed)
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [])
}
