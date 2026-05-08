import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { KINTAMANI_ROUTE } from '../data/mockData'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function getHeading(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const dLng = to.lng - from.lng
  const dLat = to.lat - from.lat
  return (Math.atan2(dLng, dLat) * 180) / Math.PI
}

const PROGRESS_RATES: Record<string, number> = {
  'rider-1': 0.0004,
  'rider-2': 0.0005,
  'rider-3': 0,
  'rider-4': 0.00035,
  'rider-5': 0.0006,
}

export function useRideSimulation(active: boolean) {
  const riders = useStore(s => s.riders)
  const updateRiderPosition = useStore(s => s.updateRiderPosition)
  const progressRef = useRef<Record<string, number>>(
    Object.fromEntries(riders.map(r => [r.id, r.routeProgress]))
  )

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      riders.forEach(rider => {
        if (rider.id === 'rider-1') return
        const rate = PROGRESS_RATES[rider.id] ?? 0
        if (rate === 0) return

        const cur = progressRef.current[rider.id] ?? rider.routeProgress
        const next = (cur + rate) % 1
        progressRef.current[rider.id] = next

        const route = KINTAMANI_ROUTE
        const total = route.length - 1
        const exactIdx = next * total
        const fromIdx = Math.floor(exactIdx)
        const toIdx = Math.min(fromIdx + 1, total)
        const t = exactIdx - fromIdx

        const from = route[fromIdx]
        const to = route[toIdx]
        const lat = lerp(from.lat, to.lat, t)
        const lng = lerp(from.lng, to.lng, t)

        const jitter = 0.0001
        const speed = Math.round((rate / 0.0005) * 65 + Math.random() * 10 - 5)

        updateRiderPosition(
          rider.id,
          lat + (Math.random() - 0.5) * jitter,
          lng + (Math.random() - 0.5) * jitter,
          speed
        )
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [active, riders, updateRiderPosition])
}
