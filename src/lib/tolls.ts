// Indonesian toll road database — motorcycle rates only.
// Java toll roads prohibit motorcycles (Gol I = cars only on Trans-Java).
// Only Bali Mandara Toll Road (Nusa Dua–Ngurah Rai–Benoa) allows motorcycles.

export interface TollSegment {
  name: string
  motorcycleRateIDR: number
  // Rough bounding box of the toll road corridor
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  // Entry/exit gate coordinates for more accurate detection
  gates: { lat: number; lng: number; name: string }[]
}

export const TOLL_SEGMENTS: TollSegment[] = [
  {
    name: 'Bali Mandara Toll Road',
    motorcycleRateIDR: 5500,
    // Nusa Dua ↔ Ngurah Rai Airport ↔ Benoa — over the sea causeway
    bounds: { minLat: -8.790, maxLat: -8.740, minLng: 115.155, maxLng: 115.240 },
    gates: [
      { lat: -8.7867, lng: 115.1723, name: 'Nusa Dua Gate' },
      { lat: -8.7528, lng: 115.1670, name: 'Ngurah Rai North Gate' },
      { lat: -8.7480, lng: 115.2120, name: 'Benoa Gate' },
    ],
  },
]

// Returns list of toll segments that a route geometry passes through.
// Uses a simple bounding-box check on the route polyline.
export function detectTolls(
  routeGeometry: [number, number][],
): TollSegment[] {
  if (routeGeometry.length === 0) return []
  const hit = new Set<TollSegment>()
  for (const seg of TOLL_SEGMENTS) {
    const { minLat, maxLat, minLng, maxLng } = seg.bounds
    const passes = routeGeometry.some(
      ([lat, lng]) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
    )
    if (passes) hit.add(seg)
  }
  return [...hit]
}

export function formatTollSummary(tolls: TollSegment[]): string | null {
  if (tolls.length === 0) return null
  const total = tolls.reduce((sum, t) => sum + t.motorcycleRateIDR, 0)
  const names = tolls.map(t => t.name).join(', ')
  return `🛣️ ${names} — Rp ${total.toLocaleString('id-ID')}`
}
